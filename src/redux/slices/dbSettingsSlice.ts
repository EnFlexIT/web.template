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

export type GeneralDbConnectionSettings = {
  useForEveryFactory: boolean;
  dbSystem: string;
  driverClass: string;
  url: string;
  defaultCatalog: string;
  userName: string;
  password: string;
};

export type FactoryDbConnectionSettings = {
  factoryId: string;
  dbSystem: string;
  driverClass: string;
  url: string;
  defaultCatalog: string;
  userName: string;
  password: string;
};

export type DbSystemParameterDefinition = {
  name: string;
  driverClass: string;
  url: string;
  urlMask: string;
  defaultCatalog: string;
  userName: string;
  password: string;
};

type DbSettingsState = {
  dbSystems: string[];
  dbSystemParameters: Record<string, DbSystemParameterDefinition>;
  factories: string[];
  factoryStates: Record<string, FactoryState>;
  derbyNetworkServer: DerbyNetworkServerSettings;
  generalConnection: GeneralDbConnectionSettings;
  selectedFactoryConnection: FactoryDbConnectionSettings;
  selectedFactoryId: string;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
};

const initialGeneralConnection: GeneralDbConnectionSettings = {
  useForEveryFactory: false,
  dbSystem: "",
  driverClass: "",
  url: "",
  defaultCatalog: "",
  userName: "",
  password: "",
};

const initialFactoryConnection: FactoryDbConnectionSettings = {
  factoryId: "",
  dbSystem: "",
  driverClass: "",
  url: "",
  defaultCatalog: "",
  userName: "",
  password: "",
};

const initialState: DbSettingsState = {
  dbSystems: [],
  dbSystemParameters: {},
  factories: [],
  factoryStates: {},
  derbyNetworkServer: {
    isStartDerbyNetworkServer: false,
    hostIp: "localhost",
    port: 1527,
    userName: "",
    password: "",
  },
  generalConnection: initialGeneralConnection,
  selectedFactoryConnection: initialFactoryConnection,
  selectedFactoryId: "",
  isLoading: false,
  isSaving: false,
  error: null,
};

function getApi(thunkAPI: { getState: () => unknown }) {
  const state = thunkAPI.getState() as RootState;
  return state.api.awb_rest_api.infoApi;
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

function toBoolean(value: string | undefined, fallback = false) {
  if (value == null) return fallback;
  return String(value).trim().toLowerCase() === "true";
}

function toNumber(value: string | undefined, fallback = 0) {
  if (value == null || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
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

function mapDbSystems(entries: PropertyEntry[]) {
  return sortIndexedEntries(
    entries.filter((entry) => /^dbSystem\[\d+\]$/.test(entry.key)),
  ).map((entry) => entry.value);
}

function mapDbSystemParameters(
  entries: PropertyEntry[],
): Record<string, DbSystemParameterDefinition> {
  const result: Record<string, DbSystemParameterDefinition> = {};

  const systemEntries = sortIndexedEntries(
    entries.filter((entry) => /^dbSystem\[\d+\]$/.test(entry.key)),
  );

  systemEntries.forEach((systemEntry) => {
    const index = systemEntry.key.match(/\[(\d+)\]/)?.[1];
    if (!index) return;

    const findIndexedValue = (suffix: string) =>
      entries.find((entry) => entry.key === `dbSystem[${index}].${suffix}`)?.value;

    const name = systemEntry.value;

    result[name] = {
      name,
      driverClass: findIndexedValue("hibernate.connection.driver_class") ?? "",
      url: findIndexedValue("hibernate.connection.url") ?? "",
      urlMask: findIndexedValue("hibernate.connection.url.mask") ?? "",
      defaultCatalog: findIndexedValue("hibernate.default_catalog") ?? "",
      userName: findIndexedValue("hibernate.connection.username") ?? "",
      password: findIndexedValue("hibernate.connection.password") ?? "",
    };
  });

  return result;
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
  return {
    isStartDerbyNetworkServer: toBoolean(
      findEntryValue(entries, "isStartDerbyNetworkServer"),
      false,
    ),
    hostIp: findEntryValue(entries, "host-IP") ?? "localhost",
    port: toNumber(findEntryValue(entries, "port"), 1527),
    userName: findEntryValue(entries, "userName") ?? "",
    password: findEntryValue(entries, "password") ?? "",
  };
}

function mapGeneralConnection(
  entries: PropertyEntry[],
): GeneralDbConnectionSettings {
  return {
    useForEveryFactory: toBoolean(
      findEntryValue(entries, "useForEveryFactory"),
      false,
    ),
    dbSystem: findEntryValue(entries, "dbSystem") ?? "",
    driverClass: findEntryValue(entries, "hibernate.connection.driver_class") ?? "",
    url: findEntryValue(entries, "hibernate.connection.url") ?? "",
    defaultCatalog: findEntryValue(entries, "hibernate.default_catalog") ?? "",
    userName: findEntryValue(entries, "hibernate.connection.username") ?? "",
    password: findEntryValue(entries, "hibernate.connection.password") ?? "",
  };
}

function mapFactoryConnection(
  entries: PropertyEntry[],
  requestedFactoryId: string,
): FactoryDbConnectionSettings {
  const find = (suffix: string) =>
    entries.find(
      (entry) =>
        entry.key === suffix ||
        entry.key.endsWith(`.${suffix}`),
    )?.value ?? "";

  return {
    factoryId: requestedFactoryId,
    dbSystem: find("dbSystem"),
    driverClass: find("hibernate.connection.driver_class"),
    url: find("hibernate.connection.url"),
    defaultCatalog: find("hibernate.default_catalog"),
    userName: find("hibernate.connection.username"),
    password: find("hibernate.connection.password"),
  };
}

function buildGeneralConnectionEntries(
  payload: GeneralDbConnectionSettings,
): PropertyEntry[] {
  return [
    toPropertyEntry("useForEveryFactory", payload.useForEveryFactory, "BOOLEAN"),
    toPropertyEntry("dbSystem", payload.dbSystem, "STRING"),
    toPropertyEntry(
      "hibernate.connection.driver_class",
      payload.driverClass,
      "STRING",
    ),
    toPropertyEntry("hibernate.connection.url", payload.url, "STRING"),
    toPropertyEntry("hibernate.default_catalog", payload.defaultCatalog, "STRING"),
    toPropertyEntry("hibernate.connection.username", payload.userName, "STRING"),
    toPropertyEntry("hibernate.connection.password", payload.password, "STRING"),
  ];
}

function buildTestConnectionEntries(
  payload: GeneralDbConnectionSettings | FactoryDbConnectionSettings,
): PropertyEntry[] {
  return [
    toPropertyEntry("dbSystem", payload.dbSystem, "STRING"),
    toPropertyEntry(
      "hibernate.connection.driver_class",
      payload.driverClass,
      "STRING",
    ),
    toPropertyEntry("hibernate.connection.url", payload.url, "STRING"),
    toPropertyEntry("hibernate.default_catalog", payload.defaultCatalog, "STRING"),
    toPropertyEntry("hibernate.connection.username", payload.userName, "STRING"),
    toPropertyEntry("hibernate.connection.password", payload.password, "STRING"),
  ];
}

function buildFactoryConnectionEntries(
  payload: FactoryDbConnectionSettings,
): PropertyEntry[] {
  return [
    toPropertyEntry("factoryID", payload.factoryId, "STRING"),
    toPropertyEntry("dbSystem", payload.dbSystem, "STRING"),
    toPropertyEntry(
      "hibernate.connection.driver_class",
      payload.driverClass,
      "STRING",
    ),
    toPropertyEntry("hibernate.connection.url", payload.url, "STRING"),
    toPropertyEntry("hibernate.default_catalog", payload.defaultCatalog, "STRING"),
    toPropertyEntry("hibernate.connection.username", payload.userName, "STRING"),
    toPropertyEntry("hibernate.connection.password", payload.password, "STRING"),
  ];
}

export const fetchDbSettings = createAsyncThunk(
  "dbSettings/fetchDbSettings",
  async (_, thunkAPI) => {
    const api = getApi(thunkAPI);

    let dbEntries: PropertyEntry[] = [];
    let dbSystemParameterEntries: PropertyEntry[] = [];
    let factoryEntries: PropertyEntry[] = [];
    let derbyEntries: PropertyEntry[] = [];
    let generalEntries: PropertyEntry[] = [];

    try {
      const dbSystemsRes = await api.getAppSettings({
        headers: { "X-Performative": "DB.SYSTEMS" },
      });
      dbEntries = dbSystemsRes.data?.propertyEntries ?? [];
    } catch (error) {
      console.error("DB.SYSTEMS FAILED:", error);
    }

    try {
      const dbSystemParametersRes = await api.getAppSettings({
        headers: { "X-Performative": "DB.SYSTEMS.PARAMETER" },
      });
      dbSystemParameterEntries = dbSystemParametersRes.data?.propertyEntries ?? [];
    } catch (error) {
      console.error("DB.SYSTEMS.PARAMETER FAILED:", error);
    }

    try {
      const factoriesRes = await api.getAppSettings({
        headers: { "X-Performative": "DB.FACTORIES" },
      });
      factoryEntries = factoriesRes.data?.propertyEntries ?? [];
    } catch (error) {
      console.error("DB.FACTORIES FAILED:", error);
    }

    try {
      const derbyRes = await api.getAppSettings({
        headers: { "X-Performative": "DB.DERBY.NETWORKSERVER" },
      });
      derbyEntries = derbyRes.data?.propertyEntries ?? [];
    } catch (error) {
      console.error("DB.DERBY.NETWORKSERVER FAILED:", error);
    }

    try {
      const generalRes = await api.getAppSettings({
        headers: { "X-Performative": "DB.CONN.GENERAL" },
      });
      generalEntries = generalRes.data?.propertyEntries ?? [];
    } catch (error) {
      console.error("DB.CONN.GENERAL FAILED:", error);
    }

    const factories = mapFactories(factoryEntries);

    return {
      dbSystems: mapDbSystems(dbEntries),
      dbSystemParameters: mapDbSystemParameters(dbSystemParameterEntries),
      factories,
      factoryStates: mapFactoryStates(factoryEntries),
      derbyNetworkServer: mapDerby(derbyEntries),
      generalConnection: mapGeneralConnection(generalEntries),
      selectedFactoryId: factories[0] ?? "",
    };
  },
);

export const fetchDbSystemParameters = createAsyncThunk(
  "dbSettings/fetchDbSystemParameters",
  async (_, thunkAPI) => {
    const api = getApi(thunkAPI);

    const response = await api.getAppSettings({
      headers: { "X-Performative": "DB.SYSTEMS.PARAMETER" },
    });

    const entries = response.data?.propertyEntries ?? [];
    return mapDbSystemParameters(entries);
  },
);

export const fetchGeneralDbConnectionSettings = createAsyncThunk(
  "dbSettings/fetchGeneralDbConnectionSettings",
  async (_, thunkAPI) => {
    const api = getApi(thunkAPI);

    const response = await api.getAppSettings({
      headers: { "X-Performative": "DB.CONN.GENERAL" },
    });

    const entries = response.data?.propertyEntries ?? [];
    return mapGeneralConnection(entries);
  },
);

export const saveGeneralDbConnectionSettings = createAsyncThunk(
  "dbSettings/saveGeneralDbConnectionSettings",
  async (payload: GeneralDbConnectionSettings, thunkAPI) => {
    const api = getApi(thunkAPI);

    await api.setAppSettings(
      {
        propertyEntries: buildGeneralConnectionEntries(payload),
      } as any,
      {
        headers: {
          "X-Performative": "DB.CONN.GENERAL",
        },
      },
    );

    return payload;
  },
);

export const testGeneralDbConnection = createAsyncThunk(
  "dbSettings/testGeneralDbConnection",
  async (payload: GeneralDbConnectionSettings, thunkAPI) => {
    const api = getApi(thunkAPI);

    await api.setAppSettings(
      {
        propertyEntries: buildTestConnectionEntries(payload),
      } as any,
      {
        headers: {
          "X-Performative": "DB.CONN.TEST",
        },
      },
    );

    return true;
  },
);

export const fetchFactoryDbConnectionSettings = createAsyncThunk(
  "dbSettings/fetchFactoryDbConnectionSettings",
  async (factoryId: string, thunkAPI) => {
    const api = getApi(thunkAPI);

    const response = await api.getAppSettings({
      headers: {
        "X-Performative": "DB.CONN.FACTORY.GET",
        "X-Factory-ID": factoryId,
      },
    });

    const entries = response.data?.propertyEntries ?? [];
    return mapFactoryConnection(entries, factoryId);
  },
);

export const saveFactoryDbConnectionSettings = createAsyncThunk(
  "dbSettings/saveFactoryDbConnectionSettings",
  async (payload: FactoryDbConnectionSettings, thunkAPI) => {
    const api = getApi(thunkAPI);

    await api.setAppSettings(
      {
        propertyEntries: buildFactoryConnectionEntries(payload),
      } as any,
      {
        headers: {
          "X-Performative": "DB.CONN.FACTORY.SET",
        },
      },
    );

    return payload;
  },
);

export const testFactoryDbConnection = createAsyncThunk(
  "dbSettings/testFactoryDbConnection",
  async (payload: FactoryDbConnectionSettings, thunkAPI) => {
    const api = getApi(thunkAPI);

    await api.setAppSettings(
      {
        propertyEntries: buildTestConnectionEntries(payload),
      } as any,
      {
        headers: {
          "X-Performative": "DB.CONN.TEST",
        },
      },
    );

    return true;
  },
);

export const saveDerbyNetworkServerSettings = createAsyncThunk(
  "dbSettings/saveDerbyNetworkServerSettings",
  async (payload: DerbyNetworkServerSettings, thunkAPI) => {
    const api = getApi(thunkAPI);

    await api.setAppSettings(
      {
        propertyEntries: [
          toPropertyEntry(
            "isStartDerbyNetworkServer",
            payload.isStartDerbyNetworkServer,
            "BOOLEAN",
          ),
          toPropertyEntry("host-IP", payload.hostIp, "STRING"),
          toPropertyEntry("port", payload.port, "INTEGER"),
          toPropertyEntry("userName", payload.userName, "STRING"),
          toPropertyEntry("password", payload.password, "STRING"),
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
      (
        state.derbyNetworkServer[
          key
        ] as DerbyNetworkServerSettings[keyof DerbyNetworkServerSettings]
      ) = value as never;
    },

    setGeneralConnectionField: (
      state,
      action: PayloadAction<{
        key: keyof GeneralDbConnectionSettings;
        value: string | number | boolean;
      }>,
    ) => {
      const { key, value } = action.payload;
      (
        state.generalConnection[
          key
        ] as GeneralDbConnectionSettings[keyof GeneralDbConnectionSettings]
      ) = value as never;
    },

    setSelectedFactoryConnectionField: (
      state,
      action: PayloadAction<{
        key: keyof FactoryDbConnectionSettings;
        value: string | number | boolean;
      }>,
    ) => {
      const { key, value } = action.payload;
      (
        state.selectedFactoryConnection[
          key
        ] as FactoryDbConnectionSettings[keyof FactoryDbConnectionSettings]
      ) = value as never;
    },

    setSelectedFactoryId: (state, action: PayloadAction<string>) => {
      state.selectedFactoryId = action.payload;
      state.selectedFactoryConnection = {
        ...initialFactoryConnection,
        factoryId: action.payload,
      };
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
        state.dbSystemParameters = action.payload.dbSystemParameters;
        state.factories = action.payload.factories;
        state.factoryStates = action.payload.factoryStates;
        state.derbyNetworkServer = action.payload.derbyNetworkServer;
        state.generalConnection = action.payload.generalConnection;

        if (!state.selectedFactoryId && action.payload.selectedFactoryId) {
          state.selectedFactoryId = action.payload.selectedFactoryId;
          state.selectedFactoryConnection = {
            ...state.selectedFactoryConnection,
            factoryId: action.payload.selectedFactoryId,
          };
        }
      })
      .addCase(fetchDbSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          action.error.message ?? "DB-Settings konnten nicht geladen werden.";
      })

      .addCase(fetchDbSystemParameters.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDbSystemParameters.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dbSystemParameters = action.payload;
      })
      .addCase(fetchDbSystemParameters.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          action.error.message ??
          "DB-System-Parameter konnten nicht geladen werden.";
      })

      .addCase(fetchGeneralDbConnectionSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchGeneralDbConnectionSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.generalConnection = action.payload;
      })
      .addCase(fetchGeneralDbConnectionSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          action.error.message ??
          "General DB-Settings konnten nicht geladen werden.";
      })

      .addCase(fetchFactoryDbConnectionSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFactoryDbConnectionSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedFactoryConnection = {
          factoryId: action.payload.factoryId || state.selectedFactoryId,
          dbSystem: action.payload.dbSystem,
          driverClass: action.payload.driverClass,
          url: action.payload.url,
          defaultCatalog: action.payload.defaultCatalog,
          userName: action.payload.userName,
          password: action.payload.password,
        };
        state.selectedFactoryId =
          action.payload.factoryId || state.selectedFactoryId;
      })
      .addCase(fetchFactoryDbConnectionSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          action.error.message ??
          "Factory-DB-Settings konnten nicht geladen werden.";
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
          action.error.message ??
          "Derby-Network-Server-Settings konnten nicht gespeichert werden.";
      })

      .addCase(saveGeneralDbConnectionSettings.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(saveGeneralDbConnectionSettings.fulfilled, (state, action) => {
        state.isSaving = false;
        state.generalConnection = action.payload;
      })
      .addCase(saveGeneralDbConnectionSettings.rejected, (state, action) => {
        state.isSaving = false;
        state.error =
          action.error.message ??
          "General DB-Settings konnten nicht gespeichert werden.";
      })

      .addCase(testGeneralDbConnection.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(testGeneralDbConnection.fulfilled, (state) => {
        state.isSaving = false;
      })
      .addCase(testGeneralDbConnection.rejected, (state, action) => {
        state.isSaving = false;
        state.error =
          action.error.message ?? "DB Connection Test fehlgeschlagen.";
      })

      .addCase(saveFactoryDbConnectionSettings.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(saveFactoryDbConnectionSettings.fulfilled, (state, action) => {
        state.isSaving = false;
        state.selectedFactoryConnection = action.payload;
        state.selectedFactoryId = action.payload.factoryId;
      })
      .addCase(saveFactoryDbConnectionSettings.rejected, (state, action) => {
        state.isSaving = false;
        state.error =
          action.error.message ??
          "Factory-DB-Settings konnten nicht gespeichert werden.";
      })

      .addCase(testFactoryDbConnection.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(testFactoryDbConnection.fulfilled, (state) => {
        state.isSaving = false;
      })
      .addCase(testFactoryDbConnection.rejected, (state, action) => {
        state.isSaving = false;
        state.error =
          action.error.message ?? "Factory DB Connection Test fehlgeschlagen.";
      });
  },
});

export const {
  setDerbyField,
  setGeneralConnectionField,
  setSelectedFactoryConnectionField,
  setSelectedFactoryId,
  clearDbSettingsError,
} = dbSettingsSlice.actions;

export const selectDbSystems = (state: RootState) => state.dbSettings.dbSystems;
export const selectDbSystemParameters = (state: RootState) =>
  state.dbSettings.dbSystemParameters;
export const selectFactories = (state: RootState) => state.dbSettings.factories;
export const selectFactoryStates = (state: RootState) =>
  state.dbSettings.factoryStates;
export const selectDerbyNetworkServer = (state: RootState) =>
  state.dbSettings.derbyNetworkServer;
export const selectGeneralConnection = (state: RootState) =>
  state.dbSettings.generalConnection;
export const selectSelectedFactoryConnection = (state: RootState) =>
  state.dbSettings.selectedFactoryConnection;
export const selectSelectedFactoryId = (state: RootState) =>
  state.dbSettings.selectedFactoryId;
export const selectDbSettingsLoading = (state: RootState) =>
  state.dbSettings.isLoading;
export const selectDbSettingsSaving = (state: RootState) =>
  state.dbSettings.isSaving;
export const selectDbSettingsError = (state: RootState) =>
  state.dbSettings.error;

export default dbSettingsSlice.reducer;