// src/hooks/useJwtSessionTimerWeb.ts
import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { getJwtRemainingMs } from "../util/jwtTime";

type Options = {
  enabled: boolean;
  jwt: string | null;
  warnMs: number; // z.B. 30_000
  onLogout: () => void;
  onUserActive?: () => void; // hier triggerst du refreshJwtIfNeeded
};

export function useJwtSessionTimerWeb({
  enabled,
  jwt,
  warnMs,
  onLogout,
  onUserActive,
}: Options) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [warning, setWarning] = useState(false);
  const lastActivityRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!enabled) return;
    if (Platform.OS !== "web") return;
    if (typeof window === "undefined" || typeof document === "undefined") return;

    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];

    const onActivity = () => {
      // throttle: activity nur alle 2s als Trigger
      const now = Date.now();
      if (now - lastActivityRef.current < 2000) return;
      lastActivityRef.current = now;
      setWarning(false);
      onUserActive?.();
    };

    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));

    const onVis = () => {
      if (document.visibilityState === "visible") onActivity();
    };
    document.addEventListener("visibilitychange", onVis);

    const tick = window.setInterval(() => {
      const remainingMs = getJwtRemainingMs(jwt);

      if (!jwt || remainingMs <= 0) {
        setSecondsLeft(0);
        setWarning(false);
        onLogout();
        return;
      }

      setSecondsLeft(Math.ceil(remainingMs / 1000));
      setWarning(remainingMs <= warnMs);
    }, 1000);

    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity as any));
      document.removeEventListener("visibilitychange", onVis);
      window.clearInterval(tick);
    };
  }, [enabled, jwt, warnMs, onLogout, onUserActive]);

  return { secondsLeft, warning };
}
