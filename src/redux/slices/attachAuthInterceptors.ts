// src/redux/slices/attachAuthInterceptors.ts
import axios, { type AxiosError, type AxiosInstance } from "axios";
import { store } from "../store";
import { logout } from "./apiSlice";

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
  // nur Web hat window + URL
  if (typeof window !== "undefined") {
    // wenn du /login als Route hast:
    if (window.location.pathname !== "/login") {
      window.location.replace("/login");
    }
  }
}

function doLogout(reason: "401" | "network") {
  if (inFlightLogout) return;
  inFlightLogout = true;

  // UI-State sauber
  store.dispatch(logout());

  // Web: sofort zur Login-Seite (ohne refresh nötig)
  forceRedirectToLogin();

  // nach kurzem Delay wieder erlauben (damit Login wieder möglich ist)
  setTimeout(() => {
    inFlightLogout = false;
  }, 1500);

  console.log(` Logged out due to: ${reason}`);
}

function attach(instance: AxiosInstance) {
  instance.interceptors.response.use(
    (res) => res,
    (err: AxiosError) => {
      const status = err.response?.status;
      const network = isNetworkError(err);

      if (status === 401) doLogout("401");
      else if (network) doLogout("network");

      return Promise.reject(err);
    }
  );
}

/**
 * Installiert Interceptors NUR 1x.
 * - http: eure gemeinsame Instanz
 * - axios: global (OpenAPI nutzt oft globalAxios)
 */
export function attachAuthInterceptors(http: AxiosInstance) {
  if (installed) return;
  installed = true;

  console.log(" Auth interceptors installed");

  attach(http);
  attach(axios);
}
