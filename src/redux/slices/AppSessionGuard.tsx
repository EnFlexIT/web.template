import { useEffect, useRef } from "react";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { useAppSelector } from "../../hooks/useAppSelector";
import { checkAlive } from "./connectivitySlice";
import {
  refreshServerStatus,
  selectIsLoggedIn,
  selectIp,
  logoutAsync,
} from "../../redux/slices/apiSlice";
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
  const activeBaseUrl = useAppSelector(selectIp);

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

      const elapsed = Date.now() - loginStartedAtRef.current;
      if (elapsed < 12_000) {
        return;
      }

      runningRef.current = true;

      try {
        await dispatch(refreshServerStatus());

        const aliveRes = await dispatch(
          checkAlive({ silent: true })
        ).unwrap();

        if (cancelled) return;

        // Solange Server offline ist: nichts tun
        if (!aliveRes.isOnline) {
          return;
        }

        // Nur wenn die Verbindung gerade zurückgekommen ist:
        // genau EIN Renew-Versuch
        if (!aliveRes.wentOnline) {
          return;
        }

        const renewResults = await dispatch(
          renewAllServerJwtsIfNeeded({
            force: true,
            cooldownMs: 10_000,
          }) as any
        ).unwrap();

        if (cancelled) return;

        const activeResult = Array.isArray(renewResults)
          ? renewResults.find((r) => r?.baseUrl === activeBaseUrl)
          : undefined;

        const activeReason = activeResult?.reason;

        if (shouldLogoutFromRenewReason(activeReason)) {
          await dispatch(logoutAsync());
          return;
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
  }, [dispatch, isLoggedIn, activeBaseUrl]);

  return null;
}