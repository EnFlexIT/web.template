import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { useTranslation } from "react-i18next";

import { useAppDispatch } from "./useAppDispatch";
import { useAppSelector } from "./useAppSelector";

import {
  addNotification,
  removeNotification,
} from "../redux/slices/notificationSlice";

import {
  checkBackendUpdate,
  checkFrontendUpdate,
} from  "../core/update/redux/updateSlice";

import {
  selectApi,
} from "../redux/slices/apiSlice";

import {
  normalizeServerKey,
} from "../redux/selectors/serverSelectors";

const DEFAULT_UPDATE_CHECK_INTERVAL_MS =
  60 * 60 * 1000;

const UPDATE_MENU_ID = 3014;

type UseUpdateNotifierOptions = {
  enabled: boolean;
  intervalMs?: number;
};

type AbortableRequest = {
  abort?: () => void;
  unwrap: () => Promise<unknown>;
};

/**
 * Periodische Update-Suche während der Benutzung.
 *
 * Die Strategie "autoUpdate" steuert ausschließlich die Suche.
 * Dieser Hook installiert weder Frontend noch Backend und löst
 * keinen Reload aus.
 */
export function useUpdateNotifierWeb({
  enabled,
  intervalMs = DEFAULT_UPDATE_CHECK_INTERVAL_MS,
}: UseUpdateNotifierOptions): void {
  const dispatch = useAppDispatch();
  const { t } = useTranslation([
    "Notifications",
  ]);

  const api = useAppSelector(selectApi);

  const updateState = useAppSelector(
    (state) => state.update,
  );

  const notificationItems =
    useAppSelector(
      (state) =>
        state.notifications.items,
    );

  const requestRunningRef =
    useRef(false);

  const activeRequestsRef =
    useRef<AbortableRequest[]>([]);

  const lastCheckStartedAtRef =
    useRef(Date.now());

  const isWeb =
    Platform.OS === "web";

  const serverKey =
    normalizeServerKey(api.ip);

  useEffect(() => {
    lastCheckStartedAtRef.current =
      Date.now();
  }, [serverKey]);

  useEffect(() => {
    if (!enabled || !isWeb) {
      return;
    }

    if (
      !updateState.autoUpdate ||
      !api.ip ||
      !serverKey ||
      !api.isLoggedIn ||
      !api.isPointingToServer ||
      api.isSwitchingServer ||
      api.isLoggingOut
    ) {
      return;
    }

    if (
      typeof window === "undefined"
    ) {
      return;
    }

    let disposed = false;

    async function runUpdateChecks() {
      if (
        disposed ||
        requestRunningRef.current
      ) {
        return;
      }

      requestRunningRef.current =
        true;

      lastCheckStartedAtRef.current =
        Date.now();

      const frontendRequest =
        dispatch(
          checkFrontendUpdate(),
        ) as AbortableRequest;

      const backendRequest =
        dispatch(
          checkBackendUpdate(),
        ) as AbortableRequest;

      activeRequestsRef.current = [
        frontendRequest,
        backendRequest,
      ];

      try {
        await Promise.allSettled([
          frontendRequest.unwrap(),
          backendRequest.unwrap(),
        ]);
      } finally {
        activeRequestsRef.current = [];
        requestRunningRef.current =
          false;
      }
    }

    /*
     * Kein sofortiger doppelter Check.
     * Den ersten Check nach Login übernimmt
     * usePostLoginAutoReloadWeb.
     */
    const intervalId =
      window.setInterval(
        () => {
          void runUpdateChecks();
        },
        intervalMs,
      );

    function handleWindowFocus() {
      const age =
        Date.now() -
        lastCheckStartedAtRef.current;

      if (age < intervalMs) {
        return;
      }

      void runUpdateChecks();
    }

    window.addEventListener(
      "focus",
      handleWindowFocus,
    );

    return () => {
      disposed = true;

      window.clearInterval(
        intervalId,
      );

      window.removeEventListener(
        "focus",
        handleWindowFocus,
      );

      activeRequestsRef.current.forEach(
        (request) => {
          request.abort?.();
        },
      );

      activeRequestsRef.current = [];
      requestRunningRef.current =
        false;
    };
  }, [
    dispatch,
    enabled,
    intervalMs,
    isWeb,
    serverKey,
    api.ip,
    api.isLoggedIn,
    api.isPointingToServer,
    api.isSwitchingServer,
    api.isLoggingOut,
    updateState.autoUpdate,
  ]);

  /*
   * Frontend-Notification.
   */
  useEffect(() => {
    if (
      !enabled ||
      !isWeb ||
      !serverKey ||
      !api.isLoggedIn ||
      api.isSwitchingServer ||
      api.isLoggingOut
    ) {
      return;
    }

    const prefix =
      `update:frontend:${serverKey}:`;

    const existing =
      notificationItems.filter(
        (item) =>
          normalizeServerKey(
            item.serverKey,
          ) === serverKey &&
          item.id.startsWith(prefix),
      );

    const version =
      String(
        updateState.frontend.newVersion ||
          updateState.frontend.version ||
          "",
      ).trim();

    if (
      !updateState.frontend.isAvailable ||
      !version
    ) {
      existing.forEach((item) => {
        dispatch(
          removeNotification(item.id),
        );
      });

      return;
    }

    const notificationId =
      `${prefix}${version}`;

    existing
      .filter(
        (item) =>
          item.id !== notificationId,
      )
      .forEach((item) => {
        dispatch(
          removeNotification(item.id),
        );
      });

    if (
      existing.some(
        (item) =>
          item.id === notificationId,
      )
    ) {
      return;
    }

    dispatch(
      addNotification({
        id: notificationId,
        serverKey,
        type: "update",

        title: t(
          "frontend_update_available_title",
          "Web-App-Update verfügbar",
        ),

        message: t(
          "frontend_update_available_message",
          {
            version,
            defaultValue:
              "Die Web-App-Version {{version}} ist verfügbar. Die Installation muss manuell gestartet werden.",
          },
        ),

        createdAt:
          new Date().toISOString(),

        read: false,
        severity: "info",

        action: {
          type: "navigate",
          menuId: UPDATE_MENU_ID,
        },
      }),
    );
  }, [
    dispatch,
    enabled,
    isWeb,
    serverKey,
    api.isLoggedIn,
    api.isSwitchingServer,
    api.isLoggingOut,
    updateState.frontend.isAvailable,
    updateState.frontend.newVersion,
    updateState.frontend.version,
    notificationItems,
    t,
  ]);

  /*
   * Backend-Notification.
   */
  useEffect(() => {
    if (
      !enabled ||
      !isWeb ||
      !serverKey ||
      !api.isLoggedIn ||
      api.isSwitchingServer ||
      api.isLoggingOut
    ) {
      return;
    }

    const prefix =
      `update:backend:${serverKey}:`;

    const existing =
      notificationItems.filter(
        (item) =>
          normalizeServerKey(
            item.serverKey,
          ) === serverKey &&
          item.id.startsWith(prefix),
      );

    if (
      !updateState.backend.isAvailable
    ) {
      existing.forEach((item) => {
        dispatch(
          removeNotification(item.id),
        );
      });

      return;
    }

    const token =
      String(
        updateState.backend.lastCheck ||
          "available",
      )
        .trim()
        .replace(/\s+/g, "_");

    const notificationId =
      `${prefix}${token}`;

    existing
      .filter(
        (item) =>
          item.id !== notificationId,
      )
      .forEach((item) => {
        dispatch(
          removeNotification(item.id),
        );
      });

    if (
      existing.some(
        (item) =>
          item.id === notificationId,
      )
    ) {
      return;
    }

    dispatch(
      addNotification({
        id: notificationId,
        serverKey,
        type: "update",

        title: t(
          "backend_update_available_title",
          "Backend-Update verfügbar",
        ),

        message: t(
          "backend_update_available_message",
          "Für das Backend ist ein Update verfügbar. Die Installation muss manuell gestartet werden.",
        ),

        createdAt:
          new Date().toISOString(),

        read: false,
        severity: "warning",

        action: {
          type: "navigate",
          menuId: UPDATE_MENU_ID,
        },
      }),
    );
  }, [
    dispatch,
    enabled,
    isWeb,
    serverKey,
    api.isLoggedIn,
    api.isSwitchingServer,
    api.isLoggingOut,
    updateState.backend.isAvailable,
    updateState.backend.lastCheck,
    notificationItems,
    t,
  ]);
}
