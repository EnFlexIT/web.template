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
import { EnFlexChart } from "../../../styles/charttheme";

function RenderPie(content: SiteContentPieChart) {
  const data = content.dataSeries[0].entries;
  return <VictoryPie theme={EnFlexChart} data={data} x="category" y="value" />;
}

function RenderTime(content: SiteContentTimeSeriesChart) {
  const data = content.dataSeries[0].entries;

  return (
    <VictoryChart theme={EnFlexChart}>
      <VictoryArea data={data} y="value" x="isoDateTime" />
    </VictoryChart>
  );
}

function RenderBar(content: SiteContentBarChart) {
  const data = content.dataSeries[0].entries;

  return (
    <VictoryChart theme={EnFlexChart}>
      <VictoryBar data={data} y="value" x="category" />
    </VictoryChart>
  );
}

function RenderLine(content: SiteContentLineChart) {
  const data1 = content.dataSeries[0].entries;
  const data2 = content.dataSeries[1].entries;

  return (
    <VictoryChart theme={EnFlexChart}>
      <VictoryLine data={data1} y="value" x="xvalue" />
      <VictoryLine data={data2} y="value" x="xvalue" />
    </VictoryChart>
  );
}

export function RenderData(content: AbstractSiteContent) {
  if (isSiteContentPieChart(content)) {
    RenderPie(content);
  } else if (isSiteContentTimeSeriesChart(content)) {
    RenderTime(content);
  } else if (isSiteContentBarChart(content)) {
    RenderBar(content);
  } else if (isSiteContentLineChart(content)) {
    RenderLine(content);
  }
}
