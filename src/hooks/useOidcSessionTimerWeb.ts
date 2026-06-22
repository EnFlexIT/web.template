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

function getRemainingMs(params: {
  expirationTime?: number | null;
  remainingTime?: number | null;
  lastCheckedAt?: number | null;
  now: number;
}): number | null {
  if (
    typeof params.remainingTime === "number" &&
    Number.isFinite(params.remainingTime) &&
    typeof params.lastCheckedAt === "number" &&
    Number.isFinite(params.lastCheckedAt)
  ) {
    return params.remainingTime - (params.now - params.lastCheckedAt);
  }

  if (
    typeof params.expirationTime === "number" &&
    Number.isFinite(params.expirationTime)
  ) {
    return params.expirationTime - params.now;
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

  const sessionRemainingMs = useMemo(() => {
    if (!sessionTime.lastCheckedAt) return null;

    return getRemainingMs({
      expirationTime: sessionTime.expirationTime,
      remainingTime: sessionTime.remainingTime,
      lastCheckedAt: sessionTime.lastCheckedAt,
      now,
    });
  }, [
    sessionTime.lastCheckedAt,
    sessionTime.expirationTime,
    sessionTime.remainingTime,
    now,
  ]);

  const tokenRemainingMs = useMemo(() => {
    if (!sessionTime.lastCheckedAt) return null;

    return getRemainingMs({
      expirationTime: sessionTime.tokenExpirationTime,
      remainingTime: sessionTime.remainingTokenTime,
      lastCheckedAt: sessionTime.lastCheckedAt,
      now,
    });
  }, [
    sessionTime.lastCheckedAt,
    sessionTime.tokenExpirationTime,
    sessionTime.remainingTokenTime,
    now,
  ]);

  const secondsLeft =
    sessionRemainingMs == null
      ? 0
      : Math.max(0, Math.ceil(sessionRemainingMs / 1000));

  const warning =
    sessionRemainingMs != null &&
    sessionRemainingMs > 0 &&
    sessionRemainingMs <= warnMs;

  const refreshSession = useCallback(async () => {
    if (!enabled) return;
    if (Platform.OS !== "web") return;

    try {
      await dispatch(loadSessionTime({ silent: true })).unwrap();
    } catch {
      // sessionTime darf keine automatische Logout-Entscheidung auslösen.
      // Logout passiert ausschließlich über sessionRemainingMs.
    }
  }, [dispatch, enabled]);

  useEffect(() => {
    if (!enabled) return;
    if (Platform.OS !== "web") return;

    // Beim Start nur sessionTime lesen.
    // Wichtig: kein settings/get, damit die Session nicht künstlich verlängert wird.
    void refreshSession();
  }, [enabled, refreshSession]);

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

    // Logout nur über die echte Session-Zeit.
    if (sessionRemainingMs == null) return;
    if (sessionRemainingMs > 0) return;

    const nowValue = Date.now();

    if (nowValue - lastLogoutAtRef.current < 1000) return;

    lastLogoutAtRef.current = nowValue;
    onLogout();
  }, [enabled, sessionRemainingMs, onLogout]);

  return {
    secondsLeft,
    warning,

    // Haupttimer / Logout-Entscheidung
    remainingMs: sessionRemainingMs,
    sessionRemainingMs,

    // Nur Anzeige / Diagnose
    tokenRemainingMs,

    // Manuelles Neuladen der Zeiten, ohne settings/get
    refreshSession,
  };
}