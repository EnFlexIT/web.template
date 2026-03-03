// src/hooks/useJwtSessionTimerWeb.ts
import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { getJwtRemainingMs } from "../util/jwtTime";

type Options = {
  enabled: boolean;
  jwt: string | null;
  warnMs: number;
  onLogout: () => void;
  onHeartbeat?: () => void; // Renew
  heartbeatMinIntervalMs?: number; // optional
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

  if ((el as HTMLButtonElement).disabled) return false;
  if (el.getAttribute("aria-disabled") === "true") return false;

  return true;
}

function isEffectiveKey(e: KeyboardEvent): boolean {
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
  heartbeatMinIntervalMs = 10_000, // z.B. max 1 Renew / 10s
}: Options) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [warning, setWarning] = useState(false);

  const lastActivityRef = useRef<number>(Date.now());
  const lastHeartbeatAtRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;
    if (Platform.OS !== "web") return;
    if (typeof window === "undefined") return;

   const tryHeartbeat = () => {
  if (!jwt) return;
  if (getJwtRemainingMs(jwt) <= 0) return;
  onHeartbeat?.();
};

    const markEffectiveActivity = () => {
      lastActivityRef.current = Date.now();
      tryHeartbeat(); // <- IMMER bei effektiver Aktivität
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (!isEffectiveKey(e)) return;
      markEffectiveActivity();
    };

    const onClick = (e: MouseEvent) => {
      if (!isInteractiveTarget(e.target)) return; // kein "sinnloser" Seitenklick
      markEffectiveActivity();
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!isInteractiveTarget(e.target)) return;
      markEffectiveActivity();
    };

    const onFocusIn = (e: FocusEvent) => {
      if (!isInteractiveTarget(e.target)) return;
      markEffectiveActivity();
    };

    window.addEventListener("keydown", onKeyDown, { capture: true });
    window.addEventListener("click", onClick, { capture: true });
    window.addEventListener("touchend", onTouchEnd, {
      capture: true,
      passive: true,
    });
    window.addEventListener("focusin", onFocusIn, { capture: true });

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
    }, 1000);

    return () => {
      window.removeEventListener("keydown", onKeyDown, { capture: true } as any);
      window.removeEventListener("click", onClick, { capture: true } as any);
      window.removeEventListener("touchend", onTouchEnd, { capture: true } as any);
      window.removeEventListener("focusin", onFocusIn, { capture: true } as any);
      window.clearInterval(tick);
    };
  }, [enabled, jwt, warnMs, onLogout, onHeartbeat, heartbeatMinIntervalMs]);

  return { secondsLeft, warning };
}