import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";

type PropertyEntry = {
  key: string;
  value: string;
  valueType: "INTEGER" | "BOOLEAN" | "STRING" | "LONG" | "DOUBLE";
};

export type FactoryState =
  | "NotAvailableYet"
  | "Destroyed"
  | "CheckDBConnection"
  | "CheckDBConectionFailed"
  | "InitializationProcessStarted"
  | "InitializationProcessFailed"
  | "Created"
  | string;

export type DerbyNetworkServerSettings = {
  isStartDerbyNetworkServer: boolean;
  hostIp: string;
  port: number;
  userName: string;
  password: string;
};

type DbSettingsState = {
  dbSystems: string[];
  factories: string[];
  factoryStates: Record<string, FactoryState>;
  derbyNetworkServer: DerbyNetworkServerSettings;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
};

const initialState: DbSettingsState = {
  dbSystems: [],
  factories: [],
  factoryStates: {},
  derbyNetworkServer: {
    isStartDerbyNetworkServer: false,
    hostIp: "localhost",
    port: 1527,
    userName: "",
    password: "",
  },
  isLoading: false,
  isSaving: false,
  error: null,
};

function sortIndexedEntries(entries: PropertyEntry[]) {
  return [...entries].sort((a, b) => {
    const aIndex = Number(a.key.match(/\[(\d+)\]/)?.[1] ?? 0);
    const bIndex = Number(b.key.match(/\[(\d+)\]/)?.[1] ?? 0);
    return aIndex - bIndex;
  });
}

function mapDbSystems(entries: PropertyEntry[]) {
  return sortIndexedEntries(
    entries.filter((entry) => /^dbSystem\[\d+\]$/.test(entry.key)),
  ).map((entry) => entry.value);
}

function mapFactories(entries: PropertyEntry[]) {
  return sortIndexedEntries(
    entries.filter((entry) => /^factory\[\d+\]$/.test(entry.key)),
  ).map((entry) => entry.value);
}

function mapFactoryStates(entries: PropertyEntry[]): Record<string, FactoryState> {
  const result: Record<string, FactoryState> = {};

  const factories = sortIndexedEntries(
    entries.filter((entry) => /^factory\[\d+\]$/.test(entry.key)),
  );

  factories.forEach((factoryEntry) => {
    const index = factoryEntry.key.match(/\[(\d+)\]/)?.[1];
    if (!index) return;

    const stateEntry = entries.find(
      (entry) => entry.key === `factory[${index}].state`,
    );

    result[factoryEntry.value] = stateEntry?.value ?? "NotAvailableYet";
  });

  return result;
}

function mapDerby(entries: PropertyEntry[]): DerbyNetworkServerSettings {
  const find = (key: string) => entries.find((entry) => entry.key === key)?.value;

  return {
    isStartDerbyNetworkServer:
      String(find("isStartDerbyNetworkServer")).toLowerCase() === "true",
    hostIp: find("host-IP") ?? "localhost",
    port: Number(find("port") ?? 1527),
    userName: find("userName") ?? "",
    password: find("password") ?? "",
  };
}

export const fetchDbSettings = createAsyncThunk(
  "dbSettings/fetchDbSettings",
  async (_, thunkAPI) => {
    const state = thunkAPI.getState() as RootState;
    const api = state.api.awb_rest_api.infoApi;

    let dbEntries: PropertyEntry[] = [];
    let factoryEntries: PropertyEntry[] = [];
    let derbyEntries: PropertyEntry[] = [];

    try {
      const dbSystemsRes = await api.getAppSettings({
        headers: { "X-Performative": "DB.SYSTEMS" },
      });

      dbEntries = dbSystemsRes.data?.propertyEntries ?? [];
      console.log("DB.SYSTEMS RAW:", dbSystemsRes.data);
    } catch (error) {
      console.error("DB.SYSTEMS FAILED:", error);
    }

    try {
      const factoriesRes = await api.getAppSettings({
        headers: { "X-Performative": "DB.FACTORIES" },
      });

      factoryEntries = factoriesRes.data?.propertyEntries ?? [];
      console.log("DB.FACTORIES RAW:", factoriesRes.data);
    } catch (error) {
      console.error("DB.FACTORIES FAILED:", error);
    }

    try {
      const derbyRes = await api.getAppSettings({
        headers: { "X-Performative": "DB.DERBY.NETWORKSERVER" },
      });

      derbyEntries = derbyRes.data?.propertyEntries ?? [];
      console.log("DB.DERBY.NETWORKSERVER RAW:", derbyRes.data);
    } catch (error) {
      console.error("DB.DERBY.NETWORKSERVER FAILED:", error);
    }

    return {
      dbSystems: mapDbSystems(dbEntries),
      factories: mapFactories(factoryEntries),
      factoryStates: mapFactoryStates(factoryEntries),
      derbyNetworkServer: mapDerby(derbyEntries),
    };
  },
);

export const saveDerbyNetworkServerSettings = createAsyncThunk(
  "dbSettings/saveDerbyNetworkServerSettings",
  async (payload: DerbyNetworkServerSettings, thunkAPI) => {
    const state = thunkAPI.getState() as RootState;

    await state.api.awb_rest_api.infoApi.setAppSettings(
      {
        propertyEntries: [
          {
            key: "isStartDerbyNetworkServer",
            value: String(payload.isStartDerbyNetworkServer),
            valueType: "BOOLEAN",
          },
          {
            key: "host-IP",
            value: payload.hostIp,
            valueType: "STRING",
          },
          {
            key: "port",
            value: String(payload.port),
            valueType: "INTEGER",
          },
          {
            key: "userName",
            value: payload.userName,
            valueType: "STRING",
          },
          {
            key: "password",
            value: payload.password,
            valueType: "STRING",
          },
        ],
      } as any,
      {
        headers: {
          "X-Performative": "DB.DERBY.NETWORKSERVER",
        },
      },
    );

    return payload;
  },
);

const dbSettingsSlice = createSlice({
  name: "dbSettings",
  initialState,
  reducers: {
    setDerbyField: (
      state,
      action: PayloadAction<{
        key: keyof DerbyNetworkServerSettings;
        value: string | number | boolean;
      }>,
    ) => {
      const { key, value } = action.payload;
      (state.derbyNetworkServer[key] as string | number | boolean) = value;
    },
    clearDbSettingsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDbSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDbSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dbSystems = action.payload.dbSystems;
        state.factories = action.payload.factories;
        state.factoryStates = action.payload.factoryStates;
        state.derbyNetworkServer = action.payload.derbyNetworkServer;
      })
      .addCase(fetchDbSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          action.error.message ?? "DB-Settings konnten nicht geladen werden.";
      })
      .addCase(saveDerbyNetworkServerSettings.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(saveDerbyNetworkServerSettings.fulfilled, (state, action) => {
        state.isSaving = false;
        state.derbyNetworkServer = action.payload;
      })
      .addCase(saveDerbyNetworkServerSettings.rejected, (state, action) => {
        state.isSaving = false;
        state.error =
          action.error.message ?? "DB-Settings konnten nicht gespeichert werden.";
      });
  },
});

export const { setDerbyField, clearDbSettingsError } = dbSettingsSlice.actions;

export const selectDbSystems = (state: RootState) => state.dbSettings.dbSystems;
export const selectFactories = (state: RootState) => state.dbSettings.factories;
export const selectFactoryStates = (state: RootState) =>
  state.dbSettings.factoryStates;
export const selectDerbyNetworkServer = (state: RootState) =>
  state.dbSettings.derbyNetworkServer;
export const selectDbSettingsLoading = (state: RootState) =>
  state.dbSettings.isLoading;
export const selectDbSettingsSaving = (state: RootState) =>
  state.dbSettings.isSaving;
export const selectDbSettingsError = (state: RootState) =>
  state.dbSettings.error;

export default dbSettingsSlice.reducer;