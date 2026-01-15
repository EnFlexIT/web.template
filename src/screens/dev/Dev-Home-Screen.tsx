// src/screens/dev/DevHomeScreen.tsx
import React, { useMemo, useEffect } from "react";
import {
  Text,
  View,
  ScrollView,
  Image,
  Platform,
  useWindowDimensions,
} from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { SiteContentTimeSeriesChart } from "../../api/implementation/Dynamic-Content-Api";

import { Card } from "../../components/ui-elements/Card";
import { MetricCard } from "../../components/ui-elements/MetricCard";
import { SmallStat } from "../../components/ui-elements/SmallStat";
import { HeroCard } from "../../components/ui-elements/HeroCard";
import { ChartCard, BarChartWidget } from "../../components/ui-elements/charts";

import { RenderData } from "../../components/dynamic/content/SiteChart";

// Typ
import type { SiteContentBarChart } from "../../api/implementation/Dynamic-Content-Api";

// OPTIONAL: wenn du isSiteContentBarChart debuggen willst (nur wenn existiert)


export function DevHomeScreen() {
  const { width } = useWindowDimensions();

  const SOLAR_PANEL_IMG = require("../../../assets/solar.png");
  const SMART_HOME_IMG = require("../../../assets/Smarthome.png");

  const headerImageSource = useMemo(
    () => (SOLAR_PANEL_IMG ? SOLAR_PANEL_IMG : undefined),
    [SOLAR_PANEL_IMG]
  );

  const smartHomeImageSource = useMemo(
    () => (SMART_HOME_IMG ? SMART_HOME_IMG : undefined),
    [SMART_HOME_IMG]
  );

  const dummyData = [
    { label: "Mon", value: 30 },
    { label: "Tue", value: 50 },
    { label: "Wed", value: 20 },
    { label: "Thu", value: 65 },
    { label: "Fri", value: 40 },
  ];
const fakeTimeSeriesContent: SiteContentTimeSeriesChart = {
  AbstractSiteContentType: "SiteContentTimeSeriesChart",
  uniqueContentID: 1003, // ✅ number
  editable: false,
  updatePeriodInSeconds: 0,

  xAxisLabel: "Time",
  yAxisLabel: "kW",

  // ✅ new property (laut Schema)
  timeFormat: "HH:mm",

  dataSeries: [
    {
      name: "Production",
      entries: [
        // ✅ LineChart-Style: xvalue + value
        { xvalue: Date.parse("2026-01-01T08:00:00Z"), value: 12 },
        { xvalue: Date.parse("2026-01-01T09:00:00Z"), value: 18 },
        { xvalue: Date.parse("2026-01-01T10:00:00Z"), value: 25 },
        { xvalue: Date.parse("2026-01-01T11:00:00Z"), value: 32 },
        { xvalue: Date.parse("2026-01-01T12:00:00Z"), value: 28 },
      ],
    },
  ],
} as any;
  //  Fake Dynamic Content (API-like)
  const fakeBarChartContent: SiteContentBarChart = useMemo(
    () =>
      ({
        AbstractSiteContentType: "SiteContentBarChart",
        uniqueContentID: "dev_barchart_001",
        editable: false,
        updatePeriodInSeconds: 0,

        xAxisLabel: "Day",
        yAxisLabel: "kW",

        dataSeries: [
          {
            name: "Forecast",
            entries: [
              { category: "Mon", value: 30 },
              { category: "Tue", value: 50 },
              { category: "Wed", value: 20 },
              { category: "Thu", value: 65 },
              { category: "Fri", value: 40 },
            ],
          },
        ],
      } as any),
    []
  );

  useEffect(() => {
    console.log("DevHome width:", width);
    console.log("TYPE:", (fakeBarChartContent as any)?.AbstractSiteContentType);
    console.log(
      "entries:",
      (fakeBarChartContent as any)?.dataSeries?.[0]?.entries
    );

   
  }, [width, fakeBarChartContent]);

const entries = fakeBarChartContent.dataSeries?.[0]?.entries ?? [];


  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <HeroCard
        title="Solar Panel"
        subtitle="High energy generating"
        badgeIcon="🔋"
        badgeText="67% Battery"
        imageSource={headerImageSource}
        imageFallbackIcon="☀️"
        imageFallbackText="Solar Visual"
      />

      <View style={styles.row2}>
        <MetricCard
          title="Current Power"
          subtitle="Generation"
          value="152.84 kW"
          icon="⚡"
        />
        <MetricCard
          title="Current Grid"
          subtitle="Power supply"
          value="32.84 kW"
          icon="🏗️"
        />
      </View>

      <View style={styles.smartHomeWrapper}>
        <View style={styles.flowLineLeft} />
        <View style={styles.flowLineRight} />

        <Card
          style={styles.smartHomeCard}
          padding="none"
          contentStyle={styles.smartHomeContent}
        >
          {smartHomeImageSource ? (
            <Image
              source={smartHomeImageSource}
              resizeMode="contain"
              style={styles.smartHomeImg}
            />
          ) : (
            <View style={styles.smartHomePlaceholder}>
              <Text style={styles.placeholderEmoji}>🏠</Text>
              <Text style={styles.placeholderText}>Smart Home Visual</Text>
              <Text style={styles.placeholderHint}>
                (setze SMART_HOME_IMG als Asset)
              </Text>
            </View>
          )}
        </Card>
      </View>

      <View style={styles.row3}>
        <SmallStat label="Load" value="30.59 kW" icon="🔌" />
        <SmallStat label="EVSE" value="26.71 kW" icon="🚗" />
        <SmallStat label="Battery" value="11.6 kW" icon="🟨" />
      </View>

      {/* Dynamic Content Chart Test */}
      <Card padding="sm" style={styles.chartCard}>
        <Text style={styles.chartTitle}>Dynamic Content – BarChart Test</Text>
        <Text style={styles.chartHint}>
          Hier wird ein SiteContentBarChart (dataSeries[0].entries) über RenderData gerendert.
          (Web-Fix: feste Chart-Breite)
        </Text>
            <View style={{ marginTop: 10 }}>
              {RenderData(fakeBarChartContent as any)}
            </View>

      </Card>

      <ChartCard title="BarChartWidget📊" subtitle="Dummy data (Dev)">
        <BarChartWidget data={dummyData} />
      </ChartCard>
      

   <Card padding="sm" style={styles.chartCard}>
  <Text style={styles.chartTitle}>Dynamic Content – TimeSeries Test</Text>
  <Text style={styles.chartHint}>
    TimeSeriesChart (erbt von LineChart) mit xvalue/value + timeFormat.
  </Text>

  <View style={{ marginTop: 10 }}>
    <View style={{ marginTop: 10 }}>
  {RenderData(fakeTimeSeriesContent as any)}
</View>

  </View>
</Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    padding: 16,
    gap: 12,
    backgroundColor: theme.colors.background,
  },

  row2: { flexDirection: "row", gap: 12 },

  smartHomeWrapper: {
    position: "relative",
    minHeight: 240,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 4,
  },

  smartHomeCard: {
    borderRadius: 22,
    overflow: "hidden",
    width: "100%",
  },

  smartHomeContent: {
    height: 300,
    padding: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.card,
  },

  smartHomeImg: {
    width: "100%",
    height: "100%",
  },

  smartHomePlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  flowLineLeft: {
    position: "absolute",
    top: 10,
    left: 28,
    width: 2,
    height: 80,
    backgroundColor: theme.colors.border,
    opacity: 0.6,
    borderRadius: 2,
  },

  flowLineRight: {
    position: "absolute",
    top: 10,
    right: 28,
    width: 2,
    height: 80,
    backgroundColor: theme.colors.border,
    opacity: 0.6,
    borderRadius: 2,
  },

  row3: { flexDirection: "row", gap: 12 },

  placeholderEmoji: { fontSize: 22 },
  placeholderText: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: "700",
    opacity: 0.9,
  },
  placeholderHint: {
    color: theme.colors.text,
    fontSize: 12,
    opacity: 0.65,
    textAlign: "center",
  },

  chartCard: {
    marginTop: 6,
  },
  chartTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  chartHint: {
    color: theme.colors.text,
    opacity: 0.7,
    fontSize: 12,
    marginTop: 2,
  },

  devNoteTitle: { color: theme.colors.text, fontSize: 16, fontWeight: "800" },
  devNoteText: {
    color: theme.colors.text,
    opacity: 0.75,
    fontSize: 13,
    lineHeight: Platform.select({ web: 18, default: 18 }),
  },
}));
