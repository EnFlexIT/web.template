// src/redux/slices/attachAuthInterceptors.ts
import axios, { type AxiosError, type AxiosInstance } from "axios";
import { store } from "../store";
import { logout } from "./apiSlice";

// import { setOfflineLocal } from "./connectivitySlice";

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

function forceRedirectToLogin() {
  if (typeof window !== "undefined") {
    if (window.location.pathname !== "/login") {
      window.location.replace("/login");
    }
  }
}


function shouldIgnore401(url?: string): boolean {
  if (!url) return false;

  // normalize (relative/absolute)
  const u = url.toLowerCase();

  
  const ignore = [
    "/api/alive",
    "/api/app/settings/get",
    "/api/user/login",
    "/dc/menu",
  ];

  return ignore.some((p) => u.includes(p));
}

function doLogout(reason: "401") {
  if (inFlightLogout) return;
  inFlightLogout = true;

  store.dispatch(logout());
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
      const network = isNetworkError(err);

      const cfg = err.config as any;
      const url: string | undefined =
        cfg?.url || err.response?.config?.url || undefined;

      if (network) {
      
        return Promise.reject(err);
      }

      if (status === 401) {
        if (!shouldIgnore401(url)) {
          doLogout("401");
        }
      }

      return Promise.reject(err);
    }
  );
}


export function attachAuthInterceptors(http: AxiosInstance) {
  if (installed) return;
  installed = true;

  console.log("Auth interceptors installed");

  attach(http);
  attach(axios);
}