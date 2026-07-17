import { useEffect, useRef } from "react";
import { Platform } from "react-native";

import { useAppDispatch } from "./useAppDispatch";
import { useAppSelector } from "./useAppSelector";

import {
  normalizeBaseUrl,
  selectApi,
} from "../redux/slices/apiSlice";

import {
  checkBackendUpdate,
  checkFrontendUpdate,
  clearUpdateSettingsCache,
  executeFrontendUpdate,
  loadUpdateStrategy,
} from "../redux/slices/updateSlice";

type Params = {
  enabled: boolean;
};

type UpdateEntry = {
  key?: string;
  value?: string;
};

function findEntryValue(
  entries: UpdateEntry[],
  key: string,
): string {
  return String(
    entries.find(
      (entry) => entry.key === key,
    )?.value ?? "",
  ).trim();
}

function toBoolean(value: unknown): boolean {
  return String(value ?? "")
    .trim()
    .toLowerCase() === "true";
}

function reloadCurrentWebApp(): void {
  if (typeof window === "undefined") {
    return;
  }

  const targetUrl =
    new URL(window.location.href);

  targetUrl.searchParams.set(
    "updated",
    String(Date.now()),
  );

  window.location.replace(
    targetUrl.toString(),
  );
}

/**
 * Automatischer Ablauf direkt nach dem Login:
 *
 * 1. Strategie laden.
 * 2. Nur bei aktivierter Automatik Frontend und Backend prüfen.
 * 3. Frontend darf direkt nach Login automatisch installiert werden.
 * 4. Backend wird niemals automatisch installiert.
 */
export function usePostLoginAutoReloadWeb({
  enabled,
}: Params): void {
  const dispatch = useAppDispatch();
  const api = useAppSelector(selectApi);

  const requestRunningRef =
    useRef(false);

  useEffect(() => {
    if (!enabled) return;
    if (Platform.OS !== "web") return;

    if (
      !api.ip ||
      !api.isLoggedIn ||
      !api.isPointingToServer ||
      api.isSwitchingServer ||
      api.isLoggingOut
    ) {
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    const serverKey =
      normalizeBaseUrl(api.ip);

    if (!serverKey) {
      return;
    }

    const checkedStorageKey =
      `postLoginAutoReloadChecked::${serverKey}`;

    if (
      window.sessionStorage.getItem(
        checkedStorageKey,
      ) === "true"
    ) {
      return;
    }

    if (requestRunningRef.current) {
      return;
    }

    let cancelled = false;
    let updateAttemptStorageKey:
      | string
      | null = null;

    requestRunningRef.current = true;

    async function run() {
      try {
        const autoUpdate =
          await dispatch(
            loadUpdateStrategy(),
          ).unwrap();

        if (cancelled) {
          return;
        }

        /*
         * Bei manueller Strategie erfolgt keine automatische Suche.
         * Dafür bleiben die Suchbuttons in den Tabs sichtbar.
         */
        if (!autoUpdate) {
          window.sessionStorage.setItem(
            checkedStorageKey,
            "true",
          );

          return;
        }

        const [
          frontendEntries,
        ] = await Promise.all([
          dispatch(
            checkFrontendUpdate(),
          ).unwrap(),

          /*
           * Nur prüfen. Niemals automatisch ausführen.
           */
          dispatch(
            checkBackendUpdate(),
          ).unwrap(),
        ]);

        if (cancelled) {
          return;
        }

        window.sessionStorage.setItem(
          checkedStorageKey,
          "true",
        );

        const updateAvailable =
          toBoolean(
            findEntryValue(
              frontendEntries,
              "updatecheck.frontend.isavailable",
            ),
          );

        const newVersion =
          findEntryValue(
            frontendEntries,
            "updatecheck.frontend.newversion",
          ) ||
          "unknown";

        if (!updateAvailable) {
          return;
        }

        updateAttemptStorageKey =
          `frontendUpdateAttempt::${serverKey}::${newVersion}`;

        if (
          window.sessionStorage.getItem(
            updateAttemptStorageKey,
          ) === "true"
        ) {
          return;
        }

        window.sessionStorage.setItem(
          updateAttemptStorageKey,
          "true",
        );

        await dispatch(
          executeFrontendUpdate(),
        ).unwrap();

        if (cancelled) {
          return;
        }

        clearUpdateSettingsCache();
        reloadCurrentWebApp();
      } catch (error) {
        console.error(
          "[POST LOGIN UPDATE] Automatic check/update failed",
          error,
        );

        window.sessionStorage.removeItem(
          checkedStorageKey,
        );

        if (updateAttemptStorageKey) {
          window.sessionStorage.removeItem(
            updateAttemptStorageKey,
          );
        }
      } finally {
        requestRunningRef.current = false;
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [
    dispatch,
    enabled,
    api.ip,
    api.isLoggedIn,
    api.isPointingToServer,
    api.isSwitchingServer,
    api.isLoggingOut,
  ]);
}