import React, { useMemo, useState } from "react";
import { View } from "react-native";
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
  key: "cpuLoad" | "memoryLoad",
): ChartPoint[] {
  return history.map((entry, index) => ({
    x: index + 1,
    y: Number(entry[key]) || 0,
  }));
}

function getLastValue(
  history: DataAnalysisHistoryEntry[],
  key: "cpuLoad" | "memoryLoad",
): number {
  const last = history[history.length - 1];
  if (!last) return 0;

  return Number(last[key]) || 0;
}

function formatPercent(value: number): string {
  return `${value.toFixed(2)} %`;
}

export function DataAnalysisCharts({ history }: Props) {
  const cpuData = createSeries(history, "cpuLoad");
  const memoryData = createSeries(history, "memoryLoad");

  const cpuValue = getLastValue(history, "cpuLoad");
  const memoryValue = getLastValue(history, "memoryLoad");

  return (
    <View style={styles.container}>
      <DashboardChart
        title="CPU Load"
        value={formatPercent(cpuValue)}
        subtitle="Live CPU Auslastung"
        data={cpuData}
      />

      <DashboardChart
        title="Memory Load"
        value={formatPercent(memoryValue)}
        subtitle="Live RAM Auslastung"
        data={memoryData}
      />
    </View>
  );
}

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
  const chartTheme = useMemo(() => createEnFlexChart(theme), [theme]);
  const [width, setWidth] = useState(0);

  return (
    <Card style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <View>
          <H4>{title}</H4>
          <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>
        </View>

        <ThemedText style={styles.chartValue}>{value}</ThemedText>
      </View>

      <View
        style={styles.chartBox}
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
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
            <VictoryArea data={data} x="x" y="y" />
          </VictoryChart>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    gap: 20,
  },

  chartCard: {
    gap: 12,
    padding: 16,
  },

  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
  },

  subtitle: {
    opacity: 0.65,
    fontSize: 12,
  },

  chartValue: {
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.primary,
  },

  chartBox: {
    width: "100%",
    height: 280,
  },
}));