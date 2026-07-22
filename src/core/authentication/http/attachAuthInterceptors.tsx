import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";

export type AuthenticationMethod =
  | "jwt"
  | "oidc"
  | "unknown"
  | string
  | undefined;

type AuthInterceptorOptions = {
  getAuthenticationMethod: () => AuthenticationMethod;
  performLocalLogout: () => void;
  isLogoutFlowActive?: () => boolean;
};

let installed = false;
let inFlightLogout = false;

function normalizeUrl(url?: string): string {
  return (url ?? "").toLowerCase();
}

function isNetworkError(error: AxiosError): boolean {
  return (
    !error.response &&
    (error.code === "ERR_NETWORK" ||
      String(error.message).includes("Network Error") ||
      String(error.message).includes("ERR_CONNECTION_REFUSED") ||
      String(error.message).includes("Failed to fetch") ||
      String(error.message).includes("ERR_FAILED"))
  );
}

function isSoftEndpoint(url?: string): boolean {
  const normalizedUrl = normalizeUrl(url);

  return (
    normalizedUrl.includes("/api/alive") ||
    normalizedUrl.includes("/api/version") ||
    normalizedUrl.includes("/api/app/settings/get") ||
    normalizedUrl.includes("/dc/") ||
    normalizedUrl.includes("/j_security_check")
  );
}

function isRenewLoginEndpoint(url?: string): boolean {
  return normalizeUrl(url).includes("/api/user/login");
}

function doLocalLogoutOnly(
  reason: "401" | "renew-401",
  options: AuthInterceptorOptions,
): void {
  if (inFlightLogout) return;

  if (options.isLogoutFlowActive?.()) {
    return;
  }

  inFlightLogout = true;

  options.performLocalLogout();

  setTimeout(() => {
    inFlightLogout = false;
  }, 10000);

  console.log(`[AUTH INTERCEPTOR] Local logout only: ${reason}`);
}

function attach(
  instance: AxiosInstance,
  options: AuthInterceptorOptions,
): void {
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // OIDC verwendet Session-Cookies.
      // JWT verwendet weiterhin den Authorization-Header.
      config.withCredentials = true;

      return config;
    },
  );

  instance.interceptors.response.use(
    (response) => response,

    (error: AxiosError) => {
      const status = error.response?.status;

      const config = error.config as
        | (InternalAxiosRequestConfig & { url?: string })
        | undefined;

      const url =
        config?.url ?? error.response?.config?.url ?? undefined;

      const authenticationMethod =
        options.getAuthenticationMethod();

      const isOidc =
        authenticationMethod === "oidc" ||
        authenticationMethod === "unknown";

      // Netzwerkfehler dürfen keinen Logout auslösen.
      if (isNetworkError(error)) {
        return Promise.reject(error);
      }

      // Technische Prüf-Endpunkte dürfen keinen Logout auslösen.
      if (isSoftEndpoint(url)) {
        return Promise.reject(error);
      }

      // OIDC-401 wird momentan ignoriert, damit eine gültige
      // Session nicht lokal beendet wird.
      if (status === 401 && isOidc) {
        console.log(
          "[AUTH INTERCEPTOR] Ignore OIDC 401:",
          url,
        );

        return Promise.reject(error);
      }

      // Fehlgeschlagenes JWT-Renew/Login.
      if (status === 401 && isRenewLoginEndpoint(url)) {
        doLocalLogoutOnly("renew-401", options);

        return Promise.reject(error);
      }

      // Allgemeiner JWT-401.
      if (status === 401 && !isOidc) {
        doLocalLogoutOnly("401", options);

        return Promise.reject(error);
      }

      return Promise.reject(error);
    },
  );
}

export function attachAuthInterceptors(
  http: AxiosInstance,
  options: AuthInterceptorOptions,
): void {
  if (installed) return;

  installed = true;

  console.log("Auth interceptors installed");

  attach(http, options);

  if (http !== axios) {
    attach(axios, options);
  }
}