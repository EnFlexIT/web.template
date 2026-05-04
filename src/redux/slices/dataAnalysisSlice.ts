import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { RootState } from "../store";

import {
  BGPLATFORM,
  DATA_ANALYZING_PERFORMATIVE,
  bgPlatformKey,
} from "../constants/dataAnalyzingConstants";

type PropertyEntry = {
  key: string;
  value: string;
  valueType: "INTEGER" | "BOOLEAN" | "STRING" | "LONG" | "DOUBLE";
};

type BackendResponse = {
  messageType?: string;
  message?: string;
  propertyEntries?: PropertyEntry[];
};

export type BackgroundPlatform = {
  contactAgent: string;
  platformName: string;
  server: boolean;

  ipAddress: string;
  url: string;
  jadePort: number;
  httpMtp: string;

  version: string;

  osName: string;
  osVersion: string;
  osArchitecture: string;

  cpuName: string;
  cpuLogical: number;
  cpuPhysical: number;
  cpuSpeedMhz: number;

  memoryMb: number;
  benchmarkValue: number;

  onlineSince: number;
  lastContact: number;

  localtimeOnlineSince: number;
  localtimeLastContact: number;

  currentlyAvailable: boolean;

  currentCpuLoad: number;
  currentMemoryLoad: number;
  currentMemoryLoadJvm: number;

  currentNumThreads: number;
  currentThresholdExceeded: boolean;
};

export type DataAnalysisHistoryEntry = {
  timestamp: number;
  platformName: string;
  cpuLoad: number;
  memoryLoad: number;
  memoryLoadJvm: number;
  threads: number;
};

export type DataAnalysisState = {
  platforms: BackgroundPlatform[];
  history: DataAnalysisHistoryEntry[];
  isMasterServer: boolean;
  isLoading: boolean;
  error: string | null;
};

const MAX_HISTORY_ENTRIES = 120;

const initialState: DataAnalysisState = {
  platforms: [],
  history: [],
  isMasterServer: false,
  isLoading: false,
  error: null,
};

function getApi(thunkAPI: { getState: () => unknown }) {
  const state = thunkAPI.getState() as RootState;
  return state.api.awb_rest_api.infoApi;
}

function getBackendErrorMessage(error: unknown, fallback: string) {
  const maybeAxiosError = error as any;

  return (
    maybeAxiosError?.response?.data?.message ||
    maybeAxiosError?.message ||
    fallback
  );
}

function ensureSuccessfulResponse(response: any): BackendResponse {
  const data: BackendResponse = response?.data ?? {};
  const messageType = String(data.messageType ?? "").toUpperCase();

  if (messageType === "ERROR") {
    throw new Error(data.message || "Backend returned an error.");
  }

  return data;
}

function findEntryValue(entries: PropertyEntry[], key: string) {
  return entries.find((entry) => entry.key === key)?.value;
}

function getBgValue(
  entries: PropertyEntry[],
  template: string,
  index: number,
): string | undefined {
  return findEntryValue(entries, bgPlatformKey(template, index));
}

function toNumber(value: string | undefined, fallback = 0) {
  if (value == null || value === "") return fallback;

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBoolean(value: string | undefined, fallback = false) {
  if (value == null || value === "") return fallback;

  return String(value).trim().toLowerCase() === "true";
}

function getPlatformDisplayName(
  platform: BackgroundPlatform,
  index: number,
): string {
  return (
    platform.platformName ||
    platform.ipAddress ||
    platform.contactAgent ||
    `Platform ${index + 1}`
  );
}

function createHistoryEntries(
  platforms: BackgroundPlatform[],
): DataAnalysisHistoryEntry[] {
  const timestamp = Date.now();

  return platforms.map((platform, index) => ({
    timestamp,
    platformName: getPlatformDisplayName(platform, index),
    cpuLoad: platform.currentCpuLoad,
    memoryLoad: platform.currentMemoryLoad,
    memoryLoadJvm: platform.currentMemoryLoadJvm,
    threads: platform.currentNumThreads,
  }));
}

function mapBackgroundPlatforms(
  entries: PropertyEntry[],
): BackgroundPlatform[] {
  const indexes = new Set<number>();

  entries.forEach((entry) => {
    const match = entry.key.match(/^bgplatform\[(\d+)\]\./);

    if (match) {
      indexes.add(Number(match[1]));
    }
  });

  return [...indexes]
    .sort((a, b) => a - b)
    .map((index): BackgroundPlatform => {
      const versionMajor =
        getBgValue(entries, BGPLATFORM.VERSION_MAJOR, index) ?? "0";

      const versionMinor =
        getBgValue(entries, BGPLATFORM.VERSION_MINOR, index) ?? "0";

      const versionMicro =
        getBgValue(entries, BGPLATFORM.VERSION_MICRO, index) ?? "0";

      const versionBuild =
        getBgValue(entries, BGPLATFORM.VERSION_BUILD, index) ?? "0";

      return {
        contactAgent:
          getBgValue(entries, BGPLATFORM.CONTACT_AGENT, index) ?? "",

        platformName:
          getBgValue(entries, BGPLATFORM.PLATFORM_NAME, index) ?? "",

        server: toBoolean(getBgValue(entries, BGPLATFORM.SERVER, index)),

        ipAddress:
          getBgValue(entries, BGPLATFORM.IP_ADDRESS, index) ?? "",

        url:
          getBgValue(entries, BGPLATFORM.URL, index) ?? "",

        jadePort: toNumber(
          getBgValue(entries, BGPLATFORM.JADE_PORT, index),
        ),

        httpMtp:
          getBgValue(entries, BGPLATFORM.HTTP_MTP, index) ?? "",

        version:
          `${versionMajor}.${versionMinor}.${versionMicro}.${versionBuild}`,

        osName:
          getBgValue(entries, BGPLATFORM.OS_NAME, index) ?? "",

        osVersion:
          getBgValue(entries, BGPLATFORM.OS_VERSION, index) ?? "",

        osArchitecture:
          getBgValue(entries, BGPLATFORM.OS_ARCHITECTURE, index) ?? "",

        cpuName:
          getBgValue(entries, BGPLATFORM.CPU_NAME, index) ?? "",

        cpuLogical: toNumber(
          getBgValue(entries, BGPLATFORM.CPU_NUM_LOGICAL, index),
        ),

        cpuPhysical: toNumber(
          getBgValue(entries, BGPLATFORM.CPU_NUM_PHYSICAL, index),
        ),

        cpuSpeedMhz: toNumber(
          getBgValue(entries, BGPLATFORM.CPU_SPEED_MHZ, index),
        ),

        memoryMb: toNumber(
          getBgValue(entries, BGPLATFORM.MEMORY_MB, index),
        ),

        benchmarkValue: toNumber(
          getBgValue(entries, BGPLATFORM.BENCHMARK_VALUE, index),
        ),

        onlineSince: toNumber(
          getBgValue(entries, BGPLATFORM.TIME_ONLINE_SINCE, index),
        ),

        lastContact: toNumber(
          getBgValue(entries, BGPLATFORM.TIME_LAST_CONTACT, index),
        ),

        localtimeOnlineSince: toNumber(
          getBgValue(entries, BGPLATFORM.LOCALTIME_ONLINE_SINCE, index),
        ),

        localtimeLastContact: toNumber(
          getBgValue(entries, BGPLATFORM.LOCALTIME_LAST_CONTACT, index),
        ),

        currentlyAvailable: toBoolean(
          getBgValue(entries, BGPLATFORM.CURRENTLY_AVAILABLE, index),
        ),

        currentCpuLoad: toNumber(
          getBgValue(entries, BGPLATFORM.CURRENT_CPU_LOAD, index),
        ),

        currentMemoryLoad: toNumber(
          getBgValue(entries, BGPLATFORM.CURRENT_MEMORY_LOAD, index),
        ),

        currentMemoryLoadJvm: toNumber(
          getBgValue(entries, BGPLATFORM.CURRENT_MEMORY_LOAD_JVM, index),
        ),

        currentNumThreads: toNumber(
          getBgValue(entries, BGPLATFORM.CURRENT_NUM_THREADS, index),
        ),

        currentThresholdExceeded: toBoolean(
          getBgValue(
            entries,
            BGPLATFORM.CURRENT_THRESHOLD_EXCEEDED,
            index,
          ),
        ),
      };
    });
}

export const fetchDataAnalysis = createAsyncThunk(
  "dataAnalysis/fetchDataAnalysis",
  async (_, thunkAPI) => {
    const api = getApi(thunkAPI);

    try {
      const response = await api.getAppSettings({
        headers: {
          "X-Performative": DATA_ANALYZING_PERFORMATIVE,
        },
      });

      const data = ensureSuccessfulResponse(response);

      const platforms = mapBackgroundPlatforms(
        data.propertyEntries ?? [],
      );

      return {
        platforms,
        isMasterServer: platforms.some((platform) => platform.server),
      };
    } catch (error) {
      throw new Error(
        getBackendErrorMessage(
          error,
          "Data Analysis Daten konnten nicht geladen werden.",
        ),
      );
    }
  },
);

const dataAnalysisSlice = createSlice({
  name: "dataAnalysis",

  initialState,

  reducers: {
    clearDataAnalysisError: (state) => {
      state.error = null;
    },

    clearDataAnalysisHistory: (state) => {
      state.history = [];
    },

    resetDataAnalysis: () => initialState,
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchDataAnalysis.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })

      .addCase(fetchDataAnalysis.fulfilled, (state, action) => {
        state.isLoading = false;

        state.platforms = action.payload.platforms;

        state.history = [
          ...state.history,
          ...createHistoryEntries(action.payload.platforms),
        ].slice(-MAX_HISTORY_ENTRIES);

        state.isMasterServer = action.payload.isMasterServer;
      })

      .addCase(fetchDataAnalysis.rejected, (state, action) => {
        state.isLoading = false;

        state.platforms = [];

        state.isMasterServer = false;

        state.error =
          action.error.message ??
          "Data Analysis Daten konnten nicht geladen werden.";
      });
  },
});

export const {
  clearDataAnalysisError,
  clearDataAnalysisHistory,
  resetDataAnalysis,
} = dataAnalysisSlice.actions;

export const selectDataAnalysisPlatforms = (
  state: RootState,
): BackgroundPlatform[] => state.dataAnalysis.platforms;

export const selectDataAnalysisHistory = (
  state: RootState,
): DataAnalysisHistoryEntry[] => state.dataAnalysis.history;

export const selectIsMasterServer = (
  state: RootState,
): boolean => state.dataAnalysis.isMasterServer;

export const selectDataAnalysisLoading = (
  state: RootState,
): boolean => state.dataAnalysis.isLoading;

export const selectDataAnalysisError = (
  state: RootState,
): string | null => state.dataAnalysis.error;

export default dataAnalysisSlice.reducer;