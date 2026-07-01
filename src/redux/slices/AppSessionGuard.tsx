import { useEffect, useRef } from "react";

import { useAppDispatch } from "../../hooks/useAppDispatch";
import { useAppSelector } from "../../hooks/useAppSelector";

import {
  logoutAsync,
  selectAuthenticationMethod,
  selectIsLoggedIn,
} from "../../redux/slices/apiSlice";

import { loadSessionTime } from "../../redux/slices/sessionTimeSlice";
import { isLogoutFlowActive } from "./logoutFlowGuard";

const SESSION_CHECK_INTERVAL_MS = 60_000;
const LOGIN_GRACE_PERIOD_MS = 12_000;

function isOidcAuth(authenticationMethod?: string) {
  return authenticationMethod === "oidc" || authenticationMethod === "unknown";
}

function normalizeTimeToMs(value?: number | null): number | null {
  if (typeof value !== "number") return null;

  return value < 24 * 60 * 60 ? value * 1000 : value;
}

function shouldLogoutFromError(error: unknown): boolean {
  const message = String(
    error instanceof Error ? error.message : error ?? "",
  );

  return (
    message.includes("401") ||
    message.includes("403") ||
    message.includes("expired")
  );
}

export function AppSessionGuard() {
  const dispatch = useAppDispatch();

  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const authenticationMethod = useAppSelector(selectAuthenticationMethod);
  const isOffline = useAppSelector((state) => state.connectivity.isOffline);

  const runningRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const loginStartedAtRef = useRef<number>(0);

  useEffect(() => {
    if (!isLoggedIn) {
      loginStartedAtRef.current = 0;

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      return;
    }

    loginStartedAtRef.current = Date.now();

    let cancelled = false;

    const run = async () => {
      if (runningRef.current || cancelled) return;
      if (isLogoutFlowActive()) return;

      const elapsed = Date.now() - loginStartedAtRef.current;

      if (elapsed < LOGIN_GRACE_PERIOD_MS) {
        return;
      }

      if (isOffline) {
        return;
      }

      /*
       * Wichtig:
       * OIDC wird NICHT über AppSessionGuard geprüft.
       *
       * OIDC:
       * - Timer läuft über useOidcSessionTimerWeb
       * - Verlängerung läuft über useSessionActivityWeb
       *
       * JWT:
       * - AppSessionGuard liest nur passiv sessionTime
       * - kein automatischer Renew
       * - kein /api/user/login
       */
      if (isOidcAuth(authenticationMethod)) {
        return;
      }

      runningRef.current = true;

      try {
        const sessionTime = await dispatch(
          loadSessionTime({ silent: true }),
        ).unwrap();

        if (cancelled) return;

        const remainingSessionMs = normalizeTimeToMs(sessionTime.remainingTime);

        if (remainingSessionMs == null || remainingSessionMs <= 0) {
          await dispatch(logoutAsync());
        }
      } catch (error) {
        console.log("[AppSessionGuard] failed:", error);

        /*
         * Bei JWT bedeutet 401/403 meistens:
         * Token/Session ist nicht mehr gültig.
         *
         * Kein Logout bei Netzwerkfehlern.
         */
        if (!cancelled && shouldLogoutFromError(error)) {
          await dispatch(logoutAsync());
        }
      } finally {
        runningRef.current = false;
      }
    };

    void run();

    intervalRef.current = setInterval(() => {
      void run();
    }, SESSION_CHECK_INTERVAL_MS);

    return () => {
      cancelled = true;

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [dispatch, isLoggedIn, authenticationMethod, isOffline]);

  return null;
}