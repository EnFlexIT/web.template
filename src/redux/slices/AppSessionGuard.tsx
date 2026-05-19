import { useEffect, useRef } from "react";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { useAppSelector } from "../../hooks/useAppSelector";
import { checkAlive } from "./connectivitySlice";
import {
  refreshServerStatus,
  selectIsLoggedIn,
  selectIp,
  logoutAsync,
  selectAuthenticationMethod,
} from "../../redux/slices/apiSlice";
import { renewAllServerJwtsIfNeeded } from "../../redux/slices/jwtRenewSlice";
import { isLogoutFlowActive } from "./logoutFlowGuard";

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
  const authenticationMethod = useAppSelector(selectAuthenticationMethod);

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
      if (elapsed < 12_000) return;

      runningRef.current = true;

      try {
   

        const aliveRes = await dispatch(checkAlive({ silent: true })).unwrap();

        if (cancelled) return;
        if (!aliveRes.isOnline) return;
        if (!aliveRes.wentOnline) return; 

        const renewResults = await dispatch(
          renewAllServerJwtsIfNeeded({
            force: true,
            cooldownMs: 10_000,
          }) as any,
        ).unwrap();

        if (cancelled) return;

        const activeResult = Array.isArray(renewResults)
          ? renewResults.find((r) => r?.baseUrl === activeBaseUrl)
          : undefined;

        const activeReason = activeResult?.reason;

        if (shouldLogoutFromRenewReason(activeReason)) {
          await dispatch(logoutAsync());
        }
      } catch (error) {
        console.log("[AppSessionGuard] failed:", error);
      } finally {
        runningRef.current = false;
      }
    };

    

    return () => {
      cancelled = true;

     
    };
  }, [dispatch, isLoggedIn, activeBaseUrl, authenticationMethod]);

  return null;
}