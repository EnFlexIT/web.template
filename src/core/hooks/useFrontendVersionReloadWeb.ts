import { useEffect, useRef } from "react";
import { Platform } from "react-native";

import { useAppSelector } from "../../hooks/useAppSelector";

import {
  normalizeBaseUrl,
  selectApi,
} from "../../redux/slices/apiSlice";

import {
  clearUpdateSettingsCache,
} from "../redux/updateSlice";

import {
  reloadUpdatedFrontendWebApp,} from "../../redux/slices/reloadUpdatedFrontendWebApp";

type Params = {
  enabled: boolean;
};

/**
 * Beobachtet die tatsächlich installierte WEBAPP-Version.
 *
 * Die erste geladene Version wird nur als Ausgangswert gespeichert.
 * Ändert sich die Version später während derselben Browser-Sitzung,
 * wird die Web-App genau einmal vollständig neu geladen.
 */
export function useFrontendVersionReloadWeb({
  enabled,
}: Params): void {
  const api = useAppSelector(selectApi);

  const currentVersion = useAppSelector(
    (state) =>
      state.update.frontend.currentVersion,
  );

  const reloadRunningRef =
    useRef(false);

  useEffect(() => {
    if (!enabled) return;
    if (Platform.OS !== "web") return;

    if (
      typeof window === "undefined" ||
      !api.ip ||
      !api.isLoggedIn ||
      api.isSwitchingServer ||
      api.isLoggingOut
    ) {
      return;
    }

    const serverKey =
      normalizeBaseUrl(api.ip);

    const normalizedVersion =
      String(currentVersion ?? "").trim();

    if (
      !serverKey ||
      !normalizedVersion ||
      normalizedVersion === "-"
    ) {
      return;
    }

    const loadedVersionKey =
      `loadedFrontendVersion::${serverKey}`;

    const previousVersion =
      window.sessionStorage.getItem(
        loadedVersionKey,
      );

    /*
     * Beim ersten Versionsabruf nur den Ausgangswert setzen.
     */
    if (!previousVersion) {
      window.sessionStorage.setItem(
        loadedVersionKey,
        normalizedVersion,
      );

      return;
    }

    if (
      previousVersion ===
      normalizedVersion
    ) {
      return;
    }

    const reloadGuardKey =
      `frontendVersionReloaded::${serverKey}::${normalizedVersion}`;

    /*
     * Vor dem Reload den neuen Stand speichern.
     * Dadurch entsteht nach der Navigation keine Reload-Schleife.
     */
    window.sessionStorage.setItem(
      loadedVersionKey,
      normalizedVersion,
    );

    if (
      window.sessionStorage.getItem(
        reloadGuardKey,
      ) === "true"
    ) {
      return;
    }

    if (reloadRunningRef.current) {
      return;
    }

    reloadRunningRef.current = true;

    window.sessionStorage.setItem(
      reloadGuardKey,
      "true",
    );

    clearUpdateSettingsCache();

    console.info(
      "[FRONTEND VERSION] Installed version changed",
      {
        serverKey,
        previousVersion,
        currentVersion:
          normalizedVersion,
      },
    );

    void reloadUpdatedFrontendWebApp({
      baseUrl: api.ip,
      version: normalizedVersion,
    }).catch((error) => {
      reloadRunningRef.current = false;

      window.sessionStorage.removeItem(
        reloadGuardKey,
      );

      console.error(
        "[FRONTEND VERSION] Full reload failed",
        error,
      );
    });
  }, [
    enabled,
    api.ip,
    api.isLoggedIn,
    api.isSwitchingServer,
    api.isLoggingOut,
    currentVersion,
  ]);
}
