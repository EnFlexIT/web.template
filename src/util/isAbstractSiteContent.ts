import {
  AbstractSiteContent,
  SiteContentText,
  SiteContentImage,
  SiteContentProperties,
  SiteContentBarChart,
  SiteContentLineChart,
  SiteContentPieChart,
  SiteContentTimeSeriesChart,
} from "../api/implementation/Dynamic-Content-Api";

export function isSiteContentText(
  content: AbstractSiteContent
): content is SiteContentText {
  return (content as any).AbstractSiteContentType === "SiteContentText";
}

export function isSiteContentImage(
  content: AbstractSiteContent
): content is SiteContentImage {
  return (content as any).AbstractSiteContentType === "SiteContentImage";
}

export function isSiteContentProperties(
  content: AbstractSiteContent
): content is SiteContentProperties {
  return (content as any).AbstractSiteContentType === "SiteContentProperties";
}
export function isSiteContentPieChart(
  content: AbstractSiteContent
): content is SiteContentPieChart {
  return (content as any).AbstractSiteContentType === "SiteContentPieChart";
}

export function isSiteContentTimeSeriesChart(
  content: AbstractSiteContent
): content is SiteContentTimeSeriesChart {
  return (content as any).AbstractSiteContentType === "SiteContentPieChart";
}

export function isSiteContentBarChart(
  content: AbstractSiteContent
): content is SiteContentBarChart {
  return (content as any).AbstractSiteContentType === "SiteContentPieChart";
}

export function isSiteContentLineChart(
  content: AbstractSiteContent
): content is SiteContentLineChart {
  return (content as any).AbstractSiteContentType === "SiteContentPieChart";
}
