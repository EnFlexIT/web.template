import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Card } from "../../../components/ui-elements/Card";
import { ActionButton } from "../../../components/ui-elements/ActionButton";
import { ThemedText } from "../../../components/themed/ThemedText";
import { H3 } from "../../../components/stylistic/H3";

import { useAppSelector } from "../../../hooks/useAppSelector";
import { useAppDispatch } from "../../../hooks/useAppDispatch";
import { selectApi } from "../../../redux/slices/apiSlice";
import {
  checkFrontendUpdate,
  loadUpdateSettingsIfNeeded,
} from "../../../redux/slices/updateSlice";

export function UpdateWebAppTab() {
  const { t } = useTranslation(["Update"]);
  const dispatch = useAppDispatch();

  const api = useAppSelector(selectApi);
  const updateState = useAppSelector((state) => state.update);

  const ip = api.ip;
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    dispatch(
      loadUpdateSettingsIfNeeded({
        force: false,
        maxAgeMs: 30 * 60 * 1000,
      }),
    );
  }, [dispatch]);

  const checkNow = useCallback(async () => {
    if (!ip || isChecking) return;

    setIsChecking(true);

    try {
      await dispatch(checkFrontendUpdate()).unwrap();

      await dispatch(
        loadUpdateSettingsIfNeeded({
          force: true,
        }),
      ).unwrap();
    } finally {
      setIsChecking(false);
    }
  }, [dispatch, ip, isChecking]);

  const reloadWebApp = useCallback(() => {
    if (typeof window === "undefined") return;
    window.location.reload();
  }, []);

  const updateStatus = updateState.frontend.isAvailable
    ? t("serverWeb.statusTexts.updateAvailable", {
        version:
          updateState.frontend.newVersion ||
          updateState.frontend.version ||
          "-",
      })
    : t("serverWeb.statusTexts.upToDate");

  const currentVersion =
    updateState.frontend.currentVersion ||
    updateState.frontend.version ||
    "-";

  const newVersion =
    updateState.frontend.newVersion ||
    (updateState.frontend.isAvailable ? updateState.frontend.version : "") ||
    "-";

  const lastCheckedAt = updateState.frontend.lastCheck || "-";

  return (
    <Card>
      <View style={s.container}>
        <H3>{t("serverWeb.title", "Web-App")}</H3>

        <Row
          label={t("serverWeb.fields.acceptedVersion", "Aktuelle Version")}
          value={currentVersion}
        />

        <Row
          label={t("serverWeb.fields.newVersion", "Neue Version")}
          value={newVersion}
        />

        <Row label={t("serverWeb.fields.status")} value={updateStatus} />

        <Row
          label={t("serverWeb.fields.lastCheck", "Letzte Prüfung")}
          value={lastCheckedAt}
        />

        <View style={s.btnRow}>
          {!updateState.frontend.isAvailable && !updateState.autoUpdate && (
            <ActionButton
              label={
                isChecking
                  ? t("serverWeb.actions.checking")
                  : t("serverWeb.actions.checkNow")
              }
              variant="secondary"
              size="xs"
              onPress={checkNow}
              disabled={isChecking || !ip || updateState.loading}
            />
          )}

          {updateState.frontend.isAvailable && (
            <ActionButton
              label={t("serverWeb.actions.reloadNow")}
              variant="primary"
              size="xs"
              onPress={reloadWebApp}
              disabled={isChecking}
            />
          )}
        </View>
      </View>
    </Card>
  );
}

function Row(props: { label: string; value: string }) {
  return (
    <View style={s.rowLine}>
      <ThemedText style={s.label}>{props.label}</ThemedText>
      <ThemedText style={s.value}>{props.value || "-"}</ThemedText>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    gap: 14,
  },

  rowLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  label: {
    fontSize: 12,
    opacity: 0.75,
    flex: 1,
  },

  value: {
    fontSize: 13,
    fontWeight: "600",
  },

  btnRow: {
    flexDirection: "row",
    gap: 5,
    justifyContent: "flex-end",
    padding: 5,
  },
});