import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";

type PropertyEntry = {
  key: string;
  value: string;
  valueType: "INTEGER" | "BOOLEAN" | "STRING" | "LONG" | "DOUBLE";
};

type BackendResponse = {
  dateTime?: string;
  messageType?: string;
  message?: string;
  propertyEntries?: PropertyEntry[];
};

export type StartAsMode =
  | "APPLICATION"
  | "BACKGROUND_SYSTEM"
  | "SERVICE_EMBEDDED_SYSTEM_AGENT"
  | string;

export type LocalMtpCreationMode =
  | "ConfiguredByJADE"
  | "ConfiguredByIPAddress"
  | string;

export type DeviceSystemExecMode = "SETUP" | "AGENT" | string;

export type EmbeddedSystemAgent = {
  agentName: string;
  className: string;
};

export type ExecSettings = {
  startAs: StartAsMode;

  serverMasterUrl: string;
  serverMasterPort: number;
  serverMasterPortMtp: number;
  serverMasterProtocol: string;

  localMtpCreation: LocalMtpCreationMode;
  localMtpUrl: string;
  localMtpPort: number;
  localMtpProtocol: string;

  embeddedSystemProject: string;
  deviceSystemExecMode: DeviceSystemExecMode;
  serviceSetup: string;
  factoryId: string;
  bgSystemAutoInit: boolean;

  embeddedSystemAgents: EmbeddedSystemAgent[];
};

type ExecSettingsState = {
  settings: ExecSettings;
  projects: string[];
  projectSetups: string[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
};

const initialSettings: ExecSettings = {
  startAs: "APPLICATION",

  serverMasterUrl: "",
  serverMasterPort: 1099,
  serverMasterPortMtp: 7778,
  serverMasterProtocol: "HTTP",

  localMtpCreation: "ConfiguredByJADE",
  localMtpUrl: "",
  localMtpPort: 7778,
  localMtpProtocol: "HTTP",

  embeddedSystemProject: "",
  deviceSystemExecMode: "SETUP",
  serviceSetup: "",
  factoryId: "",
  bgSystemAutoInit: false,

  embeddedSystemAgents: [],
};

const initialState: ExecSettingsState = {
  settings: initialSettings,
  projects: [],
  projectSetups: [],
  isLoading: false,
  isSaving: false,
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

function isBackendFailureMessage(message?: string) {
  const normalized = String(message ?? "").trim().toLowerCase();
  return normalized.includes("failed") || normalized.includes("could not");
}

function ensureSuccessfulResponse(response: any): BackendResponse {
  const data: BackendResponse = response?.data ?? {};
  const messageType = String(data?.messageType ?? "").toUpperCase();
  const message = data?.message ?? "";

  if (messageType === "ERROR") {
    throw new Error(message || "Backend returned an error.");
  }

  if (isBackendFailureMessage(message)) {
    throw new Error(message);
  }

  return data;
}

function sortIndexedEntries(entries: PropertyEntry[]) {
  return [...entries].sort((a, b) => {
    const aIndex = Number(a.key.match(/\[(\d+)\]/)?.[1] ?? 0);
    const bIndex = Number(b.key.match(/\[(\d+)\]/)?.[1] ?? 0);
    return aIndex - bIndex;
  });
}

function findEntryValue(entries: PropertyEntry[], key: string) {
  return entries.find((entry) => entry.key === key)?.value;
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

function toPropertyEntry(
  key: string,
  value: string | number | boolean,
  valueType: PropertyEntry["valueType"],
): PropertyEntry {
  return {
    key,
    value: String(value),
    valueType,
  };
}

function normalizeStartAs(value: string | undefined): StartAsMode {
  const normalized = String(value ?? "").trim();

  switch (normalized) {
    case "Application":
    case "APPLICATION":
      return "APPLICATION";

    case "Background System":
    case "BACKGROUND_SYSTEM":
      return "BACKGROUND_SYSTEM";

    case "Service / Embedded System Agent":
    case "SERVICE_EMBEDDED_SYSTEM_AGENT":
      return "SERVICE_EMBEDDED_SYSTEM_AGENT";

    default:
      return normalized || "APPLICATION";
  }
}

function mapEmbeddedSystemAgents(entries: PropertyEntry[]): EmbeddedSystemAgent[] {
  const agentIndexes = new Set<number>();

  entries.forEach((entry) => {
    const match = entry.key.match(/^embeddedSystem\.agent\[(\d+)\]\./);
    if (match) {
      agentIndexes.add(Number(match[1]));
    }
  });

  return [...agentIndexes]
    .sort((a, b) => a - b)
    .map((index) => ({
      agentName:
        findEntryValue(entries, `embeddedSystem.agent[${index}].agentName`) ??
        "",
      className:
        findEntryValue(entries, `embeddedSystem.agent[${index}].className`) ??
        "",
    }));
}

function mapProjects(entries: PropertyEntry[]) {
  return sortIndexedEntries(
    entries.filter((entry) => /^project\[\d+\]$/.test(entry.key)),
  ).map((entry) => entry.value);
}

function mapProjectSetups(entries: PropertyEntry[]) {
  return sortIndexedEntries(
    entries.filter((entry) => /^project\[\d+\]\.setup\[\d+\]$/.test(entry.key)),
  ).map((entry) => entry.value);
}

function mapExecSettings(entries: PropertyEntry[]): ExecSettings {
  return {
    startAs: normalizeStartAs(findEntryValue(entries, "exec.mode")),

    serverMasterUrl: findEntryValue(entries, "server.master.url") ?? "",
    serverMasterPort: toNumber(
      findEntryValue(entries, "server.master.port"),
      1099,
    ),
    serverMasterPortMtp: toNumber(
      findEntryValue(entries, "server.master.port.mtp"),
      7778,
    ),
    serverMasterProtocol:
      findEntryValue(entries, "server.master.protocol") ?? "HTTP",

    localMtpCreation:
      findEntryValue(entries, "local.mtp.creation") ?? "ConfiguredByJADE",
    localMtpUrl: findEntryValue(entries, "local.mtp.url") ?? "",
    localMtpPort: toNumber(findEntryValue(entries, "local.mtp.port"), 7778),
    localMtpProtocol: findEntryValue(entries, "local.mtp.protocol") ?? "HTTP",

    embeddedSystemProject:
      findEntryValue(entries, "embeddedSystem.project") ?? "",
    deviceSystemExecMode:
      findEntryValue(entries, "device_system_exec_mode") ?? "SETUP",
    serviceSetup: findEntryValue(entries, "service.service_setup") ?? "",
    factoryId: findEntryValue(entries, "factory_id") ?? "",
    bgSystemAutoInit: toBoolean(
      findEntryValue(entries, "bgsystem.auto_init"),
      false,
    ),

    embeddedSystemAgents: mapEmbeddedSystemAgents(entries),
  };
}

function buildExecSettingsEntries(payload: ExecSettings): PropertyEntry[] {
  const entries: PropertyEntry[] = [
    toPropertyEntry("exec.mode", payload.startAs, "STRING"),

    toPropertyEntry("server.master.url", payload.serverMasterUrl, "STRING"),
    toPropertyEntry("server.master.port", payload.serverMasterPort, "INTEGER"),
    toPropertyEntry(
      "server.master.port.mtp",
      payload.serverMasterPortMtp,
      "INTEGER",
    ),
    toPropertyEntry(
      "server.master.protocol",
      payload.serverMasterProtocol,
      "STRING",
    ),

    toPropertyEntry("local.mtp.creation", payload.localMtpCreation, "STRING"),
    toPropertyEntry("local.mtp.url", payload.localMtpUrl, "STRING"),
    toPropertyEntry("local.mtp.port", payload.localMtpPort, "INTEGER"),
    toPropertyEntry("local.mtp.protocol", payload.localMtpProtocol, "STRING"),

    toPropertyEntry(
      "embeddedSystem.project",
      payload.embeddedSystemProject,
      "STRING",
    ),
    toPropertyEntry(
      "device_system_exec_mode",
      payload.deviceSystemExecMode,
      "STRING",
    ),
    toPropertyEntry("service.service_setup", payload.serviceSetup, "STRING"),
    toPropertyEntry("factory_id", payload.factoryId, "STRING"),
    toPropertyEntry("bgsystem.auto_init", payload.bgSystemAutoInit, "BOOLEAN"),
  ];

  payload.embeddedSystemAgents.forEach((agent, index) => {
    entries.push(
      toPropertyEntry(
        `embeddedSystem.agent[${index}].className`,
        agent.className,
        "STRING",
      ),
    );
    entries.push(
      toPropertyEntry(
        `embeddedSystem.agent[${index}].agentName`,
        agent.agentName,
        "STRING",
      ),
    );
  });

  return entries;
}

export const fetchExecSettings = createAsyncThunk(
  "execSettings/fetchExecSettings",
  async (_, thunkAPI) => {
    const api = getApi(thunkAPI);

    try {
      const response = await api.getAppSettings({
        headers: { "X-Performative": "EXEC.MODE" },
      });

      const data = ensureSuccessfulResponse(response);
      return mapExecSettings(data.propertyEntries ?? []);
    } catch (error) {
      throw new Error(
        getBackendErrorMessage(
          error,
          "EXEC settings konnten nicht geladen werden.",
        ),
      );
    }
  },
);

export const fetchProjects = createAsyncThunk(
  "execSettings/fetchProjects",
  async (_, thunkAPI) => {
    const api = getApi(thunkAPI);

    try {
      const response = await api.getAppSettings({
        headers: { "X-Performative": "PROJECTS" },
      });

      const data = ensureSuccessfulResponse(response);
      return mapProjects(data.propertyEntries ?? []);
    } catch (error) {
      throw new Error(
        getBackendErrorMessage(error, "Projects konnten nicht geladen werden."),
      );
    }
  },
);

export const fetchProjectSetups = createAsyncThunk(
  "execSettings/fetchProjectSetups",
  async (projectName: string, thunkAPI) => {
    const api = getApi(thunkAPI);

    if (!projectName) {
      return [];
    }

    try {
      const response = await api.getAppSettings({
        headers: {
          "X-Performative": "PROJECT.SETUPS",
          "X-Project": projectName,
          "X-Argument": projectName,
        },
      });

      const data = ensureSuccessfulResponse(response);
      return mapProjectSetups(data.propertyEntries ?? []);
    } catch (error) {
      throw new Error(
        getBackendErrorMessage(
          error,
          "Project setups konnten nicht geladen werden.",
        ),
      );
    }
  },
);

export const saveExecSettings = createAsyncThunk(
  "execSettings/saveExecSettings",
  async (payload: ExecSettings, thunkAPI) => {
    const api = getApi(thunkAPI);

    try {
      const propertyEntries = buildExecSettingsEntries(payload);

      const response = await api.setAppSettings(
        {
          performative: "exec.mode",
          propertyEntries,
        } as any,
      );

      ensureSuccessfulResponse(response);
      return payload;
    } catch (error) {
      throw new Error(
        getBackendErrorMessage(
          error,
          "EXEC settings konnten nicht gespeichert werden.",
        ),
      );
    }
  },
);

const execSettingsSlice = createSlice({
  name: "execSettings",
  initialState,
  reducers: {
    setExecSettingsField: (
      state,
      action: PayloadAction<{
        key: keyof ExecSettings;
        value: string | number | boolean | EmbeddedSystemAgent[];
      }>,
    ) => {
      const { key, value } = action.payload;
      (state.settings[key] as ExecSettings[keyof ExecSettings]) =
        value as never;
    },

    addEmbeddedSystemAgent: (state) => {
      state.settings.embeddedSystemAgents.push({
        agentName: "",
        className: "",
      });
    },

    removeEmbeddedSystemAgent: (state, action: PayloadAction<number>) => {
      state.settings.embeddedSystemAgents =
        state.settings.embeddedSystemAgents.filter(
          (_, index) => index !== action.payload,
        );
    },

    setEmbeddedSystemAgentField: (
      state,
      action: PayloadAction<{
        index: number;
        key: keyof EmbeddedSystemAgent;
        value: string;
      }>,
    ) => {
      const { index, key, value } = action.payload;
      if (!state.settings.embeddedSystemAgents[index]) return;
      state.settings.embeddedSystemAgents[index][key] = value;
    },

    clearExecSettingsError: (state) => {
      state.error = null;
    },

    resetExecSettings: (state) => {
      state.settings = initialSettings;
      state.projects = [];
      state.projectSetups = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExecSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchExecSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.settings = action.payload;
      })
      .addCase(fetchExecSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          action.error.message ?? "EXEC settings konnten nicht geladen werden.";
      })

      .addCase(fetchProjects.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.isLoading = false;
        state.projects = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          action.error.message ?? "Projects konnten nicht geladen werden.";
      })

      .addCase(fetchProjectSetups.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProjectSetups.fulfilled, (state, action) => {
        state.isLoading = false;
        state.projectSetups = action.payload;
      })
      .addCase(fetchProjectSetups.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          action.error.message ??
          "Project setups konnten nicht geladen werden.";
      })

      .addCase(saveExecSettings.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(saveExecSettings.fulfilled, (state, action) => {
        state.isSaving = false;
        state.settings = action.payload;
      })
      .addCase(saveExecSettings.rejected, (state, action) => {
        state.isSaving = false;
        state.error =
          action.error.message ??
          "EXEC settings konnten nicht gespeichert werden.";
      });
  },
});

export const {
  setExecSettingsField,
  addEmbeddedSystemAgent,
  removeEmbeddedSystemAgent,
  setEmbeddedSystemAgentField,
  clearExecSettingsError,
  resetExecSettings,
} = execSettingsSlice.actions;

export const selectExecSettings = (state: RootState) =>
  state.execSettings.settings;
export const selectExecSettingsProjects = (state: RootState) =>
  state.execSettings.projects;
export const selectExecSettingsProjectSetups = (state: RootState) =>
  state.execSettings.projectSetups;
export const selectExecSettingsLoading = (state: RootState) =>
  state.execSettings.isLoading;
export const selectExecSettingsSaving = (state: RootState) =>
  state.execSettings.isSaving;
export const selectExecSettingsError = (state: RootState) =>
  state.execSettings.error;

export default execSettingsSlice.reducer;