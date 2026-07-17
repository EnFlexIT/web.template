import React, { useEffect } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useTranslation } from "react-i18next";

import { Card } from "../../../components/ui-elements/Card";
import { ThemedText } from "../../../components/themed/ThemedText";
import { H3 } from "../../../components/stylistic/H3";
import { TableSwitchCell } from "../../../components/ui-elements/TableSwitchCell";

import { useAppDispatch } from "../../../hooks/useAppDispatch";
import { useAppSelector } from "../../../hooks/useAppSelector";

import {
  checkBackendUpdate,
  checkFrontendUpdate,
  loadUpdateStrategy,
  saveAutoUpdate,
} from "../../../redux/slices/updateSlice";

function Row({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={s.row}>
      <ThemedText style={s.label}>
        {label}
      </ThemedText>

      <ThemedText style={s.value}>
        {value || "-"}
      </ThemedText>
    </View>
  );
}

function SwitchRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <View style={s.row}>
      <ThemedText style={s.label}>
        {label}
      </ThemedText>

      <TableSwitchCell
        value={value}
        onChange={onChange}
      />
    </View>
  );
}

export function UpdateGeneralTab() {
  const { t } = useTranslation(["Update"]);
  const dispatch = useAppDispatch();

  const updateState = useAppSelector(
    (state) => state.update,
  );

  /*
   * Der General-Tab lädt ausschließlich die Strategie.
   * Frontend und Backend werden von den Watchern beziehungsweise
   * den manuellen Buttons gezielt geprüft.
   */
  useEffect(() => {
    void dispatch(
      loadUpdateStrategy(),
    );
  }, [dispatch]);

  const webStatus =
    updateState.frontend.isPending
      ? t(
          "serverWeb.statusTexts.checking",
          "Suche nach Updates...",
        )
      : updateState.frontend.isAvailable
        ? t(
            "serverWeb.statusTexts.updateAvailable",
            "Update verfügbar",
          )
        : updateState.frontend.lastCheck
          ? t(
              "serverWeb.statusTexts.upToDate",
              "Aktuell",
            )
          : t(
              "serverWeb.statusTexts.notChecked",
              "Noch nicht geprüft",
            );

  const backendStatus =
    updateState.backend.isPending
      ? t(
          "backend.statusTexts.checking",
          "Suche nach Updates...",
        )
      : updateState.backend.isAvailable
        ? t(
            "serverWeb.statusTexts.updateAvailable",
            "Update verfügbar",
          )
        : updateState.backend.lastCheck
          ? t(
              "serverWeb.statusTexts.upToDate",
              "Aktuell",
            )
          : t(
              "backend.statusTexts.notChecked",
              "Noch nicht geprüft",
            );

  return (
    <Card>
      <View style={s.container}>
        <H3>
          {t("general.title", "Allgemein")}
        </H3>

        <View style={s.block}>
          <ThemedText style={s.blockTitle}>
            {t(
              "general.updateStrategy",
              "Update-Strategie",
            )}
          </ThemedText>

          <SwitchRow
            label={t(
              "general.autoUpdate",
              "Automatische Updates",
            )}
            value={updateState.autoUpdate}
            onChange={async (next) => {
              await dispatch(
                saveAutoUpdate(next),
              ).unwrap();

              /*
               * Beim Aktivieren werden Frontend und Backend sofort geprüft.
               * Während einer aktiven Sitzung wird hier nichts installiert.
               */
              if (next) {
                await Promise.allSettled([
                  dispatch(
                    checkFrontendUpdate(),
                  ).unwrap(),

                  dispatch(
                    checkBackendUpdate(),
                  ).unwrap(),
                ]);
              }
            }}
          />
        </View>

        <View style={s.block}>
          <ThemedText style={s.blockTitle}>
            {t(
              "general.webApp",
              "Web-App",
            )}
          </ThemedText>

          <Row
            label={t(
              "general.webStatus",
              "Status",
            )}
            value={webStatus}
          />
        </View>

        <View style={s.block}>
          <ThemedText style={s.blockTitle}>
            {t(
              "general.backend",
              "Backend",
            )}
          </ThemedText>

          <Row
            label={t(
              "general.backendStatus",
              "Status",
            )}
            value={backendStatus}
          />
        </View>
      </View>
    </Card>
  );
}

const s = StyleSheet.create({
  container: {
    gap: 14,
  },

  block: {
    gap: 10,
  },

  blockTitle: {
    fontSize: 16,
    fontWeight: "700",
  },

  row: {
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
});
