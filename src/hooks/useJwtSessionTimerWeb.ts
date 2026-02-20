// src/hooks/useJwtSessionTimerWeb.ts
import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { getJwtRemainingMs } from "../util/jwtTime";

type Options = {
  enabled: boolean;
  jwt: string | null;
  warnMs: number;
  onLogout: () => void;
  onHeartbeat?: () => void; // Renew-Check 
};

export function useJwtSessionTimerWeb({
  enabled,
  jwt,
  warnMs,
  onLogout,
  onHeartbeat,
}: Options) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [warning, setWarning] = useState(false);

  const lastActivityRef = useRef<number>(Date.now());
  const lastHeartbeatRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;
    if (Platform.OS !== "web") return;
    if (typeof window === "undefined") return;

    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];

    const onActivity = () => {
      lastActivityRef.current = Date.now();
      setWarning(false);
      
    };

    events.forEach((e) =>
      window.addEventListener(e, onActivity, { passive: true })
    );

    const onVis = () => {
      if (document.visibilityState === "visible") {
        lastActivityRef.current = Date.now();
      }
    };
    document.addEventListener("visibilitychange", onVis);

    const tick = window.setInterval(() => {
      if (!jwt) return;

      const remainingMs = getJwtRemainingMs(jwt);

      if (remainingMs <= 0) {
        setSecondsLeft(0);
        setWarning(false);
        onLogout();
        return;
      }

      setSecondsLeft(Math.ceil(remainingMs / 1000));
      setWarning(remainingMs <= warnMs);

    
      const now = Date.now();
      const userRecentlyActive = now - lastActivityRef.current < 30_000;
      const heartbeatCooldownPassed = now - lastHeartbeatRef.current > 10_000;

      if (
        onHeartbeat &&
        userRecentlyActive &&
        remainingMs <= warnMs &&
        heartbeatCooldownPassed
      ) {
        lastHeartbeatRef.current = now;
        onHeartbeat();
      }
    }, 1000);

    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity as any));
      document.removeEventListener("visibilitychange", onVis);
      window.clearInterval(tick);
    };
  }, [enabled, jwt, warnMs, onLogout, onHeartbeat]);

  return { secondsLeft, warning };
}
