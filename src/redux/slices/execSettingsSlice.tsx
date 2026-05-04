import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";

const EXEC_MODE: string = "exec.mode";
const SERVER_MASTER_URL: string = "server.master.url";
const SERVER_MASTER_PORT: string = "server.master.port";
const SERVER_MASTER_PORT_MTP: string = "server.master.port.mtp";
const SERVER_MASTER_PROTOCOL: string = "server.master.protocol";
const LOCAL_MTP_CREATION: string = "local.mtp.creation";
const LOCAL_MTP_URL: string = "local.mtp.url";
const LOCAL_MTP_PORT: string = "local.mtp.port";
const LOCAL_MTP_PROTOCOL: string = "local.mtp.protocol";
const EMBEDDEDSYSTEM_PROJECT: string = "embeddedsystem.project";
const DEVICE_SYSTEM_EXEC_MODE: string = "device_system_exec_mode";
const EMBEDDEDSYSTEM_AGENT_CLASSNAME: string = "embeddedsystem.agent[X].classname";
const EMBEDDEDSYSTEM_AGENT_AGENTNAME: string = "embeddedsystem.agent[X].agentname";
const SERVICE_SERVICE_SETUP: string = "service.service_setup";
const LOCAL_IP_SELECTION: string = "local.ip.selection[X]";
const FACTORY_ID: string = "factory_id";

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
  | "SERVER"
  | "SERVICE_EMBEDDED_SYSTEM_AGENT"
  | string;

export type LocalMtpCreationMode =
  | "ConfiguredByJADE"
  | "ConfiguredByIPandPort"
  | string;

export type DeviceSystemExecMode = "SETUP" | "AGENT" | string;

export type EmbeddedSystemAgent = {
  agentName: string;
  className: string;
};

export type AvailableExecAgent = {
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
  availableAgents: AvailableExecAgent[];
  localIpSelections: string[];
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
  availableAgents: [],
  localIpSelections: [],
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
      return "SERVER";

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
    const match = entry.key.match(/^embeddedsystem\.agent\[(\d+)\]\./);
    if (match) {
      agentIndexes.add(Number(match[1]));
    }
  });

  return [...agentIndexes]
    .sort((a, b) => a - b)
    .map((index) => ({
      agentName:
        findEntryValue(entries, `embeddedsystem.agent[${index}].agentname`) ??
        "",
      className:
        findEntryValue(entries, `embeddedsystem.agent[${index}].classname`) ??
        "",
    }));
}

function mapAvailableExecAgents(entries: PropertyEntry[]): AvailableExecAgent[] {
  return sortIndexedEntries(
    entries.filter((entry) => {
      const key = entry.key.toLowerCase();

      return (
        /^agent\[\d+\]\.classname$/i.test(entry.key) ||
        /^agent\[\d+\]$/i.test(entry.key) ||
        /^awb\.agent\[\d+\]\.classname$/i.test(entry.key) ||
        key.endsWith(".classname")
      );
    }),
  )
    .map((entry) => ({
      className: entry.value,
    }))
    .filter((agent) => agent.className.trim().length > 0);
}
function mapProjects(entries: PropertyEntry[]) {
  return sortIndexedEntries(
    entries.filter((entry) => /^project\[\d+\]$/.test(entry.key)),
  ).map((entry) => entry.value);
}

function mapProjectSetups(entries: PropertyEntry[]) {
  return sortIndexedEntries(
    entries.filter(
      (entry) =>
        /^project\[\d+\]\.setup\[\d+\]$/.test(entry.key) ||
        /^setup\[\d+\]$/.test(entry.key),
    ),
  ).map((entry) => entry.value);
}

function mapExecSettings(entries: PropertyEntry[]): ExecSettings {
  return {
    startAs: normalizeStartAs(findEntryValue(entries, EXEC_MODE)),

    serverMasterUrl: findEntryValue(entries,SERVER_MASTER_URL) ?? "",
    serverMasterPort: toNumber(findEntryValue(entries, SERVER_MASTER_PORT), 1099,),
    serverMasterPortMtp: toNumber(findEntryValue(entries, SERVER_MASTER_PORT_MTP), 7778,),
    serverMasterProtocol: findEntryValue(entries, SERVER_MASTER_PROTOCOL) ?? "HTTP",
    //************************************ */
    localMtpCreation: findEntryValue(entries,LOCAL_MTP_CREATION) ?? "ConfiguredByJADE",
    localMtpUrl: findEntryValue(entries, LOCAL_MTP_URL) ?? "",
    localMtpPort: toNumber(findEntryValue(entries, LOCAL_MTP_PORT), 7778),
    localMtpProtocol: findEntryValue(entries, LOCAL_MTP_PROTOCOL) ?? "HTTP",
    embeddedSystemProject:findEntryValue(entries, EMBEDDEDSYSTEM_PROJECT) ?? "",
    deviceSystemExecMode: findEntryValue(entries, DEVICE_SYSTEM_EXEC_MODE) ?? "SETUP",
    serviceSetup: findEntryValue(entries, SERVICE_SERVICE_SETUP) ?? "",
    factoryId: findEntryValue(entries,FACTORY_ID) ?? "",
    bgSystemAutoInit: toBoolean(findEntryValue(entries, "bgsystem.auto_init"), false, ),
    embeddedSystemAgents: mapEmbeddedSystemAgents(entries),
  };
}

function buildExecSettingsEntries(payload: ExecSettings): PropertyEntry[] {
  const entries: PropertyEntry[] = [
    toPropertyEntry(EXEC_MODE, payload.startAs, "STRING"),

    toPropertyEntry(SERVER_MASTER_URL, payload.serverMasterUrl, "STRING"),
    toPropertyEntry(SERVER_MASTER_PORT, payload.serverMasterPort, "INTEGER"),
    toPropertyEntry(SERVER_MASTER_PORT_MTP, payload.serverMasterPortMtp, "INTEGER"),
    toPropertyEntry(
      SERVER_MASTER_PROTOCOL,
      payload.serverMasterProtocol,
      "STRING",
    ),

    toPropertyEntry(LOCAL_MTP_CREATION, payload.localMtpCreation, "STRING"),
    toPropertyEntry(LOCAL_MTP_URL, payload.localMtpUrl, "STRING"),
    toPropertyEntry(LOCAL_MTP_PORT, payload.localMtpPort, "INTEGER"),
    toPropertyEntry(LOCAL_MTP_PROTOCOL, payload.localMtpProtocol, "STRING"),

    toPropertyEntry(
      EMBEDDEDSYSTEM_PROJECT,
      payload.embeddedSystemProject,
      "STRING",
    ),
    toPropertyEntry(
      DEVICE_SYSTEM_EXEC_MODE,
      payload.deviceSystemExecMode,
      "STRING",
    ),
    toPropertyEntry(SERVICE_SERVICE_SETUP, payload.serviceSetup, "STRING"),
    toPropertyEntry(FACTORY_ID, payload.factoryId, "STRING"),
    toPropertyEntry("bgsystem.auto_init", payload.bgSystemAutoInit, "BOOLEAN"),
  ];

  payload.embeddedSystemAgents.forEach((agent, index) => {
    entries.push(
      toPropertyEntry(
        `embeddedsystem.agent[${index}].classname`,
        agent.className,
        "STRING",
      ),
    );

    entries.push(
      toPropertyEntry(
        `embeddedsystem.agent[${index}].agentname`,
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
      const entries = data.propertyEntries ?? [];

      return {
        settings: mapExecSettings(entries),
        localIpSelections: mapLocalIpSelections(entries),
      };
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
    const normalizedProjectName = String(projectName ?? "").trim();

    if (!normalizedProjectName) {
      return [];
    }

    try {
      const response = await api.getAppSettings({
        headers: {
          "X-Performative": `PROJECT.SETUPS[${normalizedProjectName}]`,
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
function mapLocalIpSelections(entries: PropertyEntry[]) {
  return sortIndexedEntries(
    entries.filter((entry) =>
      /^local\.ip\.selection\[\d+\]$/i.test(String(entry.key).trim()),
    ),
  )
    .map((entry) => String(entry.value ?? "").trim())
    .filter((value) => value.length > 0);
}

export const fetchAvailableExecAgents = createAsyncThunk(
  "execSettings/fetchAvailableExecAgents",
  async (_, thunkAPI) => {
    const api = getApi(thunkAPI);

    try {
      const response = await api.getAppSettings({
        headers: { "X-Performative": "awb.agents" },
      });

      const data = ensureSuccessfulResponse(response);
      return mapAvailableExecAgents(data.propertyEntries ?? []);
    } catch (error) {
      throw new Error(
        getBackendErrorMessage(
          error,
          "AWB Agents konnten nicht geladen werden.",
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
          performative: EXEC_MODE,
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

    addEmbeddedSystemAgent: (
      state,
      action: PayloadAction<EmbeddedSystemAgent | undefined>,
    ) => {
      state.settings.embeddedSystemAgents.push(
        action.payload ?? {
          agentName: "",
          className: "",
        },
      );
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
      state.availableAgents = [];
      state.localIpSelections = [];
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
            state.settings = action.payload.settings;
            state.localIpSelections = action.payload.localIpSelections;
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

      .addCase(fetchAvailableExecAgents.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAvailableExecAgents.fulfilled, (state, action) => {
        state.isLoading = false;
        state.availableAgents = action.payload;
      })
      .addCase(fetchAvailableExecAgents.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          action.error.message ?? "EXEC Agents konnten nicht geladen werden.";
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

export const selectAvailableExecAgents = (state: RootState) =>
  state.execSettings.availableAgents;

export const selectExecSettingsLoading = (state: RootState) =>
  state.execSettings.isLoading;

export const selectExecSettingsSaving = (state: RootState) =>
  state.execSettings.isSaving;

export const selectExecSettingsError = (state: RootState) =>
  state.execSettings.error;
export const selectLocalIpSelections = (state: RootState) =>
  state.execSettings.localIpSelections;

export default execSettingsSlice.reducer;