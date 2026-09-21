import React from "react";

import {
  StyleSheet,
  View,
} from "react-native";

import {
  useTranslation,
} from "react-i18next";

import {
  Card,
} from "@/template/components/design-system/ui-elements/Card";

import {
  ThemedText,
} from "@/template/components/design-system/themed/ThemedText";

import {
  H3,
} from "@/template/components/design-system/stylistic/H3";

import {
  useApplicationConfig,
} from "@/template/application/ApplicationConfigContext";

export function AppInformationTab() {
  const { t } =
    useTranslation(["Update"]);

  const application =
    useApplicationConfig();

  const applicationVersion =
    application.buildInfo?.application.version ??
    "-";

  const templateVersion =
    application.buildInfo?.template.version ??
    "-";

  return (
    <View style={s.container}>
      <Card>
        <View style={s.cardContent}>
          <H3>
            {t(
              "appInformation.application.title",
              "Application",
            )}
          </H3>

          <Row
            label={t(
              "appInformation.application.name",
              "Name",
            )}
            value={application.displayName}
          />

          <Row
            label={t(
              "appInformation.application.version",
              "Version",
            )}
            value={applicationVersion}
          />
        </View>
      </Card>

      <Card>
        <View style={s.cardContent}>
          <H3>
            {t(
              "appInformation.template.title",
              "Base Template",
            )}
          </H3>

          <Row
            label={t(
              "appInformation.template.version",
              "Version",
            )}
            value={templateVersion}
          />
        </View>
      </Card>
    </View>
  );
}

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

const s = StyleSheet.create({
  container: {
    gap: 14,
  },

  cardContent: {
    gap: 14,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  label: {
    flex: 1,
    fontSize: 12,
    opacity: 0.75,
  },

  value: {
    fontSize: 13,
    fontWeight: "600",
  },
});