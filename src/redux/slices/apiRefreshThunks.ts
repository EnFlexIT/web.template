// src/redux/slices/apiRefreshThunks.ts
import { createAsyncThunk } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { RootState } from "../store";
import { setJwtLocal, logout } from "./apiSlice";
import { getJwtRemainingMs } from "../../util/jwtTime";

const JWT_KEY = "jwt";
let lastRenewAttempt = 0;

function extractBearerToken(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const m = value.match(/Bearer\s+(.+)/i);
  return m?.[1]?.trim() ?? null;
}

function toBase64(str: string) {
  return typeof btoa !== "undefined"
    ? btoa(str)
    : Buffer.from(str).toString("base64");
}

function isUnauthorized(error: any): boolean {
  return error?.response?.status === 401 || error?.status === 401;
}

export const renewJwtIfNeeded = createAsyncThunk<
  { renewed: boolean; reason: string },
  { thresholdMs?: number; cooldownMs?: number; force?: boolean },
  { state: RootState }
>(
  "api/renewJwtIfNeeded",
  async ({ thresholdMs = 35_000, cooldownMs = 15_000, force = false } = {}, thunkAPI) => {
    const state = thunkAPI.getState();
    const jwt = state.api.jwt;
    const baseUrl = state.api.ip;

    if (!jwt) return { renewed: false, reason: "no-jwt" };
    if (!baseUrl) return { renewed: false, reason: "no-baseurl" };

    const remaining = getJwtRemainingMs(jwt);
    if (!Number.isFinite(remaining) || remaining <= 0) {
      await AsyncStorage.removeItem(JWT_KEY);
      thunkAPI.dispatch(logout());
      return { renewed: false, reason: "expired" };
    }

    
    if (!force && remaining > thresholdMs) {
      return { renewed: false, reason: "not-needed" };
    }

   const now = Date.now();
if (cooldownMs > 0 && now - lastRenewAttempt < cooldownMs) {
  return { renewed: false, reason: "cooldown" };
}
lastRenewAttempt = now;

    const basic = toBase64(`:${jwt}`);

    try {
      const res = await fetch(`${baseUrl}/api/user/login`, {
        method: "GET",
        headers: {
          Authorization: `Basic ${basic}`,
          Accept: "application/json",
        },
        credentials: "include",
      });

      if (res.status === 401) {
        await AsyncStorage.removeItem(JWT_KEY);
        thunkAPI.dispatch(logout());
        return { renewed: false, reason: "401-logout" };
      }

      const hdr =
        res.headers.get("www-authenticate") ??
        res.headers.get("WWW-Authenticate") ??
        res.headers.get("authorization") ??
        res.headers.get("Authorization");

      const bodyText = await res.text();

      const newJwt = extractBearerToken(hdr) ?? extractBearerToken(bodyText);

      if (!newJwt) return { renewed: false, reason: "no-token-in-response" };
      if (newJwt === jwt) return { renewed: false, reason: "same-token" };

      thunkAPI.dispatch(setJwtLocal(newJwt));
      await AsyncStorage.setItem(JWT_KEY, newJwt);

      return { renewed: true, reason: force ? "forced-renewed" : "renewed" };
    } catch (error: any) {
      if (isUnauthorized(error)) {
        await AsyncStorage.removeItem(JWT_KEY);
        thunkAPI.dispatch(logout());
        return { renewed: false, reason: "401-logout" };
      }
      console.warn("[JWT] Renew failed", error);
      return { renewed: false, reason: "error" };
    }
  }
);