// src/hooks/useJwtSessionTimerWeb.ts
import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { getJwtRemainingMs } from "../util/jwtTime";

type Options = {
  enabled: boolean;
  jwt: string | null;
  warnMs: number;
  onLogout: () => void;
  onHeartbeat?: () => void; // Renew (throttling happens in thunk via cooldownMs)
};

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;

  const selector = [
    "button",
    "a[href]",
    "input",
    "select",
    "textarea",
    "[role='button']",
    "[role='tab']",
    "[role='menuitem']",
    "[role='option']",
    "[role='switch']",
    "[role='checkbox']",
    "[role='radio']",
    "[contenteditable='true']",
    "[tabindex]:not([tabindex='-1'])",
  ].join(",");

  const el = target.closest(selector);
  if (!el) return false;

  // disabled soll NICHT zählen
  if ((el as HTMLButtonElement).disabled) return false;
  if (el.getAttribute("aria-disabled") === "true") return false;

  return true;
}

function isEffectiveKey(e: KeyboardEvent): boolean {
  // "echte" Navigation / Bedienung
  return [
    "Tab",
    "Enter",
    " ",
    "Spacebar",
    "Escape",
    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "Home",
    "End",
    "PageUp",
    "PageDown",
  ].includes(e.key);
}

export function useJwtSessionTimerWeb({
  enabled,
  jwt,
  warnMs,
  onLogout,
  onHeartbeat,
}: Options) {
  //  direkt aus JWT (kein 0-Flash)
  const [secondsLeft, setSecondsLeft] = useState(() => {
    if (!jwt) return 0;
    const remainingMs = getJwtRemainingMs(jwt);
    return Math.max(0, Math.ceil(remainingMs / 1000));
  });

  const [warning, setWarning] = useState(() => {
    if (!jwt) return false;
    const remainingMs = getJwtRemainingMs(jwt);
    return Number.isFinite(remainingMs) && remainingMs > 0 && remainingMs <= warnMs;
  });

  const lastLogoutAtRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;
    if (Platform.OS !== "web") return;
    if (typeof window === "undefined") return;

    const safeLogout = () => {
    
      const now = Date.now();
      if (now - lastLogoutAtRef.current < 1000) return;
      lastLogoutAtRef.current = now;
      onLogout();
    };

    const tickOnce = () => {
      if (!jwt) {
        setSecondsLeft(0);
        setWarning(false);
        return;
      }

      const remainingMs = getJwtRemainingMs(jwt);

      if (!Number.isFinite(remainingMs) || remainingMs <= 0) {
        setSecondsLeft(0);
        setWarning(false);
        safeLogout();
        return;
      }

      setSecondsLeft(Math.ceil(remainingMs / 1000));
      setWarning(remainingMs <= warnMs);
    };

    const triggerHeartbeat = () => {
      // nur wenn token grundsätzlich gültig ist
      if (!jwt) return;
      const remainingMs = getJwtRemainingMs(jwt);
      if (!Number.isFinite(remainingMs) || remainingMs <= 0) return;

    
      onHeartbeat?.();

  
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (!isEffectiveKey(e)) return;
      triggerHeartbeat();
    };

    const onClick = (e: MouseEvent) => {
      if (!isInteractiveTarget(e.target)) return; 
      triggerHeartbeat();
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!isInteractiveTarget(e.target)) return;
      triggerHeartbeat();
    };

    // Listener
    window.addEventListener("keydown", onKeyDown, { capture: true });
    window.addEventListener("click", onClick, { capture: true });
    window.addEventListener("touchend", onTouchEnd, { capture: true, passive: true });

  
    tickOnce();

    const tick = window.setInterval(tickOnce, 1000);

    return () => {
      window.removeEventListener("keydown", onKeyDown, { capture: true } as any);
      window.removeEventListener("click", onClick, { capture: true } as any);
      window.removeEventListener("touchend", onTouchEnd, { capture: true } as any);
      window.clearInterval(tick);
    };
  }, [enabled, jwt, warnMs, onLogout, onHeartbeat]);

  return { secondsLeft, warning };
}