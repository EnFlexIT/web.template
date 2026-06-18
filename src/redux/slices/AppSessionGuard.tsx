import { useEffect, useRef } from "react";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { useAppSelector } from "../../hooks/useAppSelector";
import {
  logoutAsync,
  selectAuthenticationMethod,
  selectIp,
  selectIsLoggedIn,
} from "../../redux/slices/apiSlice";
import { renewAllServerJwtsIfNeeded } from "../../redux/slices/jwtRenewSlice";
import { loadSessionTime } from "../../redux/slices/sessionTimeSlice";
import { isLogoutFlowActive } from "./logoutFlowGuard";

const SESSION_CHECK_INTERVAL_MS = 60_000;
const LOGIN_GRACE_PERIOD_MS = 12_000;
const RENEW_THRESHOLD_MS = 2 * 60 * 1000;

function shouldLogoutFromRenewReason(reason?: string) {
  return reason === "expired" || reason === "401-no-token";
}

function isOidcAuth(authenticationMethod?: string) {
  return authenticationMethod === "oidc" || authenticationMethod === "unknown";
}

function normalizeTimeToMs(value?: number | null): number | null {
  if (typeof value !== "number") return null;

  return value < 24 * 60 * 60 ? value * 1000 : value;
}

export function AppSessionGuard() {
  const dispatch = useAppDispatch();

  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const activeBaseUrl = useAppSelector(selectIp);
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

      // Wichtig:
      // OIDC wird NICHT mehr automatisch über AppSessionGuard geprüft,
      // damit /api/user/sessionTime nicht jede Minute die Session verlängert.
      // OIDC läuft jetzt über useOidcSessionTimerWeb in der ToolBox.
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
          return;
        }

        const remainingTokenMs = normalizeTimeToMs(
          sessionTime.remainingTokenTime,
        );

        if (remainingTokenMs == null) {
          return;
        }

        if (remainingTokenMs > RENEW_THRESHOLD_MS) {
          return;
        }

        const renewResults = await dispatch(
          renewAllServerJwtsIfNeeded({
            force: true,
            cooldownMs: 60_000,
          }),
        ).unwrap();

        if (cancelled) return;

        const activeResult = Array.isArray(renewResults)
          ? renewResults.find((result) => result?.baseUrl === activeBaseUrl)
          : undefined;

        if (shouldLogoutFromRenewReason(activeResult?.reason)) {
          await dispatch(logoutAsync());
        }
      } catch (error) {
        console.log("[AppSessionGuard] failed:", error);
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
  }, [dispatch, isLoggedIn, activeBaseUrl, authenticationMethod, isOffline]);

  return null;
}