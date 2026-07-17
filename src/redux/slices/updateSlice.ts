import {
  createAsyncThunk,
  createSlice,
  PayloadAction,
} from "@reduxjs/toolkit";

import { RootState } from "../store";

type ApiVersion = {
  major?: number;
  minor?: number;
  micro?: number;
  qualifier?: string;
};

type SoftwareComponent = {
  ID?: string;
  id?: string;
  Id?: string;
  name?: string;
  Name?: string;
  componentType?: string;
  ComponentType?: string;
  type?: string;
  version?: ApiVersion;
  Version?: ApiVersion;
};

type InstalledFrontendVersion = {
  id: string;
  name: string;
  currentVersion: string;
};

interface UpdateState {
  autoUpdate: boolean;
  loading: boolean;
  lastLoadedAt: number | null;

  frontend: {
    isPending: boolean;
    isAvailable: boolean;
    lastCheck: string;
    version: string;
    newVersion: string;

    /**
     * Stammt ausschließlich aus:
     * GET /api/version?type=WEBAPP
     */
    currentVersion: string;
  };

  backend: {
    isPending: boolean;
    isAvailable: boolean;
    lastCheck: string;
    status: string;
    progress: number;
  };
}

const initialState: UpdateState = {
  loading: false,
  lastLoadedAt: null,
  autoUpdate: false,

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

const UPDATE_LAST_LOADED_KEY =
  "update:lastLoadedAt";

const UPDATE_SETTINGS_CACHE_KEY =
  "update:settingsCache";

/**
 * Entfernt alte Update-Daten aus dem Browser-Cache.
 *
 * Wird insbesondere vor beziehungsweise nach einem
 * Frontend-Update benötigt.
 */
export function clearUpdateSettingsCache() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(
    UPDATE_LAST_LOADED_KEY,
  );

  localStorage.removeItem(
    UPDATE_SETTINGS_CACHE_KEY,
  );
}

function normalizeBaseUrl(value: string): string {
  return String(value ?? "")
    .trim()
    .replace(/\/+$/, "");
}

function normalizeQualifier(
  value?: string | null,
): string {
  return String(value ?? "")
    .trim()
    .replace(/[^0-9A-Za-z]+/g, ".")
    .replace(/\.+/g, ".")
    .replace(/^\.|\.$/g, "");
}

function formatVersion(
  version?: ApiVersion | null,
): string {
  if (!version) {
    return "";
  }

  const major = Number(version.major ?? 0);
  const minor = Number(version.minor ?? 0);
  const micro = Number(version.micro ?? 0);

  const qualifier = normalizeQualifier(
    version.qualifier,
  );

  const releaseVersion =
    `${major}.${minor}.${micro}`;

  return qualifier
    ? `${releaseVersion}.${qualifier}`
    : releaseVersion;
}

function findValue(
  entries: any[],
  key: string,
): unknown {
  return entries.find(
    (entry) => entry?.key === key,
  )?.value;
}

function toBoolean(value: unknown): boolean {
  return (
    String(value ?? "")
      .trim()
      .toLowerCase() === "true"
  );
}

function toNumber(value: unknown): number {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function getApiBaseUrl(
  state: RootState,
): string {
  const apiState = state.api as any;

  return normalizeBaseUrl(
    apiState?.ip ??
      apiState?.awb_rest_api?.ip ??
      "",
  );
}

function getJwt(
  state: RootState,
): string | null {
  const apiState = state.api as any;

  const jwt =
    apiState?.jwt ??
    apiState?.awb_rest_api?.jwt ??
    null;

  return typeof jwt === "string" && jwt.trim()
    ? jwt.trim()
    : null;
}

function getSoftwareComponents(
  payload: any,
): SoftwareComponent[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (
    Array.isArray(
      payload?.SoftwareComponentList,
    )
  ) {
    return payload.SoftwareComponentList;
  }

  if (
    Array.isArray(
      payload?.softwareComponentList,
    )
  ) {
    return payload.softwareComponentList;
  }

  return [];
}

function getComponentType(
  component: SoftwareComponent,
): string {
  return String(
    component.componentType ??
      component.ComponentType ??
      component.type ??
      "",
  )
    .trim()
    .toUpperCase();
}

function updateCachedFrontendVersion(
  currentVersion: string,
) {
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

    const parsed = JSON.parse(cached);

    parsed.frontend = {
      ...(parsed.frontend ?? {}),
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

function hasValidUpdatePayload(
  payload: any,
): boolean {
  return Boolean(
    payload?.frontend?.currentVersion ||
      payload?.frontend?.lastCheck ||
      payload?.backend?.lastCheck ||
      typeof payload?.autoUpdate === "boolean",
  );
}

function applyUpdatePayload(
  state: UpdateState,
  payload: any,
) {
  if (!payload) {
    return;
  }

  state.lastLoadedAt = Date.now();

  if (
    typeof payload.autoUpdate === "boolean"
  ) {
    state.autoUpdate = payload.autoUpdate;
  }

  if (payload.frontend) {
    state.frontend = {
      ...state.frontend,
      ...payload.frontend,

      /*
       * Eine leere Version darf die bereits vom
       * /version-Endpunkt geladene Version nicht löschen.
       */
      currentVersion:
        payload.frontend.currentVersion ||
        state.frontend.currentVersion,
    };
  }

  if (payload.backend) {
    state.backend = {
      ...state.backend,
      ...payload.backend,
    };
  }
}

/**
 * Lädt die tatsächlich installierte Web-App-Version.
 *
 * Verbindliche Quelle:
 * GET /api/version?type=WEBAPP
 */
export const loadInstalledFrontendVersion =
  createAsyncThunk<
    InstalledFrontendVersion,
    void,
    {
      state: RootState;
    }
  >(
    "update/loadInstalledFrontendVersion",
    async (_, thunkAPI) => {
      const state = thunkAPI.getState();

      const baseUrl =
        getApiBaseUrl(state);

      const jwt = getJwt(state);

      if (!baseUrl) {
        throw new Error(
          "Keine Server-Adresse vorhanden.",
        );
      }

      const requestUrl =
        `${baseUrl}/api/version?type=WEBAPP`;

      const response = await fetch(
        requestUrl,
        {
          method: "GET",
          cache: "no-store",
          credentials: "include",
          signal: thunkAPI.signal,
          headers: {
            Accept: "application/json",

            ...(jwt
              ? {
                  Authorization:
                    `Bearer ${jwt}`,
                }
              : {}),
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          `Web-App-Version konnte nicht geladen werden: HTTP ${response.status}`,
        );
      }

      let payload: any;

      try {
        payload = await response.json();
      } catch {
        throw new Error(
          "Der Versions-Endpunkt hat kein gültiges JSON zurückgegeben.",
        );
      }

      const components =
        getSoftwareComponents(payload);

      const webApp =
        components.find(
          (component) =>
            getComponentType(component) ===
            "WEBAPP",
        );

      if (!webApp) {
        throw new Error(
          "Im Versions-Endpunkt wurde keine WEBAPP-Komponente gefunden.",
        );
      }

      const versionObject =
        webApp.version ??
        webApp.Version;

      const currentVersion =
        formatVersion(versionObject);

      if (!currentVersion) {
        throw new Error(
          "Die WEBAPP-Version konnte nicht gelesen werden.",
        );
      }

      updateCachedFrontendVersion(
        currentVersion,
      );

      return {
        id: String(
          webApp.ID ??
            webApp.id ??
            webApp.Id ??
            "",
        ),

        name: String(
          webApp.name ??
            webApp.Name ??
            "",
        ),

        currentVersion,
      };
    },
  );

/**
 * Lädt alle Update-Einstellungen.
 *
 * Die drei Einstellungsanfragen und die Versionsanfrage
 * werden parallel ausgeführt. Es gibt keine künstliche
 * Verzögerung.
 */
export const loadUpdateSettings =
  createAsyncThunk<
    {
      autoUpdate: boolean;

      frontend: {
        isPending: boolean;
        isAvailable: boolean;
        lastCheck: string;
        version: string;
        newVersion: string;
        currentVersion: string;
      };

      backend: {
        isPending: boolean;
        isAvailable: boolean;
        lastCheck: string;
        status: string;
        progress: number;
      };
    },
    void,
    {
      state: RootState;
    }
  >(
    "update/loadUpdateSettings",
    async (_, thunkAPI) => {
      const state = thunkAPI.getState();

      const api =
        state.api.awb_rest_api.infoApi;

      const [
        strategyRes,
        frontendRes,
        backendRes,
        installedVersionAction,
      ] = await Promise.all([
        api.getAppSettings({
          headers: {
            "X-Performative":
              "UPDATE.STRATEGY",
          },
        }),

        api.getAppSettings({
          headers: {
            "X-Performative":
              "UPDATE.FRONTEND.CHECK",
          },
        }),

        api.getAppSettings({
          headers: {
            "X-Performative":
              "UPDATE.BACKEND.CHECK",
          },
        }),

        thunkAPI.dispatch(
          loadInstalledFrontendVersion(),
        ),
      ]);

      const strategyEntries =
        strategyRes.data?.propertyEntries ??
        [];

      const frontendEntries =
        frontendRes.data?.propertyEntries ??
        [];

      const backendEntries =
        backendRes.data?.propertyEntries ??
        [];

      const currentVersion =
        loadInstalledFrontendVersion.fulfilled.match(
          installedVersionAction,
        )
          ? installedVersionAction.payload
              .currentVersion
          : state.update.frontend
              .currentVersion;

      return {
        autoUpdate: toBoolean(
          findValue(
            strategyEntries,
            "isautoupdate",
          ),
        ),

        frontend: {
          isPending: toBoolean(
            findValue(
              frontendEntries,
              "updatecheck.frontend.ispending",
            ),
          ),

          isAvailable: toBoolean(
            findValue(
              frontendEntries,
              "updatecheck.frontend.isavailable",
            ),
          ),

          lastCheck: String(
            findValue(
              frontendEntries,
              "updatecheck.frontend.lastcheck",
            ) ?? "",
          ),

          /*
           * version und newVersion stammen weiterhin
           * aus dem Update-System.
           */
          version: String(
            findValue(
              frontendEntries,
              "updatecheck.frontend.version",
            ) ?? "",
          ),

          newVersion: String(
            findValue(
              frontendEntries,
              "updatecheck.frontend.newversion",
            ) ?? "",
          ),

          /*
           * currentVersion stammt ausschließlich aus:
           * GET /api/version?type=WEBAPP
           */
          currentVersion,
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

          lastCheck: String(
            findValue(
              backendEntries,
              "updatecheck.backend.lastcheck",
            ) ?? "",
          ),

          status: String(
            findValue(
              backendEntries,
              "update.status",
            ) ?? "",
          ),

          progress: toNumber(
            findValue(
              backendEntries,
              "update.progress",
            ),
          ),
        },
      };
    },
  );

export const loadUpdateSettingsIfNeeded =
  createAsyncThunk<
    any,
    | {
        force?: boolean;
        maxAgeMs?: number;
      }
    | undefined,
    {
      state: RootState;
    }
  >(
    "update/loadUpdateSettingsIfNeeded",
    async (options, thunkAPI) => {
      const state = thunkAPI.getState();

      const updateState =
        state.update;

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

      if (
        !force &&
        storedLastLoadedAt &&
        Date.now() -
          storedLastLoadedAt <
          maxAgeMs
      ) {
        /*
         * Auch bei gültigem Cache wird die installierte
         * Web-App-Version erneut direkt vom Versions-Endpunkt
         * abgefragt.
         *
         * Der übrige Update-Status darf aus dem Cache kommen.
         */
        void thunkAPI.dispatch(
          loadInstalledFrontendVersion(),
        );

        if (
          typeof window !== "undefined"
        ) {
          const cached =
            localStorage.getItem(
              UPDATE_SETTINGS_CACHE_KEY,
            );

          if (cached) {
            try {
              const parsed =
                JSON.parse(cached);

              /*
               * Eine zwischengespeicherte Version darf
               * niemals die aktuelle Antwort des
               * /version-Endpunkts überschreiben.
               */
              if (parsed.frontend) {
                delete parsed.frontend
                  .currentVersion;
              }

              return parsed;
            } catch (error) {
              localStorage.removeItem(
                UPDATE_SETTINGS_CACHE_KEY,
              );

              localStorage.removeItem(
                UPDATE_LAST_LOADED_KEY,
              );
            }
          }
        }

        return null;
      }

      const result =
        await thunkAPI.dispatch(
          loadUpdateSettings(),
        );

      if (
        loadUpdateSettings.fulfilled.match(
          result,
        )
      ) {
        const payload =
          result.payload;

        if (
          hasValidUpdatePayload(payload)
        ) {
          if (
            typeof window !== "undefined"
          ) {
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
        }
      }

      return null;
    },
  );

/**
 * Prüft, ob ein Web-App-Update vorhanden ist.
 *
 * Parallel dazu wird die installierte Version über
 * GET /api/version?type=WEBAPP geladen.
 */
export const checkFrontendUpdate =
  createAsyncThunk<
    any[],
    void,
    {
      state: RootState;
    }
  >(
    "update/checkFrontendUpdate",
    async (_, thunkAPI) => {
      const state = thunkAPI.getState();

      const api =
        state.api.awb_rest_api.infoApi;

      const [
        response,
      ] = await Promise.all([
        api.getAppSettings({
          headers: {
            "X-Performative":
              "UPDATE.FRONTEND.CHECK",
          },
        }),

        thunkAPI.dispatch(
          loadInstalledFrontendVersion(),
        ),
      ]);

      return (
        response.data?.propertyEntries ??
        []
      );
    },
  );

export const executeFrontendUpdate =
  createAsyncThunk<
    any[],
    void,
    {
      state: RootState;
    }
  >(
    "update/executeFrontendUpdate",
    async (_, thunkAPI) => {
      const state = thunkAPI.getState();

      const api =
        state.api.awb_rest_api.infoApi;

      const response =
        await api.getAppSettings({
          headers: {
            "X-Performative":
              "UPDATE.FRONTEND.EXECUTE",
          },
        });

      clearUpdateSettingsCache();

      return (
        response.data?.propertyEntries ??
        []
      );
    },
  );

export const checkBackendUpdate =
  createAsyncThunk<
    any[],
    void,
    {
      state: RootState;
    }
  >(
    "update/checkBackendUpdate",
    async (_, thunkAPI) => {
      const state = thunkAPI.getState();

      const api =
        state.api.awb_rest_api.infoApi;

      const response =
        await api.getAppSettings({
          headers: {
            "X-Performative":
              "UPDATE.BACKEND.CHECK",
          },
        });

      return (
        response.data?.propertyEntries ??
        []
      );
    },
  );

export const executeBackendUpdate =
  createAsyncThunk<
    any[],
    void,
    {
      state: RootState;
    }
  >(
    "update/executeBackendUpdate",
    async (_, thunkAPI) => {
      const state = thunkAPI.getState();

      const api =
        state.api.awb_rest_api.infoApi;

      const response =
        await api.getAppSettings({
          headers: {
            "X-Performative":
              "UPDATE.BACKEND.EXECUTE",
          },
        });

      return (
        response.data?.propertyEntries ??
        []
      );
    },
  );

export const saveAutoUpdate =
  createAsyncThunk<
    boolean,
    boolean,
    {
      state: RootState;
    }
  >(
    "update/saveAutoUpdate",
    async (next, thunkAPI) => {
      const state = thunkAPI.getState();

      const api =
        state.api.awb_rest_api.infoApi;

      await api.setAppSettings({
        performative:
          "UPDATE.STRATEGY",

        propertyEntries: [
          {
            key: "isautoupdate",
            value: String(next),
            valueType: "BOOLEAN",
          },
        ],
      } as any);

      if (
        typeof window !== "undefined"
      ) {
        try {
          const cached =
            localStorage.getItem(
              UPDATE_SETTINGS_CACHE_KEY,
            );

          if (cached) {
            const parsed =
              JSON.parse(cached);

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
      state.autoUpdate =
        action.payload;
    },

    setFrontendUpdateStatus(
      state,
      action: PayloadAction<
        UpdateState["frontend"]
      >,
    ) {
      state.frontend =
        action.payload;
    },

    setBackendUpdateStatus(
      state,
      action: PayloadAction<
        UpdateState["backend"]
      >,
    ) {
      state.backend =
        action.payload;
    },

    resetUpdateState() {
      return initialState;
    },
  },

  extraReducers: (builder) => {
    // -------------------------------------------------------------------------
    // INSTALLED FRONTEND VERSION
    // GET /api/version?type=WEBAPP
    // -------------------------------------------------------------------------

    builder.addCase(
      loadInstalledFrontendVersion.fulfilled,
      (state, action) => {
        state.frontend.currentVersion =
          action.payload.currentVersion;
      },
    );

    // -------------------------------------------------------------------------
    // LOAD UPDATE SETTINGS
    // -------------------------------------------------------------------------

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

        if (
          !hasValidUpdatePayload(
            action.payload,
          )
        ) {
          return;
        }

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
        if (
          !hasValidUpdatePayload(
            action.payload,
          )
        ) {
          return;
        }

        applyUpdatePayload(
          state,
          action.payload,
        );
      },
    );

    // -------------------------------------------------------------------------
    // AUTO UPDATE
    // -------------------------------------------------------------------------

    builder.addCase(
      saveAutoUpdate.fulfilled,
      (state, action) => {
        state.autoUpdate =
          action.payload;
      },
    );

    // -------------------------------------------------------------------------
    // CHECK FRONTEND UPDATE
    // -------------------------------------------------------------------------

    builder.addCase(
      checkFrontendUpdate.fulfilled,
      (state, action) => {
        const entries =
          Array.isArray(action.payload)
            ? action.payload
            : [];

        const pendingValue =
          findValue(
            entries,
            "updatecheck.frontend.ispending",
          );

        const availableValue =
          findValue(
            entries,
            "updatecheck.frontend.isavailable",
          );

        state.frontend = {
          ...state.frontend,

          isPending:
            pendingValue === undefined
              ? state.frontend.isPending
              : toBoolean(
                  pendingValue,
                ),

          isAvailable:
            availableValue ===
            undefined
              ? state.frontend.isAvailable
              : toBoolean(
                  availableValue,
                ),

          lastCheck: String(
            findValue(
              entries,
              "updatecheck.frontend.lastcheck",
            ) ??
              state.frontend.lastCheck,
          ),

          version: String(
            findValue(
              entries,
              "updatecheck.frontend.version",
            ) ??
              state.frontend.version,
          ),

          newVersion: String(
            findValue(
              entries,
              "updatecheck.frontend.newversion",
            ) ??
              state.frontend.newVersion,
          ),

          /*
           * currentVersion wird hier bewusst nicht gesetzt.
           *
           * Sie kommt ausschließlich aus:
           * GET /api/version?type=WEBAPP
           */
        };
      },
    );

    // -------------------------------------------------------------------------
    // EXECUTE FRONTEND UPDATE
    // -------------------------------------------------------------------------

    builder.addCase(
      executeFrontendUpdate.pending,
      (state) => {
        state.frontend.isPending =
          true;
      },
    );

    builder.addCase(
      executeFrontendUpdate.fulfilled,
      (state, action) => {
        const entries =
          Array.isArray(action.payload)
            ? action.payload
            : [];

        const pendingValue =
          findValue(
            entries,
            "updatecheck.frontend.ispending",
          );

        const availableValue =
          findValue(
            entries,
            "updatecheck.frontend.isavailable",
          );

        state.lastLoadedAt = null;

        state.frontend = {
          ...state.frontend,

          isPending:
            pendingValue === undefined
              ? true
              : toBoolean(
                  pendingValue,
                ),

          isAvailable:
            availableValue ===
            undefined
              ? state.frontend.isAvailable
              : toBoolean(
                  availableValue,
                ),

          lastCheck: String(
            findValue(
              entries,
              "updatecheck.frontend.lastcheck",
            ) ??
              state.frontend.lastCheck,
          ),

          version: String(
            findValue(
              entries,
              "updatecheck.frontend.version",
            ) ??
              state.frontend.version,
          ),

          newVersion: String(
            findValue(
              entries,
              "updatecheck.frontend.newversion",
            ) ??
              state.frontend.newVersion,
          ),

          /*
           * currentVersion bleibt unverändert.
           * Nach dem Reload wird sie erneut über
           * /api/version?type=WEBAPP geladen.
           */
        };
      },
    );

    builder.addCase(
      executeFrontendUpdate.rejected,
      (state) => {
        state.frontend.isPending =
          false;
      },
    );

    // -------------------------------------------------------------------------
    // CHECK BACKEND UPDATE
    // -------------------------------------------------------------------------

    builder.addCase(
      checkBackendUpdate.fulfilled,
      (state, action) => {
        const entries =
          Array.isArray(action.payload)
            ? action.payload
            : [];

        const pendingValue =
          findValue(
            entries,
            "updatecheck.backend.ispending",
          );

        const availableValue =
          findValue(
            entries,
            "updatecheck.backend.isavailable",
          );

        state.backend = {
          ...state.backend,

          isPending:
            pendingValue === undefined
              ? state.backend.isPending
              : toBoolean(
                  pendingValue,
                ),

          isAvailable:
            availableValue ===
            undefined
              ? state.backend.isAvailable
              : toBoolean(
                  availableValue,
                ),

          lastCheck: String(
            findValue(
              entries,
              "updatecheck.backend.lastcheck",
            ) ??
              state.backend.lastCheck,
          ),

          status: String(
            findValue(
              entries,
              "update.status",
            ) ??
              state.backend.status,
          ),

          progress: toNumber(
            findValue(
              entries,
              "update.progress",
            ) ??
              state.backend.progress,
          ),
        };
      },
    );

    // -------------------------------------------------------------------------
    // EXECUTE BACKEND UPDATE
    // -------------------------------------------------------------------------

    builder.addCase(
      executeBackendUpdate.pending,
      (state) => {
        state.backend.isPending =
          true;
      },
    );

    builder.addCase(
      executeBackendUpdate.fulfilled,
      (state, action) => {
        const entries =
          Array.isArray(action.payload)
            ? action.payload
            : [];

        const pendingValue =
          findValue(
            entries,
            "updatecheck.backend.ispending",
          );

        const availableValue =
          findValue(
            entries,
            "updatecheck.backend.isavailable",
          );

        state.backend = {
          ...state.backend,

          isPending:
            pendingValue === undefined
              ? true
              : toBoolean(
                  pendingValue,
                ),

          isAvailable:
            availableValue ===
            undefined
              ? state.backend.isAvailable
              : toBoolean(
                  availableValue,
                ),

          lastCheck: String(
            findValue(
              entries,
              "updatecheck.backend.lastcheck",
            ) ??
              state.backend.lastCheck,
          ),

          status: String(
            findValue(
              entries,
              "update.status",
            ) ??
              state.backend.status,
          ),

          progress: toNumber(
            findValue(
              entries,
              "update.progress",
            ) ??
              state.backend.progress,
          ),
        };
      },
    );

    builder.addCase(
      executeBackendUpdate.rejected,
      (state) => {
        state.backend.isPending =
          false;
      },
    );
  },
});

export const {
  setAutoUpdate,
  setFrontendUpdateStatus,
  setBackendUpdateStatus,
  resetUpdateState,
} = updateSlice.actions;

export default updateSlice.reducer;