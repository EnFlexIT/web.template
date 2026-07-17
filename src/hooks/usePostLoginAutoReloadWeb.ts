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

import {
  reloadUpdatedFrontendWebApp,} from "../redux/slices/reloadUpdatedFrontendWebApp";

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

/**
 * Automatischer Ablauf direkt nach dem Login:
 *
 * 1. Strategie laden.
 * 2. Nur bei aktivierter Automatik Frontend und Backend prüfen.
 * 3. Frontend darf direkt nach Login automatisch installiert werden.
 * 4. Backend wird niemals automatisch installiert.
 * 5. Nach erfolgreichem Frontend-Update werden Browser-Caches
 *    bereinigt und index.html vollständig neu geladen.
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
           * Backend ausschließlich prüfen.
           * Niemals automatisch installieren.
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
          /*
           * Eine frühere Update-Sperre ist nach einem
           * erfolgreichen Versionswechsel nicht mehr relevant.
           */
          const attemptPrefix =
            `frontendUpdateAttempt::${serverKey}::`;

          for (
            let index = 0;
            index <
            window.sessionStorage.length;
            index += 1
          ) {
            const key =
              window.sessionStorage.key(index);

            if (
              key?.startsWith(
                attemptPrefix,
              )
            ) {
              window.sessionStorage.removeItem(
                key,
              );

              index -= 1;
            }
          }

          return;
        }

        updateAttemptStorageKey =
          `frontendUpdateAttempt::${serverKey}::${newVersion}`;

        if (
          window.sessionStorage.getItem(
            updateAttemptStorageKey,
          ) === "true"
        ) {
          console.warn(
            "[POST LOGIN UPDATE] This frontend version was already attempted",
            {
              serverKey,
              newVersion,
            },
          );

          return;
        }

        window.sessionStorage.setItem(
          updateAttemptStorageKey,
          "true",
        );

        /*
         * Der Execute-Request wird vollständig abgewartet.
         */
        await dispatch(
          executeFrontendUpdate(),
        ).unwrap();

        if (cancelled) {
          return;
        }

        clearUpdateSettingsCache();

        const reloadStarted =
          await reloadUpdatedFrontendWebApp({
            baseUrl: api.ip,
            version: newVersion,
          });

        if (!reloadStarted) {
          throw new Error(
            "Die aktualisierte Web-App konnte nicht neu geladen werden.",
          );
        }
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