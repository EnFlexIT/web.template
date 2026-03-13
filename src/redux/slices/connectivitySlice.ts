// src/redux/slices/connectivitySlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import { selectIp } from "./apiSlice";

type ConnectivityState = {
  isOffline: boolean;
  showBackOnline: boolean;
  checking: boolean;
  lastError?: string | null;
};

const initialState: ConnectivityState = {
  isOffline: false,
  showBackOnline: false,
  checking: false,
  lastError: null,
};

/**
 * Kleiner Ping ohne Auth + Timeout.
 * Wichtig:
 * Jede HTTP-Response bedeutet hier "Server erreichbar".
 * Auch 401/403/500 zählen als online.
 * Offline ist nur: kein Response wegen Netzwerkfehler / Abort / Timeout.
 */
async function ping(
  url: string,
  timeoutMs = 4000,
): Promise<{ ok: boolean; status?: number }> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: ctrl.signal,
    });

    return {
      ok: true,
      status: res.status,
    };
  } finally {
    clearTimeout(id);
  }
}

export const checkAlive = createAsyncThunk<
  { isOnline: boolean; wentOnline: boolean; error?: string | null },
  { silent?: boolean } | undefined
>("connectivity/checkAlive", async (arg, thunkAPI) => {
  const state = thunkAPI.getState() as RootState;
  const ip = selectIp(state);
  const wasOffline = state.connectivity.isOffline;
  const silent = arg?.silent === true;

  const baseUrl = (ip ?? "").replace(/\/+$/, "");
  const url = `${baseUrl}/api/alive`;

  if (!baseUrl) {
    return {
      isOnline: false,
      wentOnline: false,
      error: silent ? null : "Keine Server-URL gesetzt.",
    };
  }

  try {
    const result = await ping(url, 4000);

    console.log("[checkAlive] reachable:", url, "status:", result.status);

    return {
      isOnline: true,
      wentOnline: wasOffline,
      error: null,
    };
  } catch (err: any) {
    const msg = silent
      ? null
      : err?.name === "AbortError"
        ? "Server antwortet nicht (Timeout)."
        : err?.message || "Server nicht erreichbar.";

    console.log("[checkAlive] failed:", url, err);

    return {
      isOnline: false,
      wentOnline: false,
      error: msg,
    };
  }
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
      state.lastError = action.payload.error ?? null;

      if (action.payload.isOnline) {
        const wasOffline = state.isOffline;

        state.isOffline = false;
        state.showBackOnline = wasOffline ? true : state.showBackOnline;
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

export const { dismissBackOnline, setOfflineLocal } = connectivitySlice.actions;

export const selectConnectivity = (state: RootState) => state.connectivity;

export default connectivitySlice.reducer;