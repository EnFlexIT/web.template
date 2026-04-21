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
      ok: res.ok,
      status: res.status,
    };
  } finally {
    clearTimeout(id);
  }
}

function isReachableStatus(status?: number): boolean {
  if (status == null) return false;

  // Server hat geantwortet -> erreichbar
  // auch wenn auth/security greift
  return status >= 200 && status < 500;
}

export const checkAlive = createAsyncThunk<
  {
    isOnline: boolean;
    wentOnline: boolean;
    error?: string | null;
    skipped?: boolean;
    checkedUrl?: string | null;
    checkedStatus?: number;
  },
  { silent?: boolean } | undefined
>("connectivity/checkAlive", async (arg, thunkAPI) => {
  const state = thunkAPI.getState() as RootState;

  if (state.api.isSwitchingServer) {
    return {
      isOnline: !state.connectivity.isOffline,
      wentOnline: false,
      error: null,
      skipped: true,
      checkedUrl: null,
      checkedStatus: undefined,
    };
  }

  const ip = selectIp(state);
  const wasOffline = state.connectivity.isOffline;
  const silent = arg?.silent === true;

  const baseUrl = (ip ?? "").replace(/\/+$/, "");

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

  const candidateUrls = [
    `${baseUrl}/api/alive`,
    `${baseUrl}/api/app/settings/get`,
  ];

  let lastStatus: number | undefined;
  let lastUrl: string | null = null;
  let lastError: unknown = null;

  for (const url of candidateUrls) {
    try {
      const result = await ping(url, 4000);
      lastStatus = result.status;
      lastUrl = url;

      console.log("[checkAlive] response:", url, "status:", result.status);

      if (isReachableStatus(result.status)) {
        return {
          isOnline: true,
          wentOnline: wasOffline,
          error: null,
          skipped: false,
          checkedUrl: url,
          checkedStatus: result.status,
        };
      }
    } catch (err: unknown) {
      lastUrl = url;
      lastError = err;
      console.log("[checkAlive] failed:", url, err);
    }
  }

  const message =
    silent
      ? null
      : lastError &&
          typeof lastError === "object" &&
          "name" in lastError &&
          (lastError as { name?: string }).name === "AbortError"
        ? "Server antwortet nicht (Timeout)."
        : "Server nicht erreichbar.";

  return {
    isOnline: false,
    wentOnline: false,
    error: message,
    skipped: false,
    checkedUrl: lastUrl,
    checkedStatus: lastStatus,
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