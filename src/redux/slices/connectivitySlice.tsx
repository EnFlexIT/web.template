// src/redux/slices/connectivitySlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import { normalizeBaseUrl, selectIp } from "./apiSlice";
import { checkServerReachable } from "../../screens/login/serverCheck";

type ConnectivityState = {
  isOffline: boolean;
  showBackOnline: boolean;
  checking: boolean;
  lastError?: string | null;
};

type CheckAliveResult = {
  isOnline: boolean;
  wentOnline: boolean;
  error?: string | null;
  skipped?: boolean;
  checkedUrl?: string | null;
  checkedStatus?: number;
};

const initialState: ConnectivityState = {
  isOffline: false,
  showBackOnline: false,
  checking: false,
  lastError: null,
};

export const checkAlive = createAsyncThunk<
  CheckAliveResult,
  { silent?: boolean; force?: boolean } | undefined
>("connectivity/checkAlive", async (arg, thunkAPI) => {
  const state = thunkAPI.getState() as RootState;

  if (state.api.isSwitchingServer || state.api.isLoggingOut) {
    return {
      isOnline: !state.connectivity.isOffline,
      wentOnline: false,
      error: null,
      skipped: true,
      checkedUrl: null,
      checkedStatus: undefined,
    };
  }

  const baseUrl = normalizeBaseUrl(selectIp(state));
  const wasOffline = state.connectivity.isOffline;
  const silent = arg?.silent === true;
  const force = arg?.force === true;

  if (!baseUrl) {
    return {
      isOnline: false,
      wentOnline: false,
      error: silent ? null : "Keine Server-URL gesetzt.",
      skipped: false,
      checkedUrl: null,
      checkedStatus: undefined,
    };
  }

  const jwtForCheck =
    state.api.authenticationMethod === "jwt" ? state.api.jwt : null;

  const result = await checkServerReachable(
    baseUrl,
    jwtForCheck,
    state.api.authenticationMethod,
    { force },
  );

  return {
    isOnline: result.ok,
    wentOnline: result.ok && wasOffline,
    error: result.ok ? null : silent ? null : result.message ?? "Server nicht erreichbar.",
    skipped: false,
    checkedUrl: null,
    checkedStatus: undefined,
  };
});

const connectivitySlice = createSlice({
  name: "connectivity",
  initialState,
  reducers: {
    dismissBackOnline: (state) => {
      state.showBackOnline = false;
    },

    setOfflineLocal: (state, action: PayloadAction<{ error?: string }>) => {
      state.isOffline = true;
      state.lastError = action.payload.error ?? null;
      state.showBackOnline = false;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(checkAlive.pending, (state) => {
      state.checking = true;
    });

    builder.addCase(checkAlive.fulfilled, (state, action) => {
      state.checking = false;

      if (action.payload.skipped) {
        return;
      }

      state.lastError = action.payload.error ?? null;

      if (action.payload.isOnline) {
        const wasOffline = state.isOffline;

        state.isOffline = false;
        state.showBackOnline = wasOffline;
      } else {
        state.isOffline = true;
        state.showBackOnline = false;
      }
    });

    builder.addCase(checkAlive.rejected, (state, action) => {
      state.checking = false;
      state.isOffline = true;
      state.showBackOnline = false;
      state.lastError = action.error?.message ?? "Server nicht erreichbar";
    });
  },
});

export const { dismissBackOnline, setOfflineLocal } =
  connectivitySlice.actions;

export const selectConnectivity = (state: RootState) => state.connectivity;

export default connectivitySlice.reducer;