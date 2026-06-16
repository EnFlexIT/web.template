import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import { normalizeBaseUrl, selectApi } from "./apiSlice";

type SessionTimes = {
  remainingTime: number;
  expirationTime: number;
  remainingTokenTime?: number;
  tokenExpirationTime?: number;
};

type SessionTimeState = {
  loading: boolean;
  lastCheckedAt: number | null;
  remainingTime: number | null;
  expirationTime: number | null;
  remainingTokenTime: number | null;
  tokenExpirationTime: number | null;
  error: string | null;
};

const initialState: SessionTimeState = {
  loading: false,
  lastCheckedAt: null,
  remainingTime: null,
  expirationTime: null,
  remainingTokenTime: null,
  tokenExpirationTime: null,
  error: null,
};

export const loadSessionTime = createAsyncThunk<
  SessionTimes,
  { silent?: boolean } | undefined,
  { state: RootState }
>("sessionTime/loadSessionTime", async (_, thunkAPI) => {
  const state = thunkAPI.getState();
  const api = selectApi(state);

  const baseUrl = normalizeBaseUrl(api.ip);

  if (!baseUrl) {
    throw new Error("Server-URL fehlt.");
  }

  const res = await fetch(`${baseUrl}/api/user/sessionTime`, {
    method: "GET",
    cache: "no-store",
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(api.authenticationMethod === "jwt" && api.jwt
        ? {
            Authorization: `Bearer ${api.jwt}`,
          }
        : {}),
    },
  });

  if (!res.ok) {
    throw new Error(`SessionTime konnte nicht geladen werden: ${res.status}`);
  }

  return (await res.json()) as SessionTimes;
});

const sessionTimeSlice = createSlice({
  name: "sessionTime",
  initialState,
  reducers: {
    clearSessionTime: (state) => {
      state.loading = false;
      state.lastCheckedAt = null;
      state.remainingTime = null;
      state.expirationTime = null;
      state.remainingTokenTime = null;
      state.tokenExpirationTime = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loadSessionTime.pending, (state) => {
      state.loading = true;
    });

    builder.addCase(loadSessionTime.fulfilled, (state, action) => {
      state.loading = false;
      state.lastCheckedAt = Date.now();
      state.remainingTime = action.payload.remainingTime;
      state.expirationTime = action.payload.expirationTime;
      state.remainingTokenTime = action.payload.remainingTokenTime ?? null;
      state.tokenExpirationTime = action.payload.tokenExpirationTime ?? null;
      state.error = null;
    });

    builder.addCase(loadSessionTime.rejected, (state, action) => {
      state.loading = false;
      state.lastCheckedAt = Date.now();
      state.error = action.error?.message ?? "SessionTime konnte nicht geladen werden.";
    });
  },
});

export const { clearSessionTime } = sessionTimeSlice.actions;

export const selectSessionTime = (state: RootState) => state.sessionTime;

export default sessionTimeSlice.reducer;