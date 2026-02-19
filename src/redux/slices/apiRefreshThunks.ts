import { createAsyncThunk } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootState } from "../store";
import { setJwtLocal } from "./apiSlice";
import { getJwtRemainingMs } from "../../util/jwtTime";
const jwtKey = "jwt" as const;

function extractJwtFromWwwAuthenticate(headers: any): string | null {
  const raw =
    headers?.["www-authenticate"] ??
    headers?.["WWW-Authenticate"] ??
    headers?.wwwAuthenticate ??
    headers?.WwwAuthenticate;

  if (!raw || typeof raw !== "string") return null;
  // erwartet: "Bearer <token>"
  const parts = raw.split(" ");
  if (parts.length < 2) return null;
  return parts[1];
}

function getStoredCredentialsWeb(): { username: string; password: string } | null {
  try {
    const u = sessionStorage.getItem("auth_user") ?? "";
    const p = sessionStorage.getItem("auth_pass") ?? "";
    if (!u || !p) return null;
    return { username: u, password: p };
  } catch {
    return null;
  }
}

export const refreshJwtViaLogin = createAsyncThunk<string | null>(
  "api/refreshJwtViaLogin",
  async (_, thunkAPI) => {
    const state = thunkAPI.getState() as RootState;
    const api = state.api;

    const creds = getStoredCredentialsWeb();
    if (!creds) return null;

   
    const resp = await api.awb_rest_api.userApi.loginUser({
      auth: { username: creds.username, password: creds.password },
    });

    if (resp.status !== 200) return null;

    const newJwt = extractJwtFromWwwAuthenticate(resp.headers);
    if (!newJwt) return null;

    thunkAPI.dispatch(setJwtLocal(newJwt));
    await AsyncStorage.setItem(jwtKey, newJwt);

    return newJwt;
  }
);

let lastRefreshAt = 0;

export const refreshJwtIfNeeded = createAsyncThunk<
  void,
  { thresholdMs?: number; cooldownMs?: number }
>(
  "api/refreshJwtIfNeeded",
  async ({ thresholdMs = 2 * 60 * 1000, cooldownMs = 10 * 1000 } = {}, thunkAPI) => {
    const state = thunkAPI.getState() as RootState;
    const jwt = state.api.jwt;
    if (!jwt) return;

    const remaining = getJwtRemainingMs(jwt);
    if (remaining > thresholdMs) return;

    const now = Date.now();
    if (now - lastRefreshAt < cooldownMs) return;
    lastRefreshAt = now;

    await thunkAPI.dispatch(refreshJwtViaLogin());
  }
);
