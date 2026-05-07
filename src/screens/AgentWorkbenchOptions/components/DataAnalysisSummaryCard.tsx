import React from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native-unistyles";

import { Card } from "../../../components/ui-elements/Card";
import { H4 } from "../../../components/stylistic/H4";
import { ThemedText } from "../../../components/themed/ThemedText";

import type { BackgroundPlatform } from "../../../redux/slices/dataAnalysisSlice";

type Props = {
  platforms: BackgroundPlatform[];
};

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatPercent(value: number): string {
  return Number.isFinite(value) ? `${value.toFixed(2)} %` : "0.00 %";
}

export function DataAnalysisSummaryCard({ platforms }: Props) {
  const { t } = useTranslation(["programStart"]);

  const platformCount = platforms.length;

  const masterServers = platforms.filter((platform) => platform.server).length;

  const availablePlatforms = platforms.filter(
    (platform) => platform.currentlyAvailable,
  ).length;

  const thresholdExceeded = platforms.filter(
    (platform) => platform.currentThresholdExceeded,
  ).length;

  const avgCpu = average(platforms.map((platform) => platform.currentCpuLoad));

  const avgMemory = average(
    platforms.map((platform) => platform.currentMemoryLoad),
  );

  const avgJvmMemory = average(
    platforms.map((platform) => platform.currentMemoryLoadJvm),
  );

  const totalThreads = platforms.reduce(
    (sum, platform) => sum + platform.currentNumThreads,
    0,
  );

  const isOnline = masterServers > 0;

  const availabilityText =
    platformCount > 0 ? `${availablePlatforms}/${platformCount}` : "0/0";

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleArea}>
          <H4>{t("dataAnalyzing.summary.title")}</H4>

          <ThemedText style={styles.subtitle}>
            {t("dataAnalyzing.summary.subtitle")}
          </ThemedText>
        </View>

        <View style={[styles.statusBadge, !isOnline && styles.statusOffline]}>
          <ThemedText style={styles.statusText}>
            {isOnline
              ? t("dataAnalyzing.summary.online")
              : t("dataAnalyzing.summary.offline")}
          </ThemedText>
        </View>
      </View>

      <View style={styles.summaryGrid}>
        <StatBox
          label={t("dataAnalyzing.summary.stats.platforms")}
          value={String(platformCount)}
        />

        <StatBox
          label={t("dataAnalyzing.summary.stats.master")}
          value={String(masterServers)}
        />

        <StatBox
          label={t("dataAnalyzing.summary.stats.available")}
          value={availabilityText}
        />

        <StatBox
          label={t("dataAnalyzing.summary.stats.threshold")}
          value={
            thresholdExceeded > 0
              ? String(thresholdExceeded)
              : t("dataAnalyzing.summary.ok")
          }
          emphasized={thresholdExceeded === 0}
        />
      </View>

      <View style={styles.metricList}>
        <MetricRow
          label={t("dataAnalyzing.summary.metrics.avgCpu")}
          value={formatPercent(avgCpu)}
        />

        <MetricRow
          label={t("dataAnalyzing.summary.metrics.avgMemory")}
          value={formatPercent(avgMemory)}
        />

        <MetricRow
          label={t("dataAnalyzing.summary.metrics.jvmMemory")}
          value={formatPercent(avgJvmMemory)}
        />

        <MetricRow
          label={t("dataAnalyzing.summary.metrics.threads")}
          value={String(totalThreads)}
        />
      </View>
    </Card>
  );
}

function StatBox({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <View style={styles.statBox}>
      <ThemedText style={styles.statLabel}>{label}</ThemedText>

      <ThemedText
        style={[styles.statValue, emphasized && styles.statValueEmphasized]}
      >
        {value}
      </ThemedText>
    </View>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricRow}>
      <ThemedText style={styles.metricLabel}>{label}</ThemedText>
      <ThemedText style={styles.metricValue}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
  height: 450,
  minHeight: 450,
  padding: 18,
  justifyContent: "space-between",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 15,
    marginBottom: 8,
  },

  titleArea: {
    flex: 1,
    bottom:20,
  },

  subtitle: {
    marginTop: 3,
    fontSize: 12,
    opacity: 0.65,
    marginBottom: 6,
  },

  statusBadge: {
    borderRadius: 0,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: theme.colors.primary,
    bottom: 20,
  },

  statusOffline: {
    backgroundColor: theme.colors.notification,
  },

  statusText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.4,
  },

  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  statBox: {
    width: "47%",
    minHeight: 68,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 10,
    paddingHorizontal: 12,
    justifyContent: "space-between",
    backgroundColor: theme.colors.background,
    marginBottom: 8,
  },

  statLabel: {
    fontSize: 11,
    opacity: 0.65,
  },

  statValue: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: "700",
    color: theme.colors.primary,
  },

  statValueEmphasized: {
    letterSpacing: 0.2,
  },

  metricList: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 16,
    gap: 10,
  },

  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  metricLabel: {
    fontSize: 13,
    opacity: 0.72,
  },

  metricValue: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.primary,
  },
}));