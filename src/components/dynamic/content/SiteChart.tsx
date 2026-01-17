import React, { useMemo, useState } from "react";
import { View } from "react-native";
import { useUnistyles } from "react-native-unistyles";

import {
  SiteContentBarChart,
  SiteContentLineChart,
  SiteContentPieChart,
  SiteContentTimeSeriesChart,
  AbstractSiteContent,
} from "../../../api/implementation/Dynamic-Content-Api";

import {
  VictoryArea,
  VictoryBar,
  VictoryChart,
  VictoryLine,
  VictoryPie,
} from "enflex.it-graph";

import {
  isSiteContentBarChart,
  isSiteContentLineChart,
  isSiteContentPieChart,
  isSiteContentTimeSeriesChart,
} from "../../../util/isAbstractSiteContent";

import { createEnFlexChart } from "../../../styles/charttheme";

/* -------------------------
   RENDER: PIE
--------------------------*/
function RenderPie({ content }: { content: SiteContentPieChart }) {
  const { theme } = useUnistyles();
  const chartTheme = useMemo(() => createEnFlexChart(theme), [theme]);

  const data = content.dataSeries?.[0]?.entries ?? [];

  return (
    <View style={{ width: "100%", height: 260 }}>
      <VictoryPie theme={chartTheme} data={data as any} x="category" y="value" />
    </View>
  );
}

/* -------------------------
   RENDER: TIME SERIES
--------------------------*/
function RenderTime({ content }: { content: SiteContentTimeSeriesChart }) {
  const { theme } = useUnistyles();
  const chartTheme = useMemo(() => createEnFlexChart(theme), [theme]);

  const data = content.dataSeries?.[0]?.entries ?? [];
  const [w, setW] = useState(0);

  return (
    <View
      style={{ width: "100%", height: 260 }}
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
    >
      {w > 0 ? (
        <VictoryChart theme={chartTheme} height={260} width={w}>
          <VictoryArea data={data as any} y="value" x="isoDateTime" />
        </VictoryChart>
      ) : null}
    </View>
  );
}

/* -------------------------
    RENDER: BAR (Variante B)
   - width dynamisch via onLayout
   - funktioniert sauber im Web + Mobile
--------------------------*/
function RenderBar({ content }: { content: SiteContentBarChart }) {
  const { theme } = useUnistyles();
  const chartTheme = useMemo(() => createEnFlexChart(theme), [theme]);

  const data = content.dataSeries?.[0]?.entries ?? [];
  const [w, setW] = useState(0);

  return (
    <View
      style={{ width: "100%", height: 260 }}
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
    >
      {w > 0 ? (
        <VictoryChart
          theme={chartTheme}
          height={260}
          width={w}
          domainPadding={{ x: 60 }}
        >
          <VictoryBar data={data as any} x="category" y="value" />
        </VictoryChart>
      ) : null}
    </View>
  );
}

/* -------------------------
   RENDER: LINE
--------------------------*/
function RenderLine({ content }: { content: SiteContentLineChart }) {
  const { theme } = useUnistyles();
  const chartTheme = useMemo(() => createEnFlexChart(theme), [theme]);

  const data1 = content.dataSeries?.[0]?.entries ?? [];
  const data2 = content.dataSeries?.[1]?.entries ?? [];
  const [w, setW] = useState(0);

  return (
    <View
      style={{ width: "100%", height: 260 }}
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
    >
      {w > 0 ? (
        <VictoryChart theme={chartTheme} height={260} width={w}>
          <VictoryLine data={data1 as any} y="value" x="xvalue" />
          {data2.length > 0 ? (
            <VictoryLine data={data2 as any} y="value" x="xvalue" />
          ) : null}
        </VictoryChart>
      ) : null}
    </View>
  );
}

/* -------------------------
    RENDER: MAIN
--------------------------*/
export function RenderData(content?: AbstractSiteContent | null) {
  if (!content) return null;

  if (isSiteContentPieChart(content)) return <RenderPie content={content} />;
  if (isSiteContentTimeSeriesChart(content)) return <RenderTime content={content} />;
  if (isSiteContentBarChart(content)) return <RenderBar content={content} />;
  if (isSiteContentLineChart(content)) return <RenderLine content={content} />;

  return null;
}
