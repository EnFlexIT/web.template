// src/redux/slices/jwtRenewSlice.ts

import { createAsyncThunk } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Buffer } from "buffer";

import type { RootState } from "../store";

import {
  setJwtLocal,
  logoutAsync,
  setJwtForServer,
  getJwtForServer,
  normalizeBaseUrl,
  loginWithBasic,
} from "./apiSlice";

import { isLogoutFlowActive } from "../../core/authentication/logout/logoutFlowGuard";

const JWT_KEY = "jwt";

const lastRenewAttemptByServer: Record<string, number> = {};

function toBase64(value: string): string {
  return typeof btoa !== "undefined"
    ? btoa(value)
    : Buffer.from(value).toString("base64");
}

function getPropertyValue(
  data: any,
  key: string,
): string | boolean | number | null | undefined {
  const entries = Array.isArray(data?.propertyEntries)
    ? data.propertyEntries
    : [];

  return entries.find((entry: any) => entry?.key === key)?.value;
}

async function fetchServerAuthenticated(
  baseUrl: string,
  jwt: string | null,
): Promise<boolean | null> {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);

  if (!normalizedBaseUrl) {
    return null;
  }

  try {
    const response = await fetch(`${normalizedBaseUrl}/api/app/settings/get`, {
      method: "GET",
      cache: "no-store",
      credentials: "include",
      redirect: "manual",
      headers: {
        Accept: "application/json",
        ...(jwt
          ? {
              Authorization: `Bearer ${jwt}`,
            }
          : {}),
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const authenticatedRaw = getPropertyValue(data, "_Authenticated");

    return (
      authenticatedRaw === true ||
      String(authenticatedRaw).toLowerCase() === "true"
    );
  } catch (error) {
    console.warn("[JWT AUTH CHECK] failed for", normalizedBaseUrl, error);
    return null;
  }
}

async function clearServerJwt(
  baseUrl: string,
  isActiveServer: boolean,
  thunkAPI: any,
): Promise<void> {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);

  if (!normalizedBaseUrl) {
    return;
  }

  await setJwtForServer(normalizedBaseUrl, null);

  if (isActiveServer) {
    await AsyncStorage.removeItem(JWT_KEY);

    /*
     * Wichtig:
     * Nur JWT-Logout.
     * Bei OIDC wird dieser Slice nicht verwendet.
     */
    await thunkAPI.dispatch(logoutAsync());
  }
}

export const renewJwtForSpecificServer = createAsyncThunk<
  {
    renewed: boolean;
    reason: string;
    baseUrl: string;
    newJwt?: string | null;
  },
  {
    baseUrl: string;
    cooldownMs?: number;
    force?: boolean;
  },
  {
    state: RootState;
  }
>(
  "api/renewJwtForSpecificServer",
  async ({ baseUrl, cooldownMs = 10_000, force = true }, thunkAPI) => {
    const state = thunkAPI.getState();

    const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
    const activeBaseUrl = normalizeBaseUrl(state.api.ip);

    const isActiveServer =
      Boolean(normalizedBaseUrl) &&
      Boolean(activeBaseUrl) &&
      normalizedBaseUrl === activeBaseUrl;

    if (isLogoutFlowActive()) {
      return {
        renewed: false,
        reason: "logout-flow-active",
        baseUrl: normalizedBaseUrl,
      };
    }

    if (state.api.isLoggingOut || state.api.isLogoutDialogOpen) {
      return {
        renewed: false,
        reason: "logout-flow-active",
        baseUrl: normalizedBaseUrl,
      };
    }

    if (state.api.isSwitchingServer) {
      return {
        renewed: false,
        reason: "switching-server",
        baseUrl: normalizedBaseUrl,
      };
    }

    if (!normalizedBaseUrl) {
      return {
        renewed: false,
        reason: "no-baseurl",
        baseUrl: normalizedBaseUrl,
      };
    }

    /*
     * Wichtig:
     * Der aktive OIDC-Server darf hier nicht über JWT erneuert werden.
     */
    if (isActiveServer && state.api.authenticationMethod === "oidc") {
      return {
        renewed: false,
        reason: "active-server-is-oidc",
        baseUrl: normalizedBaseUrl,
      };
    }

    const jwt = await getJwtForServer(normalizedBaseUrl);

    if (!jwt) {
      return {
        renewed: false,
        reason: "no-jwt-for-server",
        baseUrl: normalizedBaseUrl,
      };
    }

    /*
     * Falls der aktive Redux-JWT nicht mit Storage übereinstimmt,
     * zuerst synchronisieren.
     */
    if (isActiveServer && state.api.jwt !== jwt) {
      thunkAPI.dispatch(setJwtLocal(jwt));
    }

    const now = Date.now();
    const lastAttempt = lastRenewAttemptByServer[normalizedBaseUrl] ?? 0;

    if (cooldownMs > 0 && now - lastAttempt < cooldownMs) {
      return {
        renewed: false,
        reason: "cooldown",
        baseUrl: normalizedBaseUrl,
      };
    }

    lastRenewAttemptByServer[normalizedBaseUrl] = now;

    /*
     * JWT-Renew läuft bewusst über /api/user/login.
     *
     * Backend-Definition:
     * GET /api/user/login
     * Authorization: Basic ...
     *
     * Altes Verhalten:
     * Username leer, altes JWT als Basic-Password.
     */
    const basic = toBase64(`:${jwt}`);

    try {
      console.log("[JWT RENEW] calling login endpoint:", {
        baseUrl: normalizedBaseUrl,
        force,
      });

      const { response, bearerToken: newJwt } = await loginWithBasic({
        baseUrl: normalizedBaseUrl,
        basic,
      });

      if (newJwt) {
        if (newJwt === jwt) {
          return {
            renewed: false,
            reason: "same-token",
            baseUrl: normalizedBaseUrl,
            newJwt,
          };
        }

        await setJwtForServer(normalizedBaseUrl, newJwt);

        if (isActiveServer) {
          thunkAPI.dispatch(setJwtLocal(newJwt));
          await AsyncStorage.setItem(JWT_KEY, newJwt);

          console.log("[JWT RENEW] active JWT updated:", normalizedBaseUrl);
        }

        return {
          renewed: true,
          reason: force ? "forced-renewed" : "renewed",
          baseUrl: normalizedBaseUrl,
          newJwt,
        };
      }

      if (response.status === 401) {
        const authenticated = await fetchServerAuthenticated(
          normalizedBaseUrl,
          jwt,
        );

        if (authenticated === false) {
          await clearServerJwt(normalizedBaseUrl, isActiveServer, thunkAPI);

          return {
            renewed: false,
            reason: "unauthenticated-cleared",
            baseUrl: normalizedBaseUrl,
          };
        }

        return {
          renewed: false,
          reason: "401-no-token",
          baseUrl: normalizedBaseUrl,
        };
      }

      const authenticated = await fetchServerAuthenticated(
        normalizedBaseUrl,
        jwt,
      );

      if (authenticated === false) {
        await clearServerJwt(normalizedBaseUrl, isActiveServer, thunkAPI);

        return {
          renewed: false,
          reason: "unauthenticated-cleared",
          baseUrl: normalizedBaseUrl,
        };
      }

      console.log(
        "[JWT RENEW] login endpoint returned no token:",
        normalizedBaseUrl,
        response.status,
      );

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
  Array<{
    renewed: boolean;
    reason: string;
    baseUrl: string;
    newJwt?: string | null;
  }>,
  {
    cooldownMs?: number;
    force?: boolean;
  } | undefined,
  {
    state: RootState;
  }
>(
  "api/renewAllServerJwtsIfNeeded",
  async ({ cooldownMs = 10_000, force = true } = {}, thunkAPI) => {
    if (isLogoutFlowActive()) {
      return [];
    }

    const state = thunkAPI.getState();

    const activeBaseUrl = normalizeBaseUrl(state.api.ip);
    const servers = state.servers.servers ?? [];

    /*
     * Wichtig:
     * Der aktive Server muss auch dann geprüft werden,
     * wenn er nicht in der Serverliste steht.
     */
    const uniqueBaseUrls = Array.from(
      new Set(
        [
          activeBaseUrl,
          ...servers.map((server) => normalizeBaseUrl(server.baseUrl)),
        ].filter(Boolean),
      ),
    );

    const results = await Promise.all(
      uniqueBaseUrls.map((currentBaseUrl) =>
        thunkAPI
          .dispatch(
            renewJwtForSpecificServer({
              baseUrl: currentBaseUrl,
              cooldownMs,
              force,
            }),
          )
          .unwrap(),
      ),
    );

    return results;
  },
);

export const renewJwtIfNeeded = createAsyncThunk<
  {
    renewed: boolean;
    reason: string;
  },
  {
    cooldownMs?: number;
    force?: boolean;
  } | undefined,
  {
    state: RootState;
  }
>(
  "api/renewJwtIfNeeded",
  async ({ cooldownMs = 10_000, force = true } = {}, thunkAPI) => {
    if (isLogoutFlowActive()) {
      return {
        renewed: false,
        reason: "logout-flow-active",
      };
    }

    const state = thunkAPI.getState();
    const activeBaseUrl = normalizeBaseUrl(state.api.ip);

    if (state.api.isLoggingOut || state.api.isLogoutDialogOpen) {
      return {
        renewed: false,
        reason: "logout-flow-active",
      };
    }

    if (!activeBaseUrl) {
      return {
        renewed: false,
        reason: "no-baseurl",
      };
    }

    if (state.api.authenticationMethod === "oidc") {
      return {
        renewed: false,
        reason: "active-server-is-oidc",
      };
    }

    if (!state.api.jwt) {
      return {
        renewed: false,
        reason: "no-active-jwt",
      };
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