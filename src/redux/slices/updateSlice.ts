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
    const frontendRes = await api.getAppSettings({headers: {"X-Performative": "UPDATE.FRONTEND.CHECK[true]",},});
    const backendRes = await api.getAppSettings({ headers: {"X-Performative": "UPDATE.BACKEND.CHECK[false]",},});
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
export const checkFrontendUpdate = createAsyncThunk(
  "update/checkFrontendUpdate",
  async (_, thunkAPI) => {
    const state = thunkAPI.getState() as RootState;
    const api = state.api.awb_rest_api.infoApi;

    const response = await api.getAppSettings({
      headers: {
        "X-Performative": "UPDATE.FRONTEND.CHECK[isForceCheck=true]",
      },
    });

    return response.data?.propertyEntries ?? [];
  }
);
export const saveAutoUpdate = createAsyncThunk(
  "update/saveAutoUpdate",
  async (next: boolean, thunkAPI) => {
    const state = thunkAPI.getState() as RootState;
    const api = state.api.awb_rest_api.infoApi;

    console.log("SAVE AUTO UPDATE START", next);

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
  builder.addCase(loadUpdateSettings.fulfilled, (state, action) => {
    state.autoUpdate = action.payload.autoUpdate;
    state.frontend = action.payload.frontend;
    state.backend = action.payload.backend;
  });

  builder.addCase(saveAutoUpdate.fulfilled, (state, action) => {
    state.autoUpdate = action.payload;
  });

  builder.addCase(checkFrontendUpdate.fulfilled, (state, action) => {
    const entries = action.payload;

    const findValue = (key: string) =>
      entries.find((entry: any) => entry.key === key)?.value;

    const toBoolean = (value: any) =>
      String(value ?? "").trim().toLowerCase() === "true";

    state.frontend = {
      isPending: toBoolean(findValue("updatecheck.frontend.ispending")),
      isAvailable: toBoolean(findValue("updatecheck.frontend.isavailable")),
      lastCheck: findValue("updatecheck.frontend.lastcheck") ?? "",
      version: findValue("updatecheck.frontend.version") ?? "",
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