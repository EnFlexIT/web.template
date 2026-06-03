import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";

interface UpdateState {
  autoUpdate: boolean;

  frontend: {
    isPending: boolean;
    isAvailable: boolean;
    lastCheck: string;
    version: string;
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
  autoUpdate: false,

  frontend: {
    isPending: false,
    isAvailable: false,
    lastCheck: "",
    version: "",
  },

  backend: {
    isPending: false,
    isAvailable: false,
    lastCheck: "",
    status: "",
    progress: 0,
  },
};

export const loadUpdateSettings = createAsyncThunk(
  "update/loadUpdateSettings",
  async (_, thunkAPI) => {
    const state = thunkAPI.getState() as RootState;
    const api = state.api.awb_rest_api.infoApi;
    const findValue = (entries: any[], key: string) =>entries.find((entry) => entry.key === key)?.value;
    const toBoolean = (value: any) =>String(value ?? "").trim().toLowerCase() === "true";
    const toNumber = (value: any) => { const parsed = Number(value);  return Number.isFinite(parsed) ? parsed : 0;  };
    const strategyRes = await api.getAppSettings({headers: { "X-Performative": "UPDATE.STRATEGY" }, });
    const frontendRes = await api.getAppSettings({headers: {"X-Performative": "UPDATE.FRONTEND.CHECK[isForceCheck=false]",},});
    const backendRes = await api.getAppSettings({ headers: {"X-Performative": "UPDATE.BACKEND.CHECK[isForceCheck=false]",},});
    const strategyEntries = strategyRes.data?.propertyEntries ?? [];
    const frontendEntries = frontendRes.data?.propertyEntries ?? [];
    const backendEntries = backendRes.data?.propertyEntries ?? [];
    return {
      autoUpdate: toBoolean(findValue(strategyEntries, "isautoupdate")),

      frontend: {
        isPending: toBoolean(
          findValue(frontendEntries, "updatecheck.frontend.ispending")
        ),
        isAvailable: toBoolean(
          findValue(frontendEntries, "updatecheck.frontend.isavailable")
        ),
        lastCheck:
          findValue(frontendEntries, "updatecheck.frontend.lastcheck") ?? "",
        version:
          findValue(frontendEntries, "updatecheck.frontend.version") ?? "",
      },

      backend: {
        isPending: toBoolean(
          findValue(backendEntries, "updatecheck.backend.ispending")
        ),
        isAvailable: toBoolean(
          findValue(backendEntries, "updatecheck.backend.isavailable")
        ),
        lastCheck:
          findValue(backendEntries, "updatecheck.backend.lastcheck") ?? "",
        status: findValue(backendEntries, "update.status") ?? "",
        progress: toNumber(findValue(backendEntries, "update.progress")),
      },
    };
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
    builder.addCase(loadUpdateSettings.fulfilled, (state, action) => {
      state.autoUpdate = action.payload.autoUpdate;
      state.frontend = action.payload.frontend;
      state.backend = action.payload.backend;
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