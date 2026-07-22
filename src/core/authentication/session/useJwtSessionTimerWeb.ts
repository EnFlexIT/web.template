// src/hooks/useJwtSessionTimerWeb.ts

import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

import { getJwtRemainingMs } from "../../../util/jwtTime";
import { renewJwtIfNeeded } from "../../../redux/slices/jwtRenewSlice";
import { useAppDispatch } from "../../../hooks/useAppDispatch";

type Options = {
  enabled: boolean;
  jwt: string | null;
  warnMs: number;
  onLogout: () => void;
  onHeartbeat?: () => void;
};

const JWT_RENEW_ACTIVITY_COOLDOWN_MS = 30_000;

let globalRenewRunning = false;
let globalLastRenewAt = 0;
let globalLogoutTriggered = false;

function isSessionActivityExcluded(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;

  return Boolean(
    target.closest(
      [
        "[data-no-session-extend='true']",
        "[id^='no-session-extend-']",
        "[aria-label='logout']",
        "[aria-label='Logout']",
        "[aria-label='abmelden']",
        "[aria-label='Abmelden']",
      ].join(","),
    ),
  );
}

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
    "[id^='session-activity-']",
    "[data-session-activity='true']",
  ].join(",");

  const element = target.closest(selector);

  if (!element) return false;

  if ((element as HTMLButtonElement).disabled) return false;

  if (element.getAttribute("aria-disabled") === "true") {
    return false;
  }

  return true;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;

  return Boolean(
    target.closest(
      [
        "input",
        "textarea",
        "select",
        "[contenteditable='true']",
      ].join(","),
    ),
  );
}

function isEffectiveKey(event: KeyboardEvent): boolean {
  if (isEditableTarget(event.target)) {
    return true;
  }

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
  ].includes(event.key);
}

export function useJwtSessionTimerWeb({
  enabled,
  jwt,
  warnMs,
  onLogout,
  onHeartbeat,
}: Options) {
  const dispatch = useAppDispatch();

  const [secondsLeft, setSecondsLeft] = useState(() => {
    if (!jwt) return 0;

    const remainingMs = getJwtRemainingMs(jwt);

    return Math.max(0, Math.ceil(remainingMs / 1000));
  });

  const [warning, setWarning] = useState(() => {
    if (!jwt) return false;

    const remainingMs = getJwtRemainingMs(jwt);

    return (
      Number.isFinite(remainingMs) &&
      remainingMs > 0 &&
      remainingMs <= warnMs
    );
  });

  const lastJwtRef = useRef<string | null>(null);

  useEffect(() => {
    if (jwt && jwt !== lastJwtRef.current) {
      lastJwtRef.current = jwt;
      globalLogoutTriggered = false;
    }
  }, [jwt]);

  const safeLogout = useCallback(() => {
    if (globalLogoutTriggered) return;

    globalLogoutTriggered = true;
    onLogout();
  }, [onLogout]);

  const renewNow = useCallback(
    async (force = true) => {
      if (!enabled) return;
      if (Platform.OS !== "web") return;
      if (typeof window === "undefined") return;
      if (!jwt) return;
      if (globalRenewRunning) return;

      const remainingMs = getJwtRemainingMs(jwt);

      if (!Number.isFinite(remainingMs) || remainingMs <= 0) {
        return;
      }

      const now = Date.now();

      if (now - globalLastRenewAt < JWT_RENEW_ACTIVITY_COOLDOWN_MS) {
        return;
      }

      globalLastRenewAt = now;
      globalRenewRunning = true;

      try {
        console.log("[JWT TIMER] renew active JWT via /api/user/login");

        await dispatch(
          renewJwtIfNeeded({
            force,
            cooldownMs: 0,
          }) as any,
        ).unwrap?.();
      } catch (error) {
        console.warn("[JWT TIMER] renew failed:", error);
      } finally {
        globalRenewRunning = false;
      }
    },
    [dispatch, enabled, jwt],
  );

  useEffect(() => {
    if (!enabled) {
      setSecondsLeft(0);
      setWarning(false);
      return;
    }

    if (Platform.OS !== "web") return;
    if (typeof window === "undefined") return;

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

      globalLogoutTriggered = false;

      setSecondsLeft(Math.ceil(remainingMs / 1000));
      setWarning(remainingMs <= warnMs);
    };

    const triggerHeartbeat = () => {
      if (!jwt) return;
      if (globalRenewRunning) return;

      const remainingMs = getJwtRemainingMs(jwt);

      if (!Number.isFinite(remainingMs) || remainingMs <= 0) {
        return;
      }

      onHeartbeat?.();

      /*
       * JWT benutzt bewusst den Login/Renew-Weg:
       * GET /api/user/login
       * Authorization: Basic ...
       *
       * Kein /sessionTime und kein /sessionTime/extend.
       */
      void renewNow(true);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (isSessionActivityExcluded(event.target)) return;
      if (!isEffectiveKey(event)) return;

      triggerHeartbeat();
    };

    const onClick = (event: MouseEvent) => {
      if (isSessionActivityExcluded(event.target)) return;
      if (!isInteractiveTarget(event.target)) return;

      triggerHeartbeat();
    };

    const onTouchEnd = (event: TouchEvent) => {
      if (isSessionActivityExcluded(event.target)) return;
      if (!isInteractiveTarget(event.target)) return;

      triggerHeartbeat();
    };

    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("click", onClick, true);
    window.addEventListener("touchend", onTouchEnd, {
      capture: true,
      passive: true,
    });

    tickOnce();

    const intervalId = window.setInterval(tickOnce, 1000);

    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("touchend", onTouchEnd, true);
      window.clearInterval(intervalId);
    };
  }, [enabled, jwt, warnMs, safeLogout, onHeartbeat, renewNow]);

  return {
    secondsLeft,
    warning,
    renewNow,
  };
}