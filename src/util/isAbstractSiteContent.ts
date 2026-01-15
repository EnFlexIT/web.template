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

function hasType(content: AbstractSiteContent | null | undefined): content is AbstractSiteContent {
  return !!content && typeof (content as any).AbstractSiteContentType === "string";
}

export function isSiteContentText(
  content: AbstractSiteContent | null | undefined
): content is SiteContentText {
  return hasType(content) && (content as any).AbstractSiteContentType === "SiteContentText";
}

export function isSiteContentImage(
  content: AbstractSiteContent | null | undefined
): content is SiteContentImage {
  return hasType(content) && (content as any).AbstractSiteContentType === "SiteContentImage";
}

export function isSiteContentProperties(
  content: AbstractSiteContent | null | undefined
): content is SiteContentProperties {
  return hasType(content) && (content as any).AbstractSiteContentType === "SiteContentProperties";
}

export function isSiteContentPieChart(
  content: AbstractSiteContent | null | undefined
): content is SiteContentPieChart {
  return hasType(content) && (content as any).AbstractSiteContentType === "SiteContentPieChart";
}

export function isSiteContentTimeSeriesChart(
  content: AbstractSiteContent | null | undefined
): content is SiteContentTimeSeriesChart {
  return hasType(content) && (content as any).AbstractSiteContentType === "SiteContentTimeSeriesChart";
}

export function isSiteContentBarChart(
  content: AbstractSiteContent | null | undefined
): content is SiteContentBarChart {
  return hasType(content) && (content as any).AbstractSiteContentType === "SiteContentBarChart";
}

export function isSiteContentLineChart(
  content: AbstractSiteContent | null | undefined
): content is SiteContentLineChart {
  return hasType(content) && (content as any).AbstractSiteContentType === "SiteContentLineChart";
}
