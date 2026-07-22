import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";

import {
  SoftwareComponentType,
  ValueType,
  type InfoApi,
  type PropertyEntry,
  type Version as ApiVersion,
} from "../../../api/implementation/AWB-RestAPI/api";

type InstalledFrontendVersion = {
  id: string;
  name: string;
  currentVersion: string;
};

export type FrontendUpdateState = {
  /**
   * Bedeutet ausschließlich:
   * UPDATE.FRONTEND.CHECK ist noch nicht abgeschlossen.
   */
  isPending: boolean;
  isAvailable: boolean;
  lastCheck: string;
  version: string;
  newVersion: string;

  /**
   * Version der aktuell geladenen Browser-App.
   *
   * Sie wird innerhalb desselben Browser-Dokuments nicht durch
   * spätere UPDATE.FRONTEND.CHECK-Antworten überschrieben.
   */
  currentVersion: string;
};

export type BackendUpdateState = {
  /**
   * Bedeutet ausschließlich:
   * UPDATE.BACKEND.CHECK ist noch nicht abgeschlossen.
   */
  isPending: boolean;
  isAvailable: boolean;
  lastCheck: string;

  /**
   * Stammt ausschließlich aus UPDATE.BACKEND.EXECUTE.
   */
  status: string;
  progress: number;
};

export type UpdateState = {
  autoUpdate: boolean;
  loading: boolean;
  lastLoadedAt: number | null;
  frontend: FrontendUpdateState;
  backend: BackendUpdateState;
};

type LoadedUpdateSettings = {
  autoUpdate: boolean;
  frontend: FrontendUpdateState;
  backend: BackendUpdateState;
};

type LoadUpdateSettingsOptions = {
  force?: boolean;
  maxAgeMs?: number;
};

type UpdateThunkState = {
  api: {
    awb_rest_api: {
      infoApi: InfoApi;
    };
  };
  update: UpdateState;
};

const initialState: UpdateState = {
  autoUpdate: false,
  loading: false,
  lastLoadedAt: null,

  frontend: {
    isPending: false,
    isAvailable: false,
    lastCheck: "",
    version: "",
    newVersion: "",
    currentVersion: "",
  },

  backend: {
    isPending: false,
    isAvailable: false,
    lastCheck: "",
    status: "",
    progress: 0,
  },
};

/**
 * V2 verhindert, dass alte isPending-Werte aus dem bisherigen Cache
 * erneut in den korrigierten State geladen werden.
 */
const UPDATE_LAST_LOADED_KEY = "update:v2:lastLoadedAt";
const UPDATE_SETTINGS_CACHE_KEY = "update:v2:settingsCache";

const LEGACY_UPDATE_LAST_LOADED_KEY = "update:lastLoadedAt";
const LEGACY_UPDATE_SETTINGS_CACHE_KEY = "update:settingsCache";

export function clearUpdateSettingsCache(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(UPDATE_LAST_LOADED_KEY);
  localStorage.removeItem(UPDATE_SETTINGS_CACHE_KEY);
  localStorage.removeItem(LEGACY_UPDATE_LAST_LOADED_KEY);
  localStorage.removeItem(LEGACY_UPDATE_SETTINGS_CACHE_KEY);
}

function normalizeQualifier(value?: string | null): string {
  return String(value ?? "")
    .trim()
    .replace(/[^0-9A-Za-z]+/g, ".")
    .replace(/\.+/g, ".")
    .replace(/^\.|\.$/g, "");
}

function formatVersion(version?: ApiVersion | null): string {
  if (!version) {
    return "";
  }

  const major = Number(version.major ?? 0);
  const minor = Number(version.minor ?? 0);
  const micro = Number(version.micro ?? 0);
  const qualifier = normalizeQualifier(version.qualifier);
  const releaseVersion = `${major}.${minor}.${micro}`;

  return qualifier
    ? `${releaseVersion}.${qualifier}`
    : releaseVersion;
}

function findValue(
  entries: PropertyEntry[] | undefined,
  key: string,
): string | undefined {
  return entries?.find((entry) => entry.key === key)?.value;
}

function toBoolean(value: unknown): boolean {
  return String(value ?? "")
    .trim()
    .toLowerCase() === "true";
}

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sanitizeVersionValue(value: unknown): string {
  const normalized = String(value ?? "").trim();

  if (
    !normalized ||
    normalized === "-" ||
    normalized.toLowerCase() === "null" ||
    normalized.toLowerCase() === "undefined" ||
    normalized.toLowerCase() === "n/a"
  ) {
    return "";
  }

  return normalized;
}

function normalizeVersionForCompare(value: unknown): string {
  return sanitizeVersionValue(value)
    .toLowerCase()
    .replace(/[^0-9a-z]+/g, ".");
}

function versionsAreDifferent(
  currentVersion: string,
  newVersion: string,
): boolean {
  const current =
    normalizeVersionForCompare(currentVersion);

  const next =
    normalizeVersionForCompare(newVersion);

  return Boolean(
    current &&
      next &&
      current !== next,
  );
}

function getFrontendCheckValues(
  entries: PropertyEntry[] | undefined,
  fallback: FrontendUpdateState,
) {
  const pending =
    toBoolean(
      findValue(
        entries,
        "updatecheck.frontend.ispending",
      ),
    );

  const serverCurrentVersion =
    sanitizeVersionValue(
      findValue(
        entries,
        "updatecheck.frontend.currentversion",
      ),
    );

  const targetVersion =
    sanitizeVersionValue(
      findValue(
        entries,
        "updatecheck.frontend.newversion",
      ),
    ) ||
    sanitizeVersionValue(
      findValue(
        entries,
        "updatecheck.frontend.version",
      ),
    );

  /*
   * currentVersion beschreibt die Version der aktuell geladenen
   * Browser-App. Sobald sie in diesem Dokument gesetzt wurde,
   * wird sie durch spätere Server-Checks nicht überschrieben.
   */
  const currentVersion =
    sanitizeVersionValue(
      fallback.currentVersion,
    ) ||
    serverCurrentVersion;

  const serverSaysAvailable =
    toBoolean(
      findValue(
        entries,
        "updatecheck.frontend.isavailable",
      ),
    );

  /*
   * "-" ist ausdrücklich keine Version.
   *
   * Ein Update gilt nur dann als verfügbar, wenn:
   * - der Check abgeschlossen ist,
   * - eine echte Zielversion vorhanden ist,
   * - und der Server es meldet oder die Zielversion von der
   *   aktuell geladenen Redux-Version abweicht.
   */
  const isAvailable =
    !pending &&
    Boolean(targetVersion) &&
    (
      serverSaysAvailable ||
      versionsAreDifferent(
        currentVersion,
        targetVersion,
      )
    );

  return {
    pending,
    currentVersion,
    targetVersion,
    isAvailable,
  };
}

function wait(
  milliseconds: number,
): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

async function requestFrontendCheckUntilFinished(
  api: InfoApi,
): Promise<PropertyEntry[]> {
  const maxAttempts = 8;
  const delayMs = 500;

  let latestEntries: PropertyEntry[] = [];

  for (
    let attempt = 0;
    attempt < maxAttempts;
    attempt += 1
  ) {
    const response =
      await api.getAppSettings(
        "UPDATE.FRONTEND.CHECK",
      );

    latestEntries =
      response.data.propertyEntries ?? [];

    const isPending =
      toBoolean(
        findValue(
          latestEntries,
          "updatecheck.frontend.ispending",
        ),
      );

    if (!isPending) {
      return latestEntries;
    }

    if (attempt < maxAttempts - 1) {
      await wait(delayMs);
    }
  }

  return latestEntries;
}

function hasValidUpdatePayload(
  payload: LoadedUpdateSettings | null | undefined,
): payload is LoadedUpdateSettings {
  if (!payload) {
    return false;
  }

  return Boolean(
    payload.frontend.currentVersion ||
      payload.frontend.lastCheck ||
      payload.backend.lastCheck ||
      typeof payload.autoUpdate === "boolean",
  );
}

function applyUpdatePayload(
  state: UpdateState,
  payload: LoadedUpdateSettings,
): void {
  state.lastLoadedAt = Date.now();
  state.autoUpdate = payload.autoUpdate;

  state.frontend = {
    ...state.frontend,
    ...payload.frontend,
    currentVersion:
      payload.frontend.currentVersion ||
      state.frontend.currentVersion,
  };

  state.backend = {
    ...state.backend,
    ...payload.backend,
  };
}

function updateCachedFrontendVersion(
  currentVersion: string,
): void {
  if (
    typeof window === "undefined" ||
    !currentVersion
  ) {
    return;
  }

  try {
    const cached = localStorage.getItem(
      UPDATE_SETTINGS_CACHE_KEY,
    );

    if (!cached) {
      return;
    }

    const parsed =
      JSON.parse(cached) as Partial<LoadedUpdateSettings>;

    parsed.frontend = {
      ...(parsed.frontend ?? initialState.frontend),
      currentVersion,
    };

    localStorage.setItem(
      UPDATE_SETTINGS_CACHE_KEY,
      JSON.stringify(parsed),
    );
  } catch (error) {
    console.warn(
      "[UPDATE] Failed to update cached frontend version",
      error,
    );
  }
}

async function requestInstalledFrontendVersion(
  api: InfoApi,
): Promise<InstalledFrontendVersion> {
  const response = await api.versionGet(
    SoftwareComponentType.Webapp,
  );

  const components =
    response.data.SoftwareComponentList ?? [];

  const webApp = components.find(
    (component) =>
      component.componentType ===
      SoftwareComponentType.Webapp,
  );

  if (!webApp) {
    throw new Error(
      "Im Versions-Endpunkt wurde keine WEBAPP-Komponente gefunden.",
    );
  }

  const currentVersion = formatVersion(
    webApp.version,
  );

  if (!currentVersion) {
    throw new Error(
      "Die installierte WEBAPP-Version konnte nicht gelesen werden.",
    );
  }

  updateCachedFrontendVersion(
    currentVersion,
  );

  return {
    id: String(webApp.ID ?? ""),
    name: String(webApp.name ?? ""),
    currentVersion,
  };
}

export const loadInstalledFrontendVersion =
  createAsyncThunk<
    InstalledFrontendVersion,
    void,
    { state: UpdateThunkState }
  >(
    "update/loadInstalledFrontendVersion",
    async (_, thunkAPI) => {
      const api =
        thunkAPI.getState().api.awb_rest_api.infoApi;

      return requestInstalledFrontendVersion(api);
    },
  );

/**
 * Lädt nur die Update-Strategie.
 */
export const loadUpdateStrategy =
  createAsyncThunk<
    boolean,
    void,
    { state: UpdateThunkState }
  >(
    "update/loadUpdateStrategy",
    async (_, thunkAPI) => {
      const api =
        thunkAPI.getState().api.awb_rest_api.infoApi;

      const response =
        await api.getAppSettings(
          "UPDATE.STRATEGY",
        );

      return toBoolean(
        findValue(
          response.data.propertyEntries ?? [],
          "isautoupdate",
        ),
      );
    },
  );

/**
 * Bestehende Sammelfunktion für Stellen, die wirklich alle Bereiche
 * gleichzeitig benötigen. Die einzelnen Tabs und Watcher sollen
 * bevorzugt die gezielten Thunks verwenden.
 */
export const loadUpdateSettings =
  createAsyncThunk<
    LoadedUpdateSettings,
    void,
    { state: UpdateThunkState }
  >(
    "update/loadUpdateSettings",
    async (_, thunkAPI) => {
      const state = thunkAPI.getState();
      const api = state.api.awb_rest_api.infoApi;

      const [
        strategyResponse,
        frontendEntries,
        backendResponse,
      ] = await Promise.all([
        api.getAppSettings(
          "UPDATE.STRATEGY",
        ),

        requestFrontendCheckUntilFinished(
          api,
        ),

        api.getAppSettings(
          "UPDATE.BACKEND.CHECK",
        ),
      ]);

      const strategyEntries =
        strategyResponse.data.propertyEntries ?? [];

      const backendEntries =
        backendResponse.data.propertyEntries ?? [];

      const frontendCheck =
        getFrontendCheckValues(
          frontendEntries,
          state.update.frontend,
        );

      return {
        autoUpdate: toBoolean(
          findValue(
            strategyEntries,
            "isautoupdate",
          ),
        ),

        frontend: {
          isPending:
            frontendCheck.pending,

          isAvailable:
            frontendCheck.isAvailable,

          lastCheck:
            findValue(
              frontendEntries,
              "updatecheck.frontend.lastcheck",
            ) ?? "",

          version:
            frontendCheck.targetVersion,

          newVersion:
            frontendCheck.targetVersion,

          currentVersion:
            frontendCheck.currentVersion,
        },

        backend: {
          isPending: toBoolean(
            findValue(
              backendEntries,
              "updatecheck.backend.ispending",
            ),
          ),

          isAvailable: toBoolean(
            findValue(
              backendEntries,
              "updatecheck.backend.isavailable",
            ),
          ),

          lastCheck:
            findValue(
              backendEntries,
              "updatecheck.backend.lastcheck",
            ) ?? "",

          /*
           * CHECK liefert keinen Installationsstatus.
           */
          status: state.update.backend.status,
          progress: state.update.backend.progress,
        },
      };
    },
  );

export const loadUpdateSettingsIfNeeded =
  createAsyncThunk<
    LoadedUpdateSettings | null,
    LoadUpdateSettingsOptions | undefined,
    { state: UpdateThunkState }
  >(
    "update/loadUpdateSettingsIfNeeded",
    async (options, thunkAPI) => {
      const state = thunkAPI.getState();
      const updateState = state.update;

      const force =
        options?.force === true;

      const maxAgeMs =
        options?.maxAgeMs ??
        30 * 60 * 1000;

      const storedLastLoadedAt =
        typeof window !== "undefined"
          ? Number(
              localStorage.getItem(
                UPDATE_LAST_LOADED_KEY,
              ),
            )
          : updateState.lastLoadedAt;

      if (
        !force &&
        updateState.loading
      ) {
        return null;
      }

      const cacheIsCurrent =
        !force &&
        Boolean(storedLastLoadedAt) &&
        Date.now() -
          Number(storedLastLoadedAt) <
          maxAgeMs;

      if (cacheIsCurrent) {
        if (typeof window === "undefined") {
          return null;
        }

        const cached = localStorage.getItem(
          UPDATE_SETTINGS_CACHE_KEY,
        );

        if (!cached) {
          return null;
        }

        try {
          const parsed =
            JSON.parse(
              cached,
            ) as LoadedUpdateSettings;

          return parsed;
        } catch (error) {
          console.warn(
            "[UPDATE] Invalid settings cache",
            error,
          );

          clearUpdateSettingsCache();
          return null;
        }
      }

      const result =
        await thunkAPI.dispatch(
          loadUpdateSettings(),
        );

      if (
        !loadUpdateSettings.fulfilled.match(
          result,
        )
      ) {
        return null;
      }

      const payload = result.payload;

      if (!hasValidUpdatePayload(payload)) {
        return null;
      }

      if (typeof window !== "undefined") {
        localStorage.setItem(
          UPDATE_LAST_LOADED_KEY,
          String(Date.now()),
        );

        localStorage.setItem(
          UPDATE_SETTINGS_CACHE_KEY,
          JSON.stringify(payload),
        );
      }

      return payload;
    },
  );

export const checkFrontendUpdate =
  createAsyncThunk<
    PropertyEntry[],
    void,
    { state: UpdateThunkState }
  >(
    "update/checkFrontendUpdate",
    async (_, thunkAPI) => {
      const api =
        thunkAPI.getState().api.awb_rest_api.infoApi;

      /*
       * Der Server liefert zuerst häufig ispending=true.
       * Deshalb wird kurz und begrenzt weiter abgefragt,
       * bis das endgültige Ergebnis vorliegt.
       */
      return requestFrontendCheckUntilFinished(
        api,
      );
    },
  );

export const executeFrontendUpdate =
  createAsyncThunk<
    PropertyEntry[],
    void,
    { state: UpdateThunkState }
  >(
    "update/executeFrontendUpdate",
    async (_, thunkAPI) => {
      const api =
        thunkAPI.getState().api.awb_rest_api.infoApi;

      const response =
        await api.getAppSettings(
          "UPDATE.FRONTEND.EXECUTE",
        );

      clearUpdateSettingsCache();

      return (
        response.data.propertyEntries ?? []
      );
    },
  );

export const checkBackendUpdate =
  createAsyncThunk<
    PropertyEntry[],
    void,
    { state: UpdateThunkState }
  >(
    "update/checkBackendUpdate",
    async (_, thunkAPI) => {
      const api =
        thunkAPI.getState().api.awb_rest_api.infoApi;

      const response =
        await api.getAppSettings(
          "UPDATE.BACKEND.CHECK",
        );

      return (
        response.data.propertyEntries ?? []
      );
    },
  );

export const executeBackendUpdate =
  createAsyncThunk<
    PropertyEntry[],
    void,
    { state: UpdateThunkState }
  >(
    "update/executeBackendUpdate",
    async (_, thunkAPI) => {
      const api =
        thunkAPI.getState().api.awb_rest_api.infoApi;

      const response =
        await api.getAppSettings(
          "UPDATE.BACKEND.EXECUTE",
        );

      return (
        response.data.propertyEntries ?? []
      );
    },
  );

export const saveAutoUpdate =
  createAsyncThunk<
    boolean,
    boolean,
    { state: UpdateThunkState }
  >(
    "update/saveAutoUpdate",
    async (next, thunkAPI) => {
      const api =
        thunkAPI.getState().api.awb_rest_api.infoApi;

      await api.setAppSettings({
        performative:
          "UPDATE.STRATEGY",

        propertyEntries: [
          {
            key: "isautoupdate",
            value: String(next),
            valueType: ValueType.Boolean,
          },
        ],
      });

      if (typeof window !== "undefined") {
        try {
          const cached =
            localStorage.getItem(
              UPDATE_SETTINGS_CACHE_KEY,
            );

          if (cached) {
            const parsed =
              JSON.parse(
                cached,
              ) as LoadedUpdateSettings;

            parsed.autoUpdate = next;

            localStorage.setItem(
              UPDATE_SETTINGS_CACHE_KEY,
              JSON.stringify(parsed),
            );
          }
        } catch (error) {
          console.warn(
            "[UPDATE] Failed to update settings cache",
            error,
          );
        }
      }

      return next;
    },
  );

const updateSlice = createSlice({
  name: "update",
  initialState,

  reducers: {
    setAutoUpdate(
      state,
      action: PayloadAction<boolean>,
    ) {
      state.autoUpdate = action.payload;
    },

    setFrontendUpdateStatus(
      state,
      action: PayloadAction<FrontendUpdateState>,
    ) {
      state.frontend = action.payload;
    },

    setBackendUpdateStatus(
      state,
      action: PayloadAction<BackendUpdateState>,
    ) {
      state.backend = action.payload;
    },

    setInstalledFrontendVersion(
      state,
      action: PayloadAction<string>,
    ) {
      state.frontend.currentVersion =
        action.payload;
    },

    resetUpdateState() {
      return initialState;
    },
  },

  extraReducers: (builder) => {
    builder.addCase(
      loadInstalledFrontendVersion.fulfilled,
      (state, action) => {
        /*
         * Die lokal geladene Browser-Version wird pro Dokument
         * nur einmal gesetzt und danach nicht von Server-Checks
         * überschrieben.
         */
        if (!state.frontend.currentVersion) {
          state.frontend.currentVersion =
            action.payload.currentVersion;
        }
      },
    );

    builder.addCase(
      loadUpdateStrategy.fulfilled,
      (state, action) => {
        state.autoUpdate =
          action.payload;
      },
    );

    builder.addCase(
      loadUpdateSettings.pending,
      (state) => {
        state.loading = true;
      },
    );

    builder.addCase(
      loadUpdateSettings.fulfilled,
      (state, action) => {
        state.loading = false;
        applyUpdatePayload(
          state,
          action.payload,
        );
      },
    );

    builder.addCase(
      loadUpdateSettings.rejected,
      (state) => {
        state.loading = false;
      },
    );

    builder.addCase(
      loadUpdateSettingsIfNeeded.fulfilled,
      (state, action) => {
        if (action.payload) {
          applyUpdatePayload(
            state,
            action.payload,
          );
        }
      },
    );

    builder.addCase(
      saveAutoUpdate.fulfilled,
      (state, action) => {
        state.autoUpdate =
          action.payload;
      },
    );

    // ---------------------------------------------------------------------
    // FRONTEND CHECK
    // ---------------------------------------------------------------------

    builder.addCase(
      checkFrontendUpdate.pending,
      (state) => {
        state.frontend.isPending = true;

        /*
         * Alte Suchergebnisse während einer neuen Prüfung
         * nicht weiter als Update anzeigen.
         */
        state.frontend.isAvailable = false;
        state.frontend.version = "";
        state.frontend.newVersion = "";
      },
    );

    builder.addCase(
      checkFrontendUpdate.fulfilled,
      (state, action) => {
        const entries =
          action.payload;

        const frontendCheck =
          getFrontendCheckValues(
            entries,
            state.frontend,
          );

        state.frontend.isPending =
          frontendCheck.pending;

        state.frontend.isAvailable =
          frontendCheck.isAvailable;

        state.frontend.lastCheck =
          findValue(
            entries,
            "updatecheck.frontend.lastcheck",
          ) ??
          state.frontend.lastCheck;

        state.frontend.currentVersion =
          frontendCheck.currentVersion;

        state.frontend.version =
          frontendCheck.targetVersion;

        state.frontend.newVersion =
          frontendCheck.targetVersion;
      },
    );

    builder.addCase(
      checkFrontendUpdate.rejected,
      (state) => {
        state.frontend.isPending = false;
      },
    );

    // ---------------------------------------------------------------------
    // FRONTEND EXECUTE
    //
    // WICHTIG:
    // UPDATE.FRONTEND.EXECUTE liefert update.status/update.message.
    // Es darf niemals frontend.isPending auf true setzen.
    // ---------------------------------------------------------------------

    builder.addCase(
      executeFrontendUpdate.fulfilled,
      (state, action) => {
        const entries = action.payload;

        const status =
          String(
            findValue(
              entries,
              "update.status",
            ) ?? "",
          )
            .trim()
            .toLowerCase();

        const message =
          String(
            findValue(
              entries,
              "update.message",
            ) ?? "",
          )
            .trim()
            .toLowerCase();

        state.lastLoadedAt = null;
        state.frontend.isPending = false;

        if (
          status === "done" ||
          message === "update installed" ||
          message === "nothing to update"
        ) {
          state.frontend.isAvailable = false;
        }
      },
    );

    // ---------------------------------------------------------------------
    // BACKEND CHECK
    // ---------------------------------------------------------------------

    builder.addCase(
      checkBackendUpdate.pending,
      (state) => {
        state.backend.isPending = true;
      },
    );

    builder.addCase(
      checkBackendUpdate.fulfilled,
      (state, action) => {
        const entries = action.payload;

        state.backend.isPending =
          toBoolean(
            findValue(
              entries,
              "updatecheck.backend.ispending",
            ),
          );

        state.backend.isAvailable =
          toBoolean(
            findValue(
              entries,
              "updatecheck.backend.isavailable",
            ),
          );

        state.backend.lastCheck =
          findValue(
            entries,
            "updatecheck.backend.lastcheck",
          ) ??
          state.backend.lastCheck;
      },
    );

    builder.addCase(
      checkBackendUpdate.rejected,
      (state) => {
        state.backend.isPending = false;
      },
    );

    // ---------------------------------------------------------------------
    // BACKEND EXECUTE
    //
    // WICHTIG:
    // UPDATE.BACKEND.EXECUTE liefert update.status/update.progress.
    // backend.isPending gehört nur zum CHECK.
    // ---------------------------------------------------------------------

    builder.addCase(
      executeBackendUpdate.pending,
      (state) => {
        state.backend.status = "Pending";
        state.backend.progress = 0;
      },
    );

    builder.addCase(
      executeBackendUpdate.fulfilled,
      (state, action) => {
        const entries = action.payload;

        state.backend.isPending = false;

        state.backend.status =
          findValue(
            entries,
            "update.status",
          ) ??
          state.backend.status;

        state.backend.progress =
          toNumber(
            findValue(
              entries,
              "update.progress",
            ) ??
            state.backend.progress,
          );
      },
    );
  },
});

export const {
  setAutoUpdate,
  setFrontendUpdateStatus,
  setBackendUpdateStatus,
  setInstalledFrontendVersion,
  resetUpdateState,
} = updateSlice.actions;

export default updateSlice.reducer;