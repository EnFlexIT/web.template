import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { useTranslation } from "react-i18next";

import { useAppSelector } from "./useAppSelector";
import { useAppDispatch } from "./useAppDispatch";
import { addNotification } from "../redux/slices/notificationSlice";
import { loadUpdateSettingsIfNeeded } from "../redux/slices/updateSlice";
import { selectApi } from "../redux/slices/apiSlice";
import { normalizeServerKey } from "../redux/selectors/serverSelectors";

const UPDATE_CHECK_MAX_AGE_MS = 60 * 60 * 1000;

export function useUpdateNotifierWeb(opts?: { intervalMs?: number }) {
  const dispatch = useAppDispatch();
  const { t } = useTranslation(["Notifications"]);

  const intervalMs = opts?.intervalMs ?? UPDATE_CHECK_MAX_AGE_MS;

  const api = useAppSelector(selectApi);
  const updateState = useAppSelector((state) => state.update);

  const ip = api.ip;
  const isLoggedIn = api.isLoggedIn;
  const isWeb = Platform.OS === "web";
  const serverKey = normalizeServerKey(ip);

  const lastNotifiedVersionRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isWeb || !ip || !isLoggedIn) return;

    const checkUpdates = () => {
      dispatch(
        loadUpdateSettingsIfNeeded({
          force: false,
          maxAgeMs: UPDATE_CHECK_MAX_AGE_MS,
        }),
      );
    };

    checkUpdates();

    const timer = setInterval(() => {
      checkUpdates();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [dispatch, intervalMs, ip, isLoggedIn, isWeb]);

  useEffect(() => {
    if (!isWeb || !ip || !isLoggedIn) return;
    if (!updateState.frontend.isAvailable) return;

    const version =
      updateState.frontend.newVersion ||
      updateState.frontend.version ||
      "unknown";

    if (lastNotifiedVersionRef.current === version) return;

    lastNotifiedVersionRef.current = version;

    dispatch(
      addNotification({
        id: `web-update-${serverKey}-${version}`,
        serverKey,
        type: "update",
        title: t("new_version_available"),
        message: version,
        createdAt: new Date().toISOString(),
        read: false,
        severity: "info",
        action: {
          type: "navigate",
          menuId: 3014,
        },
      }),
    );
  }, [
    dispatch,
    ip,
    isLoggedIn,
    isWeb,
    serverKey,
    t,
    updateState.frontend.isAvailable,
    updateState.frontend.newVersion,
    updateState.frontend.version,
  ]);
}