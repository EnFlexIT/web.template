import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";

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

const UPDATE_LAST_LOADED_KEY = "update:lastLoadedAt";
const UPDATE_SETTINGS_CACHE_KEY = "update:settingsCache";

function hasValidUpdatePayload(payload: any) {
  return Boolean(
    payload?.frontend?.currentVersion ||
      payload?.frontend?.lastCheck ||
      payload?.backend?.lastCheck,
  );
}

function applyUpdatePayload(state: UpdateState, payload: any) {
  if (!payload) return;

  state.lastLoadedAt = Date.now();

  state.autoUpdate = payload.autoUpdate;

  if (payload.frontend) {
    state.frontend = {
      ...state.frontend,
      ...payload.frontend,
    };
  }

  if (payload.backend) {
    state.backend = {
      ...state.backend,
      ...payload.backend,
    };
  }
}

export const loadUpdateSettings = createAsyncThunk(
  "update/loadUpdateSettings",
  async (_, thunkAPI) => {
    const state = thunkAPI.getState() as RootState;
    const api = state.api.awb_rest_api.infoApi;

    const findValue = (entries: any[], key: string) =>
      entries.find((entry) => entry.key === key)?.value;

    const toBoolean = (value: any) =>
      String(value ?? "").trim().toLowerCase() === "true";

    const toNumber = (value: any) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    const strategyRes = await api.getAppSettings({
      headers: { "X-Performative": "UPDATE.STRATEGY" },
    });

    const frontendRes = await api.getAppSettings({
      headers: { "X-Performative": "UPDATE.FRONTEND.CHECK" },
    });

    const backendRes = await api.getAppSettings({
      headers: { "X-Performative": "UPDATE.BACKEND.CHECK" },
    });

    const strategyEntries = strategyRes.data?.propertyEntries ?? [];
    const frontendEntries = frontendRes.data?.propertyEntries ?? [];
    const backendEntries = backendRes.data?.propertyEntries ?? [];

    return {
      autoUpdate: toBoolean(findValue(strategyEntries, "isautoupdate")),

      frontend: {
        isPending: toBoolean(
          findValue(frontendEntries, "updatecheck.frontend.ispending"),
        ),
        isAvailable: toBoolean(
          findValue(frontendEntries, "updatecheck.frontend.isavailable"),
        ),
        lastCheck:
          findValue(frontendEntries, "updatecheck.frontend.lastcheck") ?? "",
        version:
          findValue(frontendEntries, "updatecheck.frontend.version") ?? "",
        newVersion:
          findValue(frontendEntries, "updatecheck.frontend.newversion") ?? "",
        currentVersion:
          findValue(frontendEntries, "updatecheck.frontend.currentversion") ??
          "",
      },

      backend: {
        isPending: toBoolean(
          findValue(backendEntries, "updatecheck.backend.ispending"),
        ),
        isAvailable: toBoolean(
          findValue(backendEntries, "updatecheck.backend.isavailable"),
        ),
        lastCheck:
          findValue(backendEntries, "updatecheck.backend.lastcheck") ?? "",
        status: findValue(backendEntries, "update.status") ?? "",
        progress: toNumber(findValue(backendEntries, "update.progress")),
      },
    };
  },
);

export const loadUpdateSettingsIfNeeded = createAsyncThunk(
  "update/loadUpdateSettingsIfNeeded",
  async (
    options: { force?: boolean; maxAgeMs?: number } | undefined,
    thunkAPI,
  ) => {
    const state = thunkAPI.getState() as RootState;
    const updateState = state.update;

    const force = options?.force === true;
    const maxAgeMs = options?.maxAgeMs ?? 30 * 60 * 1000;

    const storedLastLoadedAt =
      typeof window !== "undefined"
        ? Number(localStorage.getItem(UPDATE_LAST_LOADED_KEY))
        : updateState.lastLoadedAt;

    if (!force && updateState.loading) {
      return null;
    }

    if (
      !force &&
      storedLastLoadedAt &&
      Date.now() - storedLastLoadedAt < maxAgeMs
    ) {
      if (typeof window !== "undefined") {
        const cached = localStorage.getItem(UPDATE_SETTINGS_CACHE_KEY);

        if (cached) {
          try {
            return JSON.parse(cached);
          } catch (error) {
            localStorage.removeItem(UPDATE_SETTINGS_CACHE_KEY);
            localStorage.removeItem(UPDATE_LAST_LOADED_KEY);
          }
        }
      }

      return null;
    }

    const result = await thunkAPI.dispatch(loadUpdateSettings() as any);

    if (loadUpdateSettings.fulfilled.match(result)) {
      const payload = result.payload;

      if (hasValidUpdatePayload(payload)) {
        if (typeof window !== "undefined") {
          localStorage.setItem(UPDATE_LAST_LOADED_KEY, String(Date.now()));
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

export const checkFrontendUpdate = createAsyncThunk(
  "update/checkFrontendUpdate",
  async (_, thunkAPI) => {
    const state = thunkAPI.getState() as RootState;
    const api = state.api.awb_rest_api.infoApi;

    const response = await api.getAppSettings({
      headers: {
        "X-Performative": "UPDATE.FRONTEND.CHECK",
      },
    });

    return response.data?.propertyEntries ?? [];
  },
);
export const executeFrontendUpdate = createAsyncThunk(
  "update/executeFrontendUpdate",
  async (_, thunkAPI) => {
    const state = thunkAPI.getState() as RootState;
    const api = state.api.awb_rest_api.infoApi;

    const response = await api.getAppSettings({
      headers: {
        "X-Performative": "UPDATE.FRONTEND.EXECUTE",
      },
    });

    return response.data?.propertyEntries ?? [];
  },
);
  export const checkBackendUpdate = createAsyncThunk(
  "update/checkBackendUpdate",
  async (_, thunkAPI) => {
    const state = thunkAPI.getState() as RootState;
    const api = state.api.awb_rest_api.infoApi;

    const response = await api.getAppSettings({
      headers: {
        "X-Performative": "UPDATE.BACKEND.CHECK",
      },
    });

    return response.data?.propertyEntries ?? [];
  },
);
export const executeBackendUpdate = createAsyncThunk(
  "update/executeBackendUpdate",
  async (_, thunkAPI) => {
    const state = thunkAPI.getState() as RootState;
    const api = state.api.awb_rest_api.infoApi;

    const response = await api.getAppSettings({
      headers: {
        "X-Performative": "UPDATE.BACKEND.EXECUTE",
      },
    });

    return response.data?.propertyEntries ?? [];
  },
);
export const saveAutoUpdate = createAsyncThunk(
  "update/saveAutoUpdate",
  async (next: boolean, thunkAPI) => {
    const state = thunkAPI.getState() as RootState;
    const api = state.api.awb_rest_api.infoApi;

    const response = await api.setAppSettings({
      performative: "UPDATE.STRATEGY",
      propertyEntries: [
        {
          key: "isautoupdate",
          value: String(next),
          valueType: "BOOLEAN",
        },
      ],
    } as any);

    console.log("SAVE AUTO UPDATE RESPONSE", response.data);

    const verify = await api.getAppSettings({
      headers: {
        "X-Performative": "UPDATE.STRATEGY",
      },
    });

    console.log("VERIFY AFTER SAVE", verify.data);

    // Cache aktualisieren
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(
          "update:settingsCache",
        );

        if (cached) {
          const parsed = JSON.parse(cached);

          parsed.autoUpdate = next;

          localStorage.setItem(
            "update:settingsCache",
            JSON.stringify(parsed),
          );
        }
      } catch (error) {
        console.warn(
          "[UPDATE] failed to update settings cache",
          error,
        );
      }
    }

    return next;
  }
);

const updateSlice = createSlice({
  name: "update",
  initialState,

  reducers: {
    setAutoUpdate(state, action) {
      state.autoUpdate = action.payload;
    },

    setFrontendUpdateStatus(state, action) {
      state.frontend = action.payload;
    },

    setBackendUpdateStatus(state, action) {
      state.backend = action.payload;
    },

    resetUpdateState() {
      return initialState;
    },
  },

  extraReducers: (builder) => {
    //************************************************************************** */
//*********************** LOAD UPDATE SETTINGS ****************************** */
    builder.addCase(loadUpdateSettings.pending, (state) => {
      state.loading = true;
    });

    builder.addCase(loadUpdateSettings.fulfilled, (state, action) => {
      state.loading = false;

      if (!hasValidUpdatePayload(action.payload)) return;

      applyUpdatePayload(state, action.payload);
    });

    builder.addCase(loadUpdateSettings.rejected, (state) => {
      state.loading = false;
    });

    builder.addCase(loadUpdateSettingsIfNeeded.fulfilled, (state, action) => {
      if (!hasValidUpdatePayload(action.payload)) return;

      applyUpdatePayload(state, action.payload);
    });

    builder.addCase(saveAutoUpdate.fulfilled, (state, action) => {
      state.autoUpdate = action.payload;
    });
//************************************************************************** */
//*********************** CHECK & EXECUTE UPDATES ****************************** */
    builder.addCase(executeFrontendUpdate.fulfilled, (state, action) => {
      const entries = action.payload;

      const findValue = (key: string) =>
        entries.find((entry: any) => entry.key === key)?.value;

      const toBoolean = (value: any) =>
        String(value ?? "").trim().toLowerCase() === "true";

      state.frontend = {
        ...state.frontend,
        isPending: toBoolean(findValue("updatecheck.frontend.ispending")),
        isAvailable: toBoolean(findValue("updatecheck.frontend.isavailable")),
        lastCheck:
          findValue("updatecheck.frontend.lastcheck") ?? state.frontend.lastCheck,
        version:
          findValue("updatecheck.frontend.version") ?? state.frontend.version,
        newVersion:
          findValue("updatecheck.frontend.newversion") ??
          state.frontend.newVersion,
        currentVersion:
          findValue("updatecheck.frontend.currentversion") ??
          state.frontend.currentVersion,
      };
    });
//************************************************************************** */
//*********************** CHECK & EXECUTE UPDATES ****************************** */
    builder.addCase(executeBackendUpdate.fulfilled, (state, action) => {
      const entries = action.payload;

      const findValue = (key: string) =>
        entries.find((entry: any) => entry.key === key)?.value;

      const toBoolean = (value: any) =>
        String(value ?? "").trim().toLowerCase() === "true";

      const toNumber = (value: any) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
      };

      state.backend = {
        ...state.backend,
        isPending: true,
        isAvailable: toBoolean(findValue("updatecheck.backend.isavailable")),
        lastCheck:
          findValue("updatecheck.backend.lastcheck") ?? state.backend.lastCheck,
        status: findValue("update.status") ?? state.backend.status,
        progress: toNumber(findValue("update.progress")),
      };
    });
    //************************************************************************** */
//*********************** CHECK & EXECUTE UPDATES ****************************** */
      builder.addCase(checkBackendUpdate.fulfilled, (state, action) => {
        const entries = action.payload;

        const findValue = (key: string) =>
          entries.find((entry: any) => entry.key === key)?.value;

        const toBoolean = (value: any) =>
          String(value ?? "").trim().toLowerCase() === "true";

        const toNumber = (value: any) => {
          const parsed = Number(value);
          return Number.isFinite(parsed) ? parsed : 0;
        };

        state.backend = {
          ...state.backend,

          isPending: toBoolean(
            findValue("updatecheck.backend.ispending")
          ),

          isAvailable: toBoolean(
            findValue("updatecheck.backend.isavailable")
          ),

          lastCheck:
            findValue("updatecheck.backend.lastcheck") ??
            state.backend.lastCheck,

          status:
            findValue("update.status") ??
            state.backend.status,

          progress:
            toNumber(findValue("update.progress")),
        };
      });

//************************************************************************** */
//*********************** CHECK & EXECUTE UPDATES ****************************** */
    builder.addCase(checkFrontendUpdate.fulfilled, (state, action) => {
      const entries = action.payload;

      const findValue = (key: string) =>
        entries.find((entry: any) => entry.key === key)?.value;

      const toBoolean = (value: any) =>
        String(value ?? "").trim().toLowerCase() === "true";

      state.frontend = {
        ...state.frontend,

        isPending: toBoolean(
          findValue("updatecheck.frontend.ispending"),
        ),

        isAvailable: toBoolean(
          findValue("updatecheck.frontend.isavailable"),
        ),

        lastCheck:
          findValue("updatecheck.frontend.lastcheck") ??
          state.frontend.lastCheck,

        version:
          findValue("updatecheck.frontend.version") ??
          state.frontend.version,

        newVersion:
          findValue("updatecheck.frontend.newversion") ??
          state.frontend.newVersion,

        currentVersion:
          findValue("updatecheck.frontend.currentversion") ??
          state.frontend.currentVersion,
      };
    });
  },
});

export const {
  setAutoUpdate,
  setFrontendUpdateStatus,
  setBackendUpdateStatus,
  resetUpdateState,
} = updateSlice.actions;

export default updateSlice.reducer;