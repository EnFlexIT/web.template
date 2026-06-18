import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";

import { useAppDispatch } from "./useAppDispatch";
import { useAppSelector } from "./useAppSelector";
import {
  loadSessionTime,
  selectSessionTime,
} from "../redux/slices/sessionTimeSlice";

type Options = {
  enabled: boolean;
  warnMs: number;
  onLogout: () => void;
};

function getSessionRemainingMs(params: {
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

export function useOidcSessionTimerWeb({
  enabled,
  warnMs,
  onLogout,
}: Options) {
  const dispatch = useAppDispatch();
  const sessionTime = useAppSelector(selectSessionTime);

  const [now, setNow] = useState(Date.now());

  const lastLogoutAtRef = useRef<number>(0);
  const refreshRunningRef = useRef<boolean>(false);

  const remainingMs = useMemo(() => {
    if (!sessionTime.lastCheckedAt) return null;

    return getSessionRemainingMs({
      expirationTime: sessionTime.expirationTime,
      remainingTime: sessionTime.remainingTime,
      now,
    });
  }, [
    sessionTime.lastCheckedAt,
    sessionTime.expirationTime,
    sessionTime.remainingTime,
    now,
  ]);

  const secondsLeft =
    remainingMs == null ? 0 : Math.max(0, Math.ceil(remainingMs / 1000));

  const warning =
    remainingMs != null && remainingMs > 0 && remainingMs <= warnMs;

  const refreshSession = useCallback(async () => {
    if (!enabled) return;
    if (refreshRunningRef.current) return;

    refreshRunningRef.current = true;

    try {
      await dispatch(loadSessionTime({ silent: true })).unwrap();
    } finally {
      refreshRunningRef.current = false;
    }
  }, [dispatch, enabled]);

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