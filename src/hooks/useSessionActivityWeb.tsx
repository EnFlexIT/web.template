// src/hooks/useSessionActivityWeb.ts

import { useCallback, useEffect, useRef } from "react";
import { Platform } from "react-native";

import { useAppDispatch } from "./useAppDispatch";
import { useAppSelector } from "./useAppSelector";
import {
  extendSessionTime,
  selectSessionTime,
} from "../redux/slices/sessionTimeSlice";

type Options = {
  enabled: boolean;
};

const SESSION_ACTIVITY_COOLDOWN_MS = 30_000;

function isSessionActivityExcluded(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;

  const excludedElement = target.closest(
    [
      "[data-no-session-extend='true']",
      "[id^='no-session-extend-']",
      "[aria-label='logout']",
      "[aria-label='Logout']",
      "[aria-label='abmelden']",
      "[aria-label='Abmelden']",
    ].join(","),
  );

  if (excludedElement) return true;

  const ariaLabel = target.closest("[aria-label]")?.getAttribute("aria-label");

  if (ariaLabel) {
    const normalized = ariaLabel.trim().toLowerCase();

    if (
      normalized.includes("logout") ||
      normalized.includes("abmelden") ||
      normalized.includes("ausloggen")
    ) {
      return true;
    }
  }

  return false;
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

    /*
     * Optional für eigene Elemente:
     * nativeID="session-activity-xyz"
     * oder dataSet={{ sessionActivity: "true" }}
     */
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
  /*
   * Schreiben in Inputs/Textfeldern zählt als echte Aktivität.
   */
  if (isEditableTarget(event.target)) {
    return true;
  }

  /*
   * Außerhalb von Inputs nur echte Steuerungs-/Navigations-Tasten.
   */
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

function isSessionExpired(params: {
  expirationTime: number | null;
  remainingTime: number | null;
  lastCheckedAt: number | null;
}): boolean {
  const now = Date.now();

  if (
    typeof params.remainingTime === "number" &&
    Number.isFinite(params.remainingTime) &&
    typeof params.lastCheckedAt === "number" &&
    Number.isFinite(params.lastCheckedAt)
  ) {
    const calculatedRemaining =
      params.remainingTime - (now - params.lastCheckedAt);

    return calculatedRemaining <= 0;
  }

  if (
    typeof params.expirationTime === "number" &&
    Number.isFinite(params.expirationTime)
  ) {
    return params.expirationTime <= now;
  }

  return false;
}

export function useSessionActivityWeb({ enabled }: Options) {
  const dispatch = useAppDispatch();

  const isOffline = useAppSelector(
    (state) => state.connectivity.isOffline,
  );

  const isLoggingOut = useAppSelector(
    (state) => state.api.isLoggingOut,
  );

  const isLogoutDialogOpen = useAppSelector(
    (state) => state.api.isLogoutDialogOpen,
  );

  const sessionTime = useAppSelector(selectSessionTime);

  const lastExtendAtRef = useRef(0);
  const requestRunningRef = useRef(false);

  const canExtend = useCallback(() => {
    if (!enabled) return false;
    if (Platform.OS !== "web") return false;
    if (typeof window === "undefined") return false;

    if (isOffline) return false;
    if (isLoggingOut) return false;
    if (isLogoutDialogOpen) return false;
    if (sessionTime.extending) return false;

    if (
      isSessionExpired({
        expirationTime: sessionTime.expirationTime,
        remainingTime: sessionTime.remainingTime,
        lastCheckedAt: sessionTime.lastCheckedAt,
      })
    ) {
      return false;
    }

    const now = Date.now();

    if (now - lastExtendAtRef.current < SESSION_ACTIVITY_COOLDOWN_MS) {
      return false;
    }

    if (requestRunningRef.current) {
      return false;
    }

    return true;
  }, [
    enabled,
    isOffline,
    isLoggingOut,
    isLogoutDialogOpen,
    sessionTime.extending,
    sessionTime.expirationTime,
    sessionTime.remainingTime,
    sessionTime.lastCheckedAt,
  ]);

  const extendFromActivity = useCallback(
    async (reason: string) => {
      if (!canExtend()) return;

      lastExtendAtRef.current = Date.now();
      requestRunningRef.current = true;

      try {
        console.log("[SESSION ACTIVITY] extend:", reason);

        await dispatch(extendSessionTime()).unwrap();
      } catch (error) {
        /*
         * Kein direkter Logout hier.
         * Automatischer Logout läuft separat über remainingTime <= 0.
         */
        console.log("[SESSION ACTIVITY] extend failed:", error);
      } finally {
        requestRunningRef.current = false;
      }
    },
    [canExtend, dispatch],
  );

  useEffect(() => {
    if (!enabled) return;
    if (Platform.OS !== "web") return;
    if (typeof window === "undefined") return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (isSessionActivityExcluded(event.target)) return;
      if (!isEffectiveKey(event)) return;

      void extendFromActivity(`keydown:${event.key}`);
    };

    const onClick = (event: MouseEvent) => {
      if (isSessionActivityExcluded(event.target)) return;
      if (!isInteractiveTarget(event.target)) return;

      void extendFromActivity("click");
    };

    const onTouchEnd = (event: TouchEvent) => {
      if (isSessionActivityExcluded(event.target)) return;
      if (!isInteractiveTarget(event.target)) return;

      void extendFromActivity("touchend");
    };

    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("click", onClick, true);
    window.addEventListener("touchend", onTouchEnd, {
      capture: true,
      passive: true,
    });

    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("touchend", onTouchEnd, true);
    };
  }, [enabled, extendFromActivity]);
}