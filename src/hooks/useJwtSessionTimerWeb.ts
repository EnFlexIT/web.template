// src/hooks/useJwtSessionTimerWeb.ts
import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { getJwtRemainingMs } from "../util/jwtTime";

type Options = {
  enabled: boolean;
  jwt: string | null;
  warnMs: number;
  onLogout: () => void;
  onHeartbeat?: () => void; // Renew N
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
  const warningStartedAtRef = useRef<number | null>(null);
  const renewedThisWarningRef = useRef<boolean>(false);

  useEffect(() => {
    if (!enabled) return;
    if (Platform.OS !== "web") return;
    if (typeof window === "undefined") return;

    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];

    const onActivity = () => {
      const now = Date.now();
      lastActivityRef.current = now;

   
      if (
        warningStartedAtRef.current &&
        now > warningStartedAtRef.current &&
        !renewedThisWarningRef.current
      ) {
        renewedThisWarningRef.current = true;
        onHeartbeat?.();
      }
    };

    events.forEach((e) =>
      window.addEventListener(e, onActivity, { passive: true })
    );

    const tick = window.setInterval(() => {
      if (!jwt) return;

      const remainingMs = getJwtRemainingMs(jwt);

      if (remainingMs <= 0) {
        setSecondsLeft(0);
        setWarning(false);
        warningStartedAtRef.current = null;
        renewedThisWarningRef.current = false;
        onLogout();
        return;
      }

      setSecondsLeft(Math.ceil(remainingMs / 1000));

      const isNowWarning = remainingMs <= warnMs;
      setWarning(isNowWarning);

      // Warnphase beginnt
      if (isNowWarning && !warningStartedAtRef.current) {
        warningStartedAtRef.current = Date.now();
        renewedThisWarningRef.current = false;
      }

      // Warnphase endet (durch Renew)
      if (!isNowWarning) {
        warningStartedAtRef.current = null;
        renewedThisWarningRef.current = false;
      }
    }, 1000);

    return () => {
      events.forEach((e) =>
        window.removeEventListener(e, onActivity as any)
      );
      window.clearInterval(tick);
    };
  }, [enabled, jwt, warnMs, onLogout, onHeartbeat]);

  return { secondsLeft, warning };
}