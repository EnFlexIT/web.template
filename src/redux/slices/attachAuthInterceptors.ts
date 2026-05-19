// src/redux/slices/attachAuthInterceptors.ts
import axios, { type AxiosError, type AxiosInstance } from "axios";
import { store } from "../store";
import { logoutAsync, selectAuthenticationMethod } from "./apiSlice";
import { isLogoutFlowActive } from "./logoutFlowGuard";

let installed = false;
let inFlightLogout = false;

function normalizeUrl(url?: string) {
  return (url ?? "").toLowerCase();
}

function isNetworkError(err: AxiosError) {
  return (
    !err.response &&
    (err.code === "ERR_NETWORK" ||
      String(err.message).includes("Network Error") ||
      String(err.message).includes("ERR_CONNECTION_REFUSED") ||
      String(err.message).includes("Failed to fetch") ||
      String(err.message).includes("ERR_FAILED"))
  );
}

function isSoftEndpoint(url?: string): boolean {
  const u = normalizeUrl(url);

  return (
    u.includes("/api/alive") ||
    u.includes("/api/version") ||
    u.includes("/api/app/settings/get")
  );
}

function isRenewLoginEndpoint(url?: string): boolean {
  return normalizeUrl(url).includes("/api/user/login");
}

function getAuthMethod(): string | undefined {
  const state = store.getState();
  return selectAuthenticationMethod(state as any);
}

function doLocalLogoutOnly(reason: "401" | "renew-401") {
  if (inFlightLogout) return;
  if (isLogoutFlowActive()) return;

  inFlightLogout = true;

  store.dispatch(logoutAsync());

  setTimeout(() => {
    inFlightLogout = false;
  }, 1500);

  console.log(`[AUTH INTERCEPTOR] Local logout only: ${reason}`);
}

function attach(instance: AxiosInstance) {
  instance.interceptors.response.use(
    (res) => res,
    (err: AxiosError) => {
      const status = err.response?.status;

      const cfg = err.config as any;
      const url: string | undefined =
        cfg?.url || err.response?.config?.url || undefined;

      const authMethod = getAuthMethod();
      const isOidc = authMethod === "oidc" || authMethod === "unknown";

      /*
       * Network Error:
       * Kein Logout, kein Redirect, kein Popup.
       */
      if (isNetworkError(err)) {
        return Promise.reject(err);
      }

      /*
       * Soft Endpoints:
       * alive/version/settings/get dürfen niemals Logout-Popup auslösen.
       */
      if (isSoftEndpoint(url)) {
        return Promise.reject(err);
      }

      /*
       * OIDC:
       * 401 heißt Session abgelaufen/weg.
       * Kein forceRedirect.
       * Kein Popup.
       * Nur lokalen State bereinigen.
       */
      if (status === 401 && isOidc) {
        doLocalLogoutOnly("401");
        return Promise.reject(err);
      }

      /*
       * JWT Renew/Login:
       * bei Basic/JWT darf 401 lokalen Logout machen.
       */
      if (status === 401 && isRenewLoginEndpoint(url)) {
        doLocalLogoutOnly("renew-401");
        return Promise.reject(err);
      }

      /*
       * Alle anderen 401:
       * Nur lokal ausloggen, aber NIEMALS window.location.replace().
       */
      if (status === 401) {
        doLocalLogoutOnly("401");
        return Promise.reject(err);
      }

      return Promise.reject(err);
    },
  );
}

export function attachAuthInterceptors(http: AxiosInstance) {
  if (installed) return;
  installed = true;

  console.log("Auth interceptors installed");

  attach(http);
  attach(axios);
}