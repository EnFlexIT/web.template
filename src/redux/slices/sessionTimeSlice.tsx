// src/redux/slices/sessionTimeSlice.ts

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import type { RootState } from "../store";
import { normalizeBaseUrl, selectApi } from "./apiSlice";

export type SessionTimes = {
  remainingTime: number;
  expirationTime: number;
  remainingTokenTime?: number;
  tokenExpirationTime?: number;
};

type SessionTimeState = {
  loading: boolean;
  extending: boolean;
  lastCheckedAt: number | null;
  lastExtendedAt: number | null;
  remainingTime: number | null;
  expirationTime: number | null;
  remainingTokenTime: number | null;
  tokenExpirationTime: number | null;
  error: string | null;
};

const initialState: SessionTimeState = {
  loading: false,
  extending: false,
  lastCheckedAt: null,
  lastExtendedAt: null,
  remainingTime: null,
  expirationTime: null,
  remainingTokenTime: null,
  tokenExpirationTime: null,
  error: null,
};

function isRedirectStatus(status: number): boolean {
  return (
    status === 301 ||
    status === 302 ||
    status === 303 ||
    status === 307 ||
    status === 308
  );
}

function validateSessionTimes(data: unknown): SessionTimes {
  const value = data as Partial<SessionTimes>;

  if (
    typeof value?.remainingTime !== "number" ||
    !Number.isFinite(value.remainingTime) ||
    typeof value?.expirationTime !== "number" ||
    !Number.isFinite(value.expirationTime)
  ) {
    throw new Error("Ungültige SessionTime-Antwort.");
  }

  return {
    remainingTime: value.remainingTime,
    expirationTime: value.expirationTime,
    remainingTokenTime:
      typeof value.remainingTokenTime === "number"
        ? value.remainingTokenTime
        : undefined,
    tokenExpirationTime:
      typeof value.tokenExpirationTime === "number"
        ? value.tokenExpirationTime
        : undefined,
  };
}

async function requestSessionTimes(params: {
  state: RootState;
  path: string;
  errorMessage: string;
}): Promise<SessionTimes> {
  const api = selectApi(params.state);
  const baseUrl = normalizeBaseUrl(api.ip);

  if (!baseUrl) {
    throw new Error("Server-URL fehlt.");
  }

  const response = await fetch(`${baseUrl}${params.path}`, {
    method: "GET",
    cache: "no-store",
    credentials: "include",
    redirect: "manual",
    headers: {
      Accept: "application/json",
      ...(api.authenticationMethod === "jwt" && api.jwt
        ? {
            Authorization: `Bearer ${api.jwt}`,
          }
        : {}),
    },
  });

  if (
    isRedirectStatus(response.status) ||
    response.type === "opaqueredirect"
  ) {
    throw new Error("OIDC_REDIRECT");
  }

  if (!response.ok) {
    throw new Error(`${params.errorMessage}: ${response.status}`);
  }

  return validateSessionTimes(await response.json());
}

export const loadSessionTime = createAsyncThunk<
  SessionTimes,
  { silent?: boolean } | undefined,
  { state: RootState }
>("sessionTime/loadSessionTime", async (_, thunkAPI) => {
  return requestSessionTimes({
    state: thunkAPI.getState(),
    path: "/api/user/sessionTime",
    errorMessage: "SessionTime konnte nicht geladen werden",
  });
});

export const extendSessionTime = createAsyncThunk<
  SessionTimes,
  void,
  { state: RootState }
>("sessionTime/extendSessionTime", async (_, thunkAPI) => {
  return requestSessionTimes({
    state: thunkAPI.getState(),
    path: "/api/user/sessionTime/extend",
    errorMessage: "SessionTime konnte nicht verlängert werden",
  });
});

function applySessionTimes(
  state: SessionTimeState,
  payload: SessionTimes,
): void {
  /*
   * Eine ältere parallele Antwort darf eine bereits verlängerte
   * Session nicht wieder mit älteren Werten überschreiben.
   */
  if (
    state.expirationTime != null &&
    payload.expirationTime < state.expirationTime
  ) {
    return;
  }

  state.lastCheckedAt = Date.now();
  state.remainingTime = payload.remainingTime;
  state.expirationTime = payload.expirationTime;
  state.remainingTokenTime = payload.remainingTokenTime ?? null;
  state.tokenExpirationTime = payload.tokenExpirationTime ?? null;
  state.error = null;
}

const sessionTimeSlice = createSlice({
  name: "sessionTime",
  initialState,

  reducers: {
    clearSessionTime: (state) => {
      state.loading = false;
      state.extending = false;
      state.lastCheckedAt = null;
      state.lastExtendedAt = null;
      state.remainingTime = null;
      state.expirationTime = null;
      state.remainingTokenTime = null;
      state.tokenExpirationTime = null;
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(loadSessionTime.pending, (state, action) => {
        if (action.meta.arg?.silent !== true) {
          state.loading = true;
        }
      })

      .addCase(loadSessionTime.fulfilled, (state, action) => {
        state.loading = false;
        applySessionTimes(state, action.payload);
      })

      .addCase(loadSessionTime.rejected, (state, action) => {
        state.loading = false;

        if (action.meta.arg?.silent !== true) {
          state.error =
            action.error.message ??
            "SessionTime konnte nicht geladen werden.";
        }
      })

      .addCase(extendSessionTime.pending, (state) => {
        state.extending = true;
        state.error = null;
      })

      .addCase(extendSessionTime.fulfilled, (state, action) => {
        state.extending = false;
        state.lastExtendedAt = Date.now();
        applySessionTimes(state, action.payload);
      })

      .addCase(extendSessionTime.rejected, (state, action) => {
        state.extending = false;
        state.error =
          action.error.message ??
          "SessionTime konnte nicht verlängert werden.";
      });
  },
});

export const { clearSessionTime } = sessionTimeSlice.actions;

export const selectSessionTime = (state: RootState) =>
  state.sessionTime;

export default sessionTimeSlice.reducer;