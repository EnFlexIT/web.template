import { useEffect, useRef } from "react";
import { Platform } from "react-native";

import { useAppDispatch } from "../../hooks/useAppDispatch";
import { useAppSelector } from "../../hooks/useAppSelector";

import {
  normalizeBaseUrl,
  selectApi,
} from "../../redux/slices/apiSlice";

import {
  checkBackendUpdate,
  checkFrontendUpdate,
  loadUpdateStrategy,
} from "../redux/updateSlice";

type Params = {
  enabled: boolean;
};

/**
 * Der Dateiname bleibt aus Kompatibilitätsgründen bestehen.
 *
 * Die Funktion führt aber keinen automatischen Reload und keine
 * automatische Installation mehr aus.
 *
 * "Automatische Updates" bedeutet:
 * - Strategie nach Login laden
 * - Frontend automatisch prüfen
 * - Backend automatisch prüfen
 * - Ergebnisse im Redux-State ablegen
 *
 * Installation und Reload bleiben immer eine Benutzerentscheidung.
 */
export function usePostLoginAutoReloadWeb({
  enabled,
}: Params): void {
  const dispatch = useAppDispatch();
  const api = useAppSelector(selectApi);

  const checkedServerRef =
    useRef<string | null>(null);

  const requestRunningRef =
    useRef(false);

  /*
   * Bei Logout oder deaktiviertem Watcher darf derselbe Server
   * beim nächsten Login erneut geprüft werden.
   */
  useEffect(() => {
    if (
      !enabled ||
      !api.isLoggedIn
    ) {
      checkedServerRef.current =
        null;

      requestRunningRef.current =
        false;
    }
  }, [
    enabled,
    api.isLoggedIn,
  ]);

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

    const serverKey =
      normalizeBaseUrl(api.ip);

    if (!serverKey) {
      return;
    }

    /*
     * Genau einmal pro geladenem Dokument und Server.
     * Kein sessionStorage-Guard, damit nach einem echten Reload
     * wieder ein frischer Check durchgeführt wird.
     */
    if (
      checkedServerRef.current ===
      serverKey
    ) {
      return;
    }

    if (requestRunningRef.current) {
      return;
    }

    let cancelled = false;

    checkedServerRef.current =
      serverKey;

    requestRunningRef.current =
      true;

    async function runAutomaticChecks() {
      try {
        const autoUpdate =
          await dispatch(
            loadUpdateStrategy(),
          ).unwrap();

        if (cancelled) {
          return;
        }

        /*
         * Bei manueller Strategie werden keine automatischen
         * Update-Checks ausgeführt. Die Buttons bleiben sichtbar.
         */
        if (!autoUpdate) {
          return;
        }

        /*
         * Nur prüfen.
         *
         * Kein executeFrontendUpdate()
         * Kein executeBackendUpdate()
         * Kein Reload
         */
        await Promise.allSettled([
          dispatch(
            checkFrontendUpdate(),
          ).unwrap(),

          dispatch(
            checkBackendUpdate(),
          ).unwrap(),
        ]);
      } catch (error) {
        checkedServerRef.current =
          null;

        console.error(
          "[POST LOGIN UPDATE] Automatic update checks failed",
          error,
        );
      } finally {
        requestRunningRef.current =
          false;
      }
    }

    void runAutomaticChecks();

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
