import React, { useMemo, useState } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { Card } from "../../../components/ui-elements/Card";
import { H4 } from "../../../components/stylistic/H4";
import { ThemedText } from "../../../components/themed/ThemedText";

import { VictoryArea, VictoryChart } from "enflex.it-graph";
import { createEnFlexChart } from "../../../styles/charttheme";

import type { DataAnalysisHistoryEntry } from "../../../redux/slices/dataAnalysisSlice";

type Props = {
  history: DataAnalysisHistoryEntry[];
};

type ChartPoint = {
  x: number;
  y: number;
};

function createSeries(
  history: DataAnalysisHistoryEntry[],
  key: "cpuLoad" | "memoryLoad" | "threads",
): ChartPoint[] {
  return history.map((entry, index) => ({
    x: index + 1,
    y: Number(entry[key]) || 0,
  }));
}

function getLastValue(
  history: DataAnalysisHistoryEntry[],
  key: "cpuLoad" | "memoryLoad" | "threads",
): number {
  const last = history[history.length - 1];

  if (!last) return 0;

  return Number(last[key]) || 0;
}

function formatPercent(value: number): string {
  return `${value.toFixed(2)} %`;
}

/* =========================================================
   CPU + MEMORY CHARTS
========================================================= */

export function CpuMemoryCharts({ history }: Props) {
  const { t } = useTranslation(["programStart"]);

  const cpuData = createSeries(history, "cpuLoad");
  const memoryData = createSeries(history, "memoryLoad");

  const cpuValue = getLastValue(history, "cpuLoad");
  const memoryValue = getLastValue(history, "memoryLoad");

  return (
    <View style={styles.container}>
      <DashboardChart
        title={t("dataAnalyzing.charts.cpu.title")}
        value={formatPercent(cpuValue)}
        subtitle={t("dataAnalyzing.charts.cpu.subtitle")}
        data={cpuData}
      />

      <DashboardChart
        title={t("dataAnalyzing.charts.memory.title")}
        value={formatPercent(memoryValue)}
        subtitle={t("dataAnalyzing.charts.memory.subtitle")}
        data={memoryData}
      />
    </View>
  );
}

/* =========================================================
   THREAD CHART
========================================================= */

export function ThreadChart({ history }: Props) {
  const { t } = useTranslation(["programStart"]);

  const threadData = createSeries(history, "threads");
  const threadValue = getLastValue(history, "threads");

 return (
    <DashboardChart
      title={t("dataAnalyzing.charts.threads.title")}
      value={String(Math.round(threadValue))}
      subtitle={t("dataAnalyzing.charts.threads.subtitle")}
      data={threadData}
    />
  );
}

/* =========================================================
   REUSABLE CHART
========================================================= */

function DashboardChart({
  title,
  value,
  subtitle,
  data,
}: {
  title: string;
  value: string;
  subtitle: string;
  data: ChartPoint[];
}) {
  const { theme } = useUnistyles();

  const chartTheme = useMemo(
    () => createEnFlexChart(theme),
    [theme],
  );

  const [width, setWidth] = useState(0);

  return (
    <Card style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <View>
          <H4>{title}</H4>

          <ThemedText style={styles.subtitle}>
            {subtitle}
          </ThemedText>
        </View>

        <ThemedText style={styles.chartValue}>
          {value}
        </ThemedText>
      </View>

      <View
        style={styles.chartBox}
        onLayout={(event) =>
          setWidth(event.nativeEvent.layout.width)
        }
      >
        {width > 0 ? (
          <VictoryChart
            theme={chartTheme}
            width={width}
            height={280}
            padding={{
              top: 24,
              bottom: 36,
              left: 48,
              right: 24,
            }}
          >
            <VictoryArea
              data={data}
              x="x"
              y="y"
            />
          </VictoryChart>
        ) : null}
      </View>
    </Card>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create((theme) => ({
  container: {
    gap: 25,
  },

  chartCard: {
  height: 450,
  minHeight: 450,
  gap: 12,
 
  justifyContent: "space-between",
  },

  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },

  subtitle: {
    opacity: 0.65,
    fontSize: 12,
  },

  chartValue: {
    fontSize: 17,
    fontWeight: "700",
    color: theme.colors.primary,
  },

  chartBox: {
    width: "100%",
    height: 280,
    marginTop: 20,
  
  },
}));