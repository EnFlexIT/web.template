import type {
  DataAnalysisHistoryEntry,
} from "../../../redux/slices/dataAnalysisSlice";

export function createCpuChartContent(
  history: DataAnalysisHistoryEntry[],
) {
  return {
    AbstractSiteContentType:
      "SiteContentTimeSeriesChart",

    uniqueContentID: 1001,

    editable: false,

    updatePeriodInSeconds: 5,

    title: "CPU Load",

    xAxisLabel: "Time",

    yAxisLabel: "CPU %",

    timeFormat: "HH:mm:ss",

    dataSeries: [
      {
        label: "CPU",

        entries: history.map((entry) => ({
          xvalue: entry.timestamp,
          value: entry.cpuLoad,
        })),
      },
    ],
  };
}

export function createMemoryChartContent(
  history: DataAnalysisHistoryEntry[],
) {
  return {
    AbstractSiteContentType:
      "SiteContentTimeSeriesChart",

    uniqueContentID: 1002,

    editable: false,

    updatePeriodInSeconds: 5,

    title: "Memory Load",

    xAxisLabel: "Time",

    yAxisLabel: "RAM %",

    timeFormat: "HH:mm:ss",

    dataSeries: [
      {
        label: "Memory",

        entries: history.map((entry) => ({
          xvalue: entry.timestamp,
          value: entry.memoryLoad,
        })),
      },
    ],
  };
}

export function createThreadChartContent(
  history: DataAnalysisHistoryEntry[],
) {
  return {
    AbstractSiteContentType:
      "SiteContentTimeSeriesChart",

    uniqueContentID: 1003,

    editable: false,

    updatePeriodInSeconds: 5,

    title: "Threads",

    xAxisLabel: "Time",

    yAxisLabel: "Threads",

    timeFormat: "HH:mm:ss",

    dataSeries: [
      {
        label: "Threads",

        entries: history.map((entry) => ({
          xvalue: entry.timestamp,
          value: entry.threads,
        })),
      },
    ],
  };
}