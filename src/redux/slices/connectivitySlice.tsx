// src/redux/slices/connectivitySlice.ts

import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

import type { RootState } from "../store";
import { normalizeBaseUrl, selectIp } from "./apiSlice";

type ConnectivityState = {
  isOffline: boolean;
  showBackOnline: boolean;
  checking: boolean;
  lastError: string | null;
};

type CheckAliveResult = {
  isOnline: boolean;
  wentOnline: boolean;
  error: string | null;
  skipped: boolean;
  checkedUrl: string | null;
  checkedStatus?: number;
};

const ALIVE_TIMEOUT_MS = 5_000;

const initialState: ConnectivityState = {
  isOffline: false,
  showBackOnline: false,
  checking: false,
  lastError: null,
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === "AbortError") {
      return "Zeitüberschreitung beim Server-Check.";
    }

    return error.message;
  }

  return "Server nicht erreichbar.";
}

export const checkAlive = createAsyncThunk<
  CheckAliveResult,
  { silent?: boolean; force?: boolean } | undefined,
  { state: RootState }
>("connectivity/checkAlive", async (arg, thunkAPI) => {
  const state = thunkAPI.getState();

  if (state.api.isSwitchingServer || state.api.isLoggingOut) {
    return {
      isOnline: !state.connectivity.isOffline,
      wentOnline: false,
      error: null,
      skipped: true,
      checkedUrl: null,
    };
  }

  const baseUrl = normalizeBaseUrl(selectIp(state));
  const wasOffline = state.connectivity.isOffline;
  const silent = arg?.silent === true;

  if (!baseUrl) {
    return {
      isOnline: false,
      wentOnline: false,
      error: silent ? null : "Keine Server-URL gesetzt.",
      skipped: false,
      checkedUrl: null,
    };
  }

  const checkedUrl = `${baseUrl}/api/alive`;
  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, ALIVE_TIMEOUT_MS);

  try {
    const response = await fetch(checkedUrl, {
      method: "GET",
      cache: "no-store",
      credentials: "include",
      redirect: "manual",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    /*
     * Jede HTTP-Antwort beweist, dass der Server erreichbar ist.
     *
     * Das gilt auch für:
     * - 401 / 403
     * - 303 OIDC-Redirect
     * - 500 Serverfehler
     * - opaqueredirect
     *
     * Connectivity prüft nur die Erreichbarkeit und führt keinen Logout aus.
     */
    return {
      isOnline: true,
      wentOnline: wasOffline,
      error: null,
      skipped: false,
      checkedUrl,
      checkedStatus: response.status,
    };
  } catch (error: unknown) {
    const message = getErrorMessage(error);

    return {
      isOnline: false,
      wentOnline: false,
      error: silent ? null : message,
      skipped: false,
      checkedUrl,
    };
  } finally {
    clearTimeout(timeoutId);
  }
});

const connectivitySlice = createSlice({
  name: "connectivity",
  initialState,
  reducers: {
    dismissBackOnline: (state) => {
      state.showBackOnline = false;
    },

    setOfflineLocal: (
      state,
      action: PayloadAction<{ error?: string }>,
    ) => {
      state.isOffline = true;
      state.showBackOnline = false;
      state.lastError =
        action.payload.error ?? "Server nicht erreichbar.";
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(checkAlive.pending, (state) => {
        state.checking = true;
      })

      .addCase(checkAlive.fulfilled, (state, action) => {
        state.checking = false;

        if (action.payload.skipped) {
          return;
        }

        if (action.payload.isOnline) {
          const wasOffline = state.isOffline;

          state.isOffline = false;
          state.showBackOnline = wasOffline;
          state.lastError = null;
          return;
        }

        state.isOffline = true;
        state.showBackOnline = false;
        state.lastError =
          action.payload.error ?? "Server nicht erreichbar.";
      })

      .addCase(checkAlive.rejected, (state, action) => {
        state.checking = false;
        state.isOffline = true;
        state.showBackOnline = false;
        state.lastError =
          action.error.message ?? "Server nicht erreichbar.";
      });
  },
});

export const { dismissBackOnline, setOfflineLocal } =
  connectivitySlice.actions;

export const selectConnectivity = (state: RootState) =>
  state.connectivity;

export default connectivitySlice.reducer;