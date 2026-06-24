// src/hooks/useOidcSessionTimerWeb.ts

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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

const SESSION_TIME_SYNC_INTERVAL_MS = 15_000;

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
    return Math.max(
      0,
      params.remainingTime - (params.now - params.lastCheckedAt),
    );
  }

  if (
    typeof params.expirationTime === "number" &&
    Number.isFinite(params.expirationTime)
  ) {
    return Math.max(0, params.expirationTime - params.now);
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

  const lastLogoutAtRef = useRef(0);

  const sessionRemainingMs = useMemo(() => {
    if (!sessionTime.lastCheckedAt) {
      return null;
    }

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
    if (!sessionTime.lastCheckedAt) {
      return null;
    }

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
      await dispatch(
        loadSessionTime({ silent: true }),
      ).unwrap();
    } catch {
      // 303 oder Netzwerkfehler dürfen hier keinen Logout auslösen.
    }
  }, [dispatch, enabled]);

  /*
   * Lokale Anzeige jede Sekunde aktualisieren.
   */
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

  /*
   * Serverzeiten regelmäßig synchronisieren.
   *
   * /api/user/sessionTime verlängert die UserSession nicht.
   * Wenn ein normaler Benutzer-Request die Session serverseitig verlängert,
   * wird die aktualisierte Zeit spätestens nach 15 Sekunden übernommen.
   */
  useEffect(() => {
    if (!enabled) return;
    if (Platform.OS !== "web") return;
    if (typeof window === "undefined") return;

    let active = true;
    let requestRunning = false;

    const syncSessionTime = async () => {
      if (!active || requestRunning) return;

      requestRunning = true;

      try {
        await refreshSession();
      } finally {
        requestRunning = false;
      }
    };

    void syncSessionTime();

    const intervalId = window.setInterval(() => {
      void syncSessionTime();
    }, SESSION_TIME_SYNC_INTERVAL_MS);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [enabled, refreshSession]);

  /*
   * Automatischer Logout ausschließlich über die UserSession-Zeit.
   *
   * remainingTokenTime und HTTP 303 lösen keinen Frontend-Logout aus.
   */
  useEffect(() => {
    if (!enabled) return;
    if (Platform.OS !== "web") return;
    if (sessionRemainingMs == null) return;
    if (sessionRemainingMs > 0) return;

    const currentTime = Date.now();

    if (currentTime - lastLogoutAtRef.current < 1000) {
      return;
    }

    lastLogoutAtRef.current = currentTime;
    onLogout();
  }, [enabled, sessionRemainingMs, onLogout]);

  return {
    secondsLeft,
    warning,

    remainingMs: sessionRemainingMs,
    sessionRemainingMs,

    // Tokenzeit dient nur der Anzeige und später dem Refresh.
    tokenRemainingMs,

    // Manuelles Neuladen ohne settings/get.
    refreshSession,
  };
}