// src/redux/slices/attachAuthInterceptors.ts
import axios, { type AxiosError, type AxiosInstance } from "axios";
import { store } from "../store";
import { logoutAsync } from "./apiSlice";

let installed = false;
let inFlightLogout = false;

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

function normalizeUrl(url?: string) {
  return (url ?? "").toLowerCase();
}


function isSoft401Endpoint(url?: string): boolean {
  const u = normalizeUrl(url);

  return (
    u.includes("/api/alive") ||
    u.includes("/api/version") ||
    u.includes("/api/app/settings/get")
  );
}
function isRenewLoginEndpoint(url?: string): boolean {
  const u = normalizeUrl(url);
  return u.includes("/api/user/login");
}

function forceRedirectToLogin() {
  if (typeof window === "undefined") return;

  // wenn du /login route hast
  if (window.location.pathname !== "/login") {
    window.location.replace("/login");
  }
}

function doLogout(reason: "401" | "network") {
  if (inFlightLogout) return;
  inFlightLogout = true;

  store.dispatch(logoutAsync());

  forceRedirectToLogin();

  setTimeout(() => {
    inFlightLogout = false;
  }, 1500);

  console.log(`Logged out due to: ${reason}`);
}

function attach(instance: AxiosInstance) {
  instance.interceptors.response.use(
    (res) => res,
    (err: AxiosError) => {
      const status = err.response?.status;

      // URL aus config holen (OpenAPI/axios hängt sie dort rein)
      const cfg = err.config as any;
      const url: string | undefined =
        cfg?.url || err.response?.config?.url || undefined;

      // 1) Network errors: KEIN Logout (sonst nervig)
      if (isNetworkError(err)) {
        // OPTIONAL: offline state setzen
        // store.dispatch(
        //   setOfflineLocal({ error: "Netzwerkfehler / Server nicht erreichbar" }),
        // );

        return Promise.reject(err);
      }

      // 2) 401 Handling
      if (status === 401) {
        // a) Soft endpoints (alive/version/settings/get) => NICHT logouten
        if (isSoft401Endpoint(url)) {
          return Promise.reject(err);
        }

        // b) Renew/Login endpoint => wenn 401 => Session kaputt => logout
        if (isRenewLoginEndpoint(url)) {
          doLogout("401");
          return Promise.reject(err);
        }

        // c) Alle anderen 401 => logout
        doLogout("401");
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