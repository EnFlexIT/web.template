import { createAsyncThunk } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { RootState } from "../store";
import {
  setJwtLocal,
  logoutAsync,
  setJwtForServer,
  getJwtForServer,
} from "./apiSlice";
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

export const renewJwtIfNeeded = createAsyncThunk<
  { renewed: boolean; reason: string },
  { thresholdMs?: number; cooldownMs?: number; force?: boolean },
  { state: RootState }
>(
  "api/renewJwtIfNeeded",
  async (
    { thresholdMs = 35_000, cooldownMs = 15_000, force = false } = {},
    thunkAPI,
  ) => {
    const state = thunkAPI.getState();

    if (state.api.isSwitchingServer) {
      return { renewed: false, reason: "switching-server" };
    }

    const baseUrl = state.api.ip;
    if (!baseUrl) {
      return { renewed: false, reason: "no-baseurl" };
    }

    // Wichtig: immer den JWT holen, der wirklich zu DIESEM Server gehört
    const jwt = await getJwtForServer(baseUrl);

    if (!jwt) {
      return { renewed: false, reason: "no-jwt-for-server" };
    }

    // Falls Redux-State noch einen alten JWT hält, direkt korrigieren
    if (jwt !== state.api.jwt) {
      thunkAPI.dispatch(setJwtLocal(jwt));
    }

    const remaining = getJwtRemainingMs(jwt);

    if (!Number.isFinite(remaining) || remaining <= 0) {
      await setJwtForServer(baseUrl, null);
      await AsyncStorage.removeItem(JWT_KEY);
      thunkAPI.dispatch(logoutAsync());
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

    // Euer Backend scheint Renew über Basic ":" + jwt zu machen
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

      const hdr =
        res.headers.get("www-authenticate") ??
        res.headers.get("WWW-Authenticate") ??
        res.headers.get("authorization") ??
        res.headers.get("Authorization");

      const bodyText = await res.text();

      // Erst den Token extrahieren, dann den Status bewerten
      const newJwt = extractBearerToken(hdr) ?? extractBearerToken(bodyText);

      if (newJwt) {
        if (newJwt === jwt) {
          return { renewed: false, reason: "same-token" };
        }

        thunkAPI.dispatch(setJwtLocal(newJwt));
        await AsyncStorage.setItem(JWT_KEY, newJwt);
        await setJwtForServer(baseUrl, newJwt);

        return {
          renewed: true,
          reason: force ? "forced-renewed" : "renewed",
        };
      }

      if (res.status === 401) {
        // Wichtig:
        // Nicht global alles kaputt machen, sondern nur sagen:
        // Für diesen Server konnte nicht erneuert werden.
        return { renewed: false, reason: "401-no-token" };
      }

      return { renewed: false, reason: "no-token-in-response" };
    } catch (error: any) {
      console.warn("[JWT] Renew failed", baseUrl, error);
      return { renewed: false, reason: "error" };
    }
  },
);