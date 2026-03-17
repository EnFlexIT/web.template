// src/redux/slices/jwtRenewSlice.ts
import { createAsyncThunk } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { RootState } from "../store";
import {
  setJwtLocal,
  logoutAsync,
  setJwtForServer,
  getJwtForServer,
  normalizeBaseUrl,
} from "./apiSlice";

const JWT_KEY = "jwt";
const lastRenewAttemptByServer: Record<string, number> = {};

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

export const renewJwtForSpecificServer = createAsyncThunk<
  { renewed: boolean; reason: string; baseUrl: string; newJwt?: string | null },
  { baseUrl: string; cooldownMs?: number; force?: boolean },
  { state: RootState }
>(
  "api/renewJwtForSpecificServer",
  async (
    { baseUrl, cooldownMs = 10_000, force = true },
    thunkAPI,
  ) => {
    const state = thunkAPI.getState();
    const normalizedBaseUrl = normalizeBaseUrl(baseUrl);

    console.log("[JWT RENEW] --------------------------------------");
    console.log("[JWT RENEW] checking server:", normalizedBaseUrl);
    console.log("[JWT RENEW] active redux server:", state.api.ip);
    console.log("[JWT RENEW] force:", force);

    if (state.api.isSwitchingServer) {
      console.log("[JWT RENEW] skipped because switching server");
      return {
        renewed: false,
        reason: "switching-server",
        baseUrl: normalizedBaseUrl,
      };
    }

    if (!normalizedBaseUrl) {
      console.log("[JWT RENEW] skipped because baseUrl empty");
      return {
        renewed: false,
        reason: "no-baseurl",
        baseUrl: normalizedBaseUrl,
      };
    }

    const jwt = await getJwtForServer(normalizedBaseUrl);

    console.log("[JWT RENEW] jwt exists:", !!jwt);

    if (!jwt) {
      console.log("[JWT RENEW] no jwt stored for server:", normalizedBaseUrl);
      return {
        renewed: false,
        reason: "no-jwt-for-server",
        baseUrl: normalizedBaseUrl,
      };
    }

    if (state.api.ip === normalizedBaseUrl && state.api.jwt !== jwt) {
      console.log("[JWT RENEW] syncing redux jwt from storage for active server");
      thunkAPI.dispatch(setJwtLocal(jwt));
    }

    const now = Date.now();
    const lastAttempt = lastRenewAttemptByServer[normalizedBaseUrl] ?? 0;

    if (cooldownMs > 0 && now - lastAttempt < cooldownMs) {
      console.log("[JWT RENEW] skipped because cooldown active");
      return {
        renewed: false,
        reason: "cooldown",
        baseUrl: normalizedBaseUrl,
      };
    }

    lastRenewAttemptByServer[normalizedBaseUrl] = now;

    const basic = toBase64(`:${jwt}`);
    const renewUrl = `${normalizedBaseUrl}/api/user/login`;

    console.log("[JWT RENEW] sending request to:", renewUrl);

    try {
      const res = await fetch(renewUrl, {
        method: "GET",
        headers: {
          Authorization: `Basic ${basic}`,
          Accept: "application/json",
        },
      });

      console.log("[JWT RENEW] response status:", res.status, "for", normalizedBaseUrl);

      const hdr =
        res.headers.get("www-authenticate") ??
        res.headers.get("WWW-Authenticate") ??
        res.headers.get("authorization") ??
        res.headers.get("Authorization");

      console.log("[JWT RENEW] header token exists:", !!hdr);

      const bodyText = await res.text();
      const newJwt = extractBearerToken(hdr) ?? extractBearerToken(bodyText);

      console.log("[JWT RENEW] extracted new jwt exists:", !!newJwt);

      if (newJwt) {
        if (newJwt === jwt) {
          console.log("[JWT RENEW] same token returned for:", normalizedBaseUrl);
          return {
            renewed: false,
            reason: "same-token",
            baseUrl: normalizedBaseUrl,
            newJwt,
          };
        }

        await setJwtForServer(normalizedBaseUrl, newJwt);
        console.log("[JWT RENEW] stored new token for:", normalizedBaseUrl);

        if (state.api.ip === normalizedBaseUrl) {
          thunkAPI.dispatch(setJwtLocal(newJwt));
          await AsyncStorage.setItem(JWT_KEY, newJwt);
          console.log("[JWT RENEW] updated active redux jwt for:", normalizedBaseUrl);
        }

        return {
          renewed: true,
          reason: force ? "forced-renewed" : "renewed",
          baseUrl: normalizedBaseUrl,
          newJwt,
        };
      }

      if (res.status === 401) {
        console.log("[JWT RENEW] 401 without token for:", normalizedBaseUrl);
        return {
          renewed: false,
          reason: "401-no-token",
          baseUrl: normalizedBaseUrl,
        };
      }

      console.log("[JWT RENEW] no token found in response for:", normalizedBaseUrl);
      return {
        renewed: false,
        reason: "no-token-in-response",
        baseUrl: normalizedBaseUrl,
      };
    } catch (error) {
      console.warn("[JWT RENEW] failed for", normalizedBaseUrl, error);
      return {
        renewed: false,
        reason: "error",
        baseUrl: normalizedBaseUrl,
      };
    }
  },
);

export const renewAllServerJwtsIfNeeded = createAsyncThunk<
  Array<{ renewed: boolean; reason: string; baseUrl: string; newJwt?: string | null }>,
  { cooldownMs?: number; force?: boolean } | undefined,
  { state: RootState }
>(
  "api/renewAllServerJwtsIfNeeded",
  async (
    { cooldownMs = 10_000, force = true } = {},
    thunkAPI,
  ) => {
    const state = thunkAPI.getState();
    const servers = state.servers.servers ?? [];

    console.log("[JWT RENEW ALL] ==================================");
    console.log("[JWT RENEW ALL] redux servers:", servers);

    const uniqueBaseUrls = Array.from(
      new Set(
        servers
          .map((server) => normalizeBaseUrl(server.baseUrl))
          .filter(Boolean),
      ),
    );

    console.log("[JWT RENEW ALL] unique baseUrls:", uniqueBaseUrls);

    const results = await Promise.all(
      uniqueBaseUrls.map((baseUrl) =>
        thunkAPI
          .dispatch(
            renewJwtForSpecificServer({
              baseUrl,
              cooldownMs,
              force,
            }),
          )
          .unwrap(),
      ),
    );

    console.log("[JWT RENEW ALL] results:", results);
    console.log("[JWT RENEW ALL] ==================================");

    return results;
  },
);

export const renewJwtIfNeeded = createAsyncThunk<
  { renewed: boolean; reason: string },
  { cooldownMs?: number; force?: boolean } | undefined,
  { state: RootState }
>(
  "api/renewJwtIfNeeded",
  async (
    { cooldownMs = 10_000, force = true } = {},
    thunkAPI,
  ) => {
    const state = thunkAPI.getState();
    const activeBaseUrl = state.api.ip;

    if (!activeBaseUrl) {
      return { renewed: false, reason: "no-baseurl" };
    }

    const result = await thunkAPI
      .dispatch(
        renewJwtForSpecificServer({
          baseUrl: activeBaseUrl,
          cooldownMs,
          force,
        }),
      )
      .unwrap();

    return {
      renewed: result.renewed,
      reason: result.reason,
    };
  },
);