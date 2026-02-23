// src/redux/slices/connectivitySlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";

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
 * "Offline" bedeutet: keine HTTP-Response (Network/Timeout/DNS/Connection refused).
 * Sobald eine HTTP-Response existiert (auch 401/500), ist der Server "online" (alive erreichbar).
 */
function isNetworkOfflineError(err: any): boolean {
  // axios: err.response exists => server responded (online)
  if (err?.response) return false;
  return true;
}

export const checkAlive = createAsyncThunk<
  { isOnline: boolean; wentOnline: boolean; error?: string | null },
  { silent?: boolean } | undefined
>("connectivity/checkAlive", async (arg, thunkAPI) => {
  const state = thunkAPI.getState() as RootState;
  const { awb_rest_api } = state.api;

  const wasOffline = state.connectivity.isOffline;
  const silent = arg?.silent === true;

  try {
    // ✅ Wichtig: 401/500 NICHT als Error behandeln (nicht rejecten)
    const res = await awb_rest_api.infoApi.aliveGet({
      validateStatus: () => true,
    });

    // Sobald irgendeine HTTP-Antwort kommt => online (auch 401)
    const isOnline = res.status >= 200 && res.status < 600;

    if (isOnline) {
      return { isOnline: true, wentOnline: wasOffline === true, error: null };
    }

    // sehr unwahrscheinlich, aber fallback:
    return {
      isOnline: false,
      wentOnline: false,
      error: silent ? null : "Server nicht erreichbar.",
    };
  } catch (err: any) {
    // Nur echte Netzwerkfehler landen hier
    const offline = isNetworkOfflineError(err);

    if (!offline) {
      // Falls doch eine Response da ist, gilt online
      return { isOnline: true, wentOnline: wasOffline === true, error: null };
    }

    const msg = silent
      ? null
      : err?.message ||
        "Server nicht erreichbar. Bitte Verbindung prüfen und erneut versuchen.";

    return { isOnline: false, wentOnline: false, error: msg };
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

      // Nur überschreiben, wenn bewusst gesetzt wurde (silent => error kann null sein)
      if (action.payload.error !== undefined) {
        state.lastError = action.payload.error ?? null;
      }

      if (action.payload.isOnline) {
        const wasOffline = state.isOffline;
        state.isOffline = false;

        // "Back online" nur zeigen, wenn wir vorher offline waren
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

export const selectConnectivity = (s: RootState) => s.connectivity;
export const selectIsOffline = (s: RootState) => s.connectivity.isOffline;
export const selectShowBackOnline = (s: RootState) =>
  s.connectivity.showBackOnline;
export const selectCheckingAlive = (s: RootState) => s.connectivity.checking;

export default connectivitySlice.reducer;