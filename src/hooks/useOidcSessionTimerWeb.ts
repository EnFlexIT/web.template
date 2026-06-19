import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";

import { useAppDispatch } from "./useAppDispatch";
import { useAppSelector } from "./useAppSelector";
import {
  fetchAppSettings,
  selectIp,
} from "../redux/slices/apiSlice";
import {
  loadSessionTime,
  selectSessionTime,
} from "../redux/slices/sessionTimeSlice";

type Options = {
  enabled: boolean;
  warnMs: number;
  onLogout: () => void;
};

const AUTO_REFRESH_WINDOW_MS = 60_000;
const AUTO_REFRESH_COOLDOWN_MS = 10_000;

function getRemainingMs(params: {
  expirationTime?: number | null;
  remainingTime?: number | null;
  now: number;
}): number | null {
  if (
    typeof params.expirationTime === "number" &&
    Number.isFinite(params.expirationTime)
  ) {
    return params.expirationTime - params.now;
  }

  if (
    typeof params.remainingTime === "number" &&
    Number.isFinite(params.remainingTime)
  ) {
    return params.remainingTime;
  }

  return null;
}

function getEffectiveOidcRemainingMs(params: {
  sessionExpirationTime?: number | null;
  sessionRemainingTime?: number | null;
  tokenExpirationTime?: number | null;
  tokenRemainingTime?: number | null;
  now: number;
}): number | null {
  const sessionRemainingMs = getRemainingMs({
    expirationTime: params.sessionExpirationTime,
    remainingTime: params.sessionRemainingTime,
    now: params.now,
  });

  const tokenRemainingMs = getRemainingMs({
    expirationTime: params.tokenExpirationTime,
    remainingTime: params.tokenRemainingTime,
    now: params.now,
  });

  const validValues = [sessionRemainingMs, tokenRemainingMs].filter(
    (value): value is number =>
      typeof value === "number" && Number.isFinite(value),
  );

  if (validValues.length === 0) return null;

  return Math.min(...validValues);
}

export function useOidcSessionTimerWeb({
  enabled,
  warnMs,
  onLogout,
}: Options) {
  const dispatch = useAppDispatch();

  const baseUrl = useAppSelector(selectIp);
  const sessionTime = useAppSelector(selectSessionTime);

  const [now, setNow] = useState(Date.now());

  const lastLogoutAtRef = useRef<number>(0);
  const lastRefreshAtRef = useRef<number>(0);
  const refreshRunningRef = useRef<boolean>(false);

  const remainingMs = useMemo(() => {
    if (!sessionTime.lastCheckedAt) return null;

    return getEffectiveOidcRemainingMs({
      sessionExpirationTime: sessionTime.expirationTime,
      sessionRemainingTime: sessionTime.remainingTime,
      tokenExpirationTime: sessionTime.tokenExpirationTime,
      tokenRemainingTime: sessionTime.remainingTokenTime,
      now,
    });
  }, [
    sessionTime.lastCheckedAt,
    sessionTime.expirationTime,
    sessionTime.remainingTime,
    sessionTime.tokenExpirationTime,
    sessionTime.remainingTokenTime,
    now,
  ]);

  const secondsLeft =
    remainingMs == null ? 0 : Math.max(0, Math.ceil(remainingMs / 1000));

  const warning =
    remainingMs != null && remainingMs > 0 && remainingMs <= warnMs;

const refreshSession = useCallback(async () => {
  if (!enabled) return;
  if (!baseUrl) return;
  if (refreshRunningRef.current) return;

  refreshRunningRef.current = true;

  try {
    const settingsResponse = await fetchAppSettings(baseUrl, null);

    if (
      settingsResponse.status === 301 ||
      settingsResponse.status === 302 ||
      settingsResponse.status === 303 ||
      settingsResponse.status === 307 ||
      settingsResponse.status === 308 ||
      settingsResponse.type === "opaqueredirect"
    ) {
      onLogout();
      return;
    }

    if (!settingsResponse.ok) {
      return;
    }

    await dispatch(loadSessionTime({ silent: true })).unwrap();
  } finally {
    refreshRunningRef.current = false;
  }
}, [baseUrl, dispatch, enabled, onLogout]);

  useEffect(() => {
    if (!enabled) return;
    if (Platform.OS !== "web") return;
    if (typeof window === "undefined") return;

    const tickId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(tickId);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    if (Platform.OS !== "web") return;

    void refreshSession();
  }, [enabled, refreshSession]);

  useEffect(() => {
    if (!enabled) return;
    if (remainingMs == null) return;
    if (remainingMs <= 0) return;
    if (remainingMs > AUTO_REFRESH_WINDOW_MS) return;

    const nowValue = Date.now();

    if (nowValue - lastRefreshAtRef.current < AUTO_REFRESH_COOLDOWN_MS) {
      return;
    }

    lastRefreshAtRef.current = nowValue;

    void refreshSession();
  }, [enabled, remainingMs, refreshSession]);

  useEffect(() => {
    if (!enabled) return;
    if (remainingMs == null) return;
    if (remainingMs > 0) return;

    const nowValue = Date.now();

    if (nowValue - lastLogoutAtRef.current < 1000) return;

    lastLogoutAtRef.current = nowValue;
    onLogout();
  }, [enabled, remainingMs, onLogout]);

  return {
    secondsLeft,
    warning,
    remainingMs,
    refreshSession,
  };
}