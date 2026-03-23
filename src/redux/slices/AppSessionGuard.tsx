import { useEffect, useRef } from "react";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { useAppSelector } from "../../hooks/useAppSelector";
import { checkAlive } from "./connectivitySlice";
import {
  refreshServerStatus,
  selectIsLoggedIn,
} from "../../redux/slices/apiSlice";
import { logoutAsync } from "../../redux/slices/apiSlice";
import { renewAllServerJwtsIfNeeded } from "../../redux/slices/jwtRenewSlice";

function shouldLogoutFromRenewReason(reason?: string) {
  return (
    reason === "expired" ||
    reason === "401-no-token" ||
    reason === "no-jwt-for-server"
  );
}

export function AppSessionGuard() {
  const dispatch = useAppDispatch();
  const isLoggedIn = useAppSelector(selectIsLoggedIn);

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

    // Zeitpunkt merken, wann Session aktiv wurde
    loginStartedAtRef.current = Date.now();

    let cancelled = false;

    const run = async () => {
      if (runningRef.current || cancelled) return;

      // 12 Sekunden Schonfrist nach Login
      const elapsed = Date.now() - loginStartedAtRef.current;
      if (elapsed < 12_000) {
        return;
      }

      runningRef.current = true;

      try {
        dispatch(refreshServerStatus());

        const aliveRes = await dispatch(
          checkAlive({ silent: true })
        ).unwrap();

        if (cancelled) return;

        // solange Server offline ist -> noch nicht logout
        if (!aliveRes.isOnline) {
          return;
        }

        const renewRes = await dispatch(
          renewAllServerJwtsIfNeeded({
            force: false,
            cooldownMs: 10_000,
          }) as any
        ).unwrap();

        if (cancelled) return;

        const reason =
          renewRes?.reason ??
          renewRes?.[0]?.reason;

        if (shouldLogoutFromRenewReason(reason)) {
          await dispatch(logoutAsync());
        }
      } catch (error) {
        console.log("[AppSessionGuard] failed:", error);
      } finally {
        runningRef.current = false;
      }
    };

    intervalRef.current = setInterval(() => {
      void run();
    }, 5000);

    return () => {
      cancelled = true;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [dispatch, isLoggedIn]);

  return null;
}