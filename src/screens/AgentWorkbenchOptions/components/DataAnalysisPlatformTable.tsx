import React from "react";
import { ScrollView, View } from "react-native";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native-unistyles";

import { Table } from "../../../components/Table";
import { H4 } from "../../../components/stylistic/H4";
import { ThemedText } from "../../../components/themed/ThemedText";
import type { BackgroundPlatform } from "../../../redux/slices/dataAnalysisSlice";

type Props = {
  platforms: BackgroundPlatform[];
};

function text(value: unknown): string {
  if (value === undefined || value === null || value === "") return "-";
  return String(value);
}

function percent(value: number): string {
  if (!Number.isFinite(value)) return "-";
  return `${value.toFixed(2)} %`;
}

function formatDate(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "-";
  return new Date(value).toLocaleTimeString();
}

function getStatus(platform: BackgroundPlatform): "warning" | "offline" | "online" {
  if (platform.currentThresholdExceeded) return "warning";
  if (!platform.currentlyAvailable) return "offline";
  return "online";
}

function getRole(platform: BackgroundPlatform, t: any): string {
  return platform.server
    ? t("dataAnalyzing.table.roles.slave")
    : t("dataAnalyzing.table.roles.client");
}

export function DataAnalysisPlatformTable({ platforms }: Props) {
  const { t } = useTranslation(["programStart"]);

  const tableData = [
    [
      <HeaderText key="platform">{t("dataAnalyzing.table.columns.platform")}</HeaderText>,
      <HeaderText key="role">{t("dataAnalyzing.table.columns.role")}</HeaderText>,
      <HeaderText key="status">{t("dataAnalyzing.table.columns.status")}</HeaderText>,
      <HeaderText key="cpu">{t("dataAnalyzing.table.columns.cpu")}</HeaderText>,
      <HeaderText key="memory">{t("dataAnalyzing.table.columns.memory")}</HeaderText>,
      <HeaderText key="jvm">{t("dataAnalyzing.table.columns.jvm")}</HeaderText>,
      <HeaderText key="threads">{t("dataAnalyzing.table.columns.threads")}</HeaderText>,
      <HeaderText key="os">{t("dataAnalyzing.table.columns.os")}</HeaderText>,
      <HeaderText key="ip">{t("dataAnalyzing.table.columns.ip")}</HeaderText>,
      <HeaderText key="jade">{t("dataAnalyzing.table.columns.jade")}</HeaderText>,
      <HeaderText key="lastContact">
        {t("dataAnalyzing.table.columns.lastContact")}
      </HeaderText>,
    ],
    ...platforms.map((platform) => {
      const status = getStatus(platform);

      return [
        <CellText key="platform" strong>
          {text(platform.platformName)}
        </CellText>,
        <CellText key="role">{getRole(platform, t)}</CellText>,
        <StatusText
          key="status"
          status={status}
          label={t(`dataAnalyzing.table.status.${status}`)}
        />,
        <CellText key="cpu">{percent(platform.currentCpuLoad)}</CellText>,
        <CellText key="memory">{percent(platform.currentMemoryLoad)}</CellText>,
        <CellText key="jvm">{percent(platform.currentMemoryLoadJvm)}</CellText>,
        <CellText key="threads">{text(platform.currentNumThreads)}</CellText>,
        <CellText key="os">
          {`${text(platform.osName)} ${text(platform.osVersion)}`.trim()}
        </CellText>,
        <CellText key="ip">{text(platform.ipAddress)}</CellText>,
        <CellText key="jade">{text(platform.jadePort)}</CellText>,
        <CellText key="lastContact">
          {formatDate(platform.lastContact)}
        </CellText>,
      ];
    }),
  ];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <H4>{t("dataAnalyzing.table.title")}</H4>
          <ThemedText style={styles.subtitle}>
            {t("dataAnalyzing.table.subtitle")}
          </ThemedText>
        </View>

        <ThemedText style={styles.countText}>
          {platforms.length} {t("dataAnalyzing.table.countLabel")}
        </ThemedText>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View style={styles.tableBox}>
          <Table
            data={tableData}
            columnFlex={[2.4, 0.9, 1, 0.9, 1, 0.9, 0.8, 1.8, 1.2, 0.8, 1.2]}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function HeaderText({ children }: { children: React.ReactNode }) {
  return <ThemedText style={styles.headerText}>{children}</ThemedText>;
}

function CellText({
  children,
  strong = false,
}: {
  children: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <ThemedText style={[styles.cellText, strong ? styles.cellStrong : null]}>
      {children}
    </ThemedText>
  );
}

function StatusText({
  status,
  label,
}: {
  status: "warning" | "offline" | "online";
  label: string;
}) {
  return (
    <View style={styles.statusRow}>
      <View
        style={[
          styles.statusDot,
          status === "online"
            ? styles.statusOnline
            : status === "warning"
              ? styles.statusWarning
              : styles.statusOffline,
        ]}
      />

      <ThemedText style={styles.cellText}>{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    gap: 14,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
  },

  subtitle: {
    opacity: 0.65,
    fontSize: 12,
    marginTop: 2,
  },

  countText: {
    opacity: 0.7,
    fontWeight: "700",
  },

  tableBox: {
    minWidth: 1380,
  },

  headerText: {
    fontWeight: "800",
    fontSize: 13,
  },

  cellText: {
    fontSize: 13,
  },

  cellStrong: {
    fontWeight: "700",
  },

  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderColor: theme.colors.border,
  },

  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },

  statusOnline: {
    backgroundColor: theme.colors.primary,
  },

  statusWarning: {
    backgroundColor: "#f59e0b",
  },

  statusOffline: {
    backgroundColor: "#ef4444",
  },
}));