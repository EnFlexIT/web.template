// src/redux/slices/connectivitySlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import { normalizeBaseUrl, selectIp } from "./apiSlice";

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
function isReachableResponse(res: Response): boolean {
  if (res.type === "opaqueredirect") {
    return true;
  }

  if (res.status === 0) {
    return true;
  }

  return res.status >= 200 && res.status < 500;
}


async function ping(
  url: string,
  jwt: string | null,
  timeoutMs = 4000,
): Promise<{ ok: boolean; status?: number }> {
  const ctrl = new AbortController();

  const id = setTimeout(() => ctrl.abort(), timeoutMs);

  function isReachableResponse(res: Response): boolean {
    if (res.type === "opaqueredirect") return true;
    if (res.status === 0) return true;

    return res.status >= 200 && res.status < 500;
  }

  try {
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: ctrl.signal,
      redirect: "manual",
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(jwt
          ? {
              Authorization: `Bearer ${jwt}`,
            }
          : {}),
      },
    });

    return {
      ok: isReachableResponse(res),
      status: res.status,
    };
  } finally {
    clearTimeout(id);
  }
}
function getErrorMessage(error: unknown, silent: boolean): string | null {
  if (silent) return null;

  if (
    error &&
    typeof error === "object" &&
    "name" in error &&
    (error as { name?: string }).name === "AbortError"
  ) {
    return "Server antwortet nicht (Timeout).";
  }

  return "Server nicht erreichbar.";
}

export const checkAlive = createAsyncThunk<
  CheckAliveResult,
  { silent?: boolean } | undefined
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
      
    const jwtForPing =
  state.api.authenticationMethod === "jwt"
    ? state.api.jwt
    : null;

const result = await ping(url, jwtForPing, 4000);

      lastStatus = result.status;
      lastUrl = url;

      //console.log("[checkAlive] response:", url, "status:", result.status);
if (result.ok) {
  // console.log("[checkAlive] ONLINE DETECTED", {url,status: result.status, });
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

      //console.log("[checkAlive] failed:", url, err);
    }
  }
 //console.log("[checkAlive] OFFLINE DETECTED", { lastUrl,lastStatus, lastError,});
  return {
    isOnline: false,
    wentOnline: false,
    error: getErrorMessage(lastError, silent),
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
        state.showBackOnline = wasOffline;
      } else {
        state.isOffline = true;
        state.showBackOnline = false;
      }
    });

    builder.addCase(checkAlive.rejected, (state, action) => {
      state.checking = false;
      state.isOffline = false;
      state.showBackOnline = false;
      state.lastError = action.error?.message ?? "Server nicht erreichbar";
    });
  },
});

export const { dismissBackOnline, setOfflineLocal } =
  connectivitySlice.actions;

export const selectConnectivity = (state: RootState) => state.connectivity;

export default connectivitySlice.reducer;