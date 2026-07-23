import type { AuthMethod } from "../../redux/slices/apiSlice";
import type { ServerCheckResult } from "./types";

const REACHABLE_CACHE_MS = 10_000;
const AUTH_CACHE_MS = 10_000;

let lastReachableKey: string | null = null;
let lastReachableResult: ServerCheckResult | null = null;
let lastReachableAt = 0;

let lastAuthKey: string | null = null;
let lastAuthResult: ServerAuthInfo | null = null;
let lastAuthAt = 0;

export type WebAppReleaseType =
  | "PRODUCTION_RELEASE"
  | "TEST_RELEASE"
  | "UNKNOWN";

export type ServerAuthInfo = {
  authenticated: boolean;
  authenticationMethod: AuthMethod;
  oidcBearer: string | null;
  sessionInvalid: boolean;
  webAppReleaseType: WebAppReleaseType;
};

export function normalizeBaseUrl(url: string) {
  return (url ?? "").toString().trim().replace(/\/+$/, "");
}

export function normalizeName(name: string) {
  return (name ?? "").toString().trim();
}

function isRedirectStatus(status?: number): boolean {
  return (
    status === 301 ||
    status === 302 ||
    status === 303 ||
    status === 307 ||
    status === 308
  );
}

function isReachableStatus(status?: number): boolean {
  if (status == null) return false;

  return status >= 200 && status < 500;
}

function getReachableCacheKey(
  base: string,
  jwt?: string | null,
  authenticationMethod: AuthMethod = "unknown",
) {
  return `${base}|${authenticationMethod}|${jwt ? "jwt" : "no-jwt"}`;
}

function setReachableCache(
  key: string,
  result: ServerCheckResult,
): ServerCheckResult {
  lastReachableKey = key;
  lastReachableResult = result;
  lastReachableAt = Date.now();

  return result;
}

function getAuthCacheKey(base: string, jwt: string | null) {
  return `${base}|${jwt ? "jwt" : "no-jwt"}`;
}

function setAuthCache(key: string, result: ServerAuthInfo): ServerAuthInfo {
  lastAuthKey = key;
  lastAuthResult = result;
  lastAuthAt = Date.now();

  return result;
}

async function fetchReachable(
  url: string,
  jwt?: string | null,
  authenticationMethod: AuthMethod = "unknown",
): Promise<Response> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (authenticationMethod === "jwt" && jwt) {
    headers.Authorization = `Bearer ${jwt}`;
  }

  return fetch(url, {
    method: "GET",
    mode: "cors",
    cache: "no-store",
    credentials: "include",
    redirect: "manual",
    headers,
  });
}

export async function checkServerReachable(
  baseUrl: string,
  jwt?: string | null,
  authenticationMethod: AuthMethod = "unknown",
  options?: { force?: boolean },
): Promise<ServerCheckResult> {
  const base = normalizeBaseUrl(baseUrl);

  if (base === "http://localhost:8081") {
    return {
      ok: false,
      message: "Expo frontend is not backend.",
    };
  }

  if (!base) {
    return {
      ok: false,
      message: "Server-URL fehlt.",
    };
  }

  const force = options?.force === true;

  const cacheKey = getReachableCacheKey(base, jwt, authenticationMethod);
  const now = Date.now();

  if (
    !force &&
    lastReachableKey === cacheKey &&
    lastReachableResult &&
    now - lastReachableAt < REACHABLE_CACHE_MS
  ) {
    return lastReachableResult;
  }

  try {
    const res = await fetchReachable(
      `${base}/api/alive`,
      jwt,
      authenticationMethod,
    );

    if (
      isReachableStatus(res.status) ||
      isRedirectStatus(res.status) ||
      res.type === "opaqueredirect"
    ) {
      return setReachableCache(cacheKey, { ok: true });
    }
  } catch {
    // Wird unten als nicht erreichbar zurückgegeben.
  }

  return setReachableCache(cacheKey, {
    ok: false,
    message: "Server nicht erreichbar. Bitte andere URL verwenden.",
  });
}

function normalizeWebAppReleaseType(value: unknown): WebAppReleaseType {
  if (value === "TEST_RELEASE") return "TEST_RELEASE";
  if (value === "PRODUCTION_RELEASE") return "PRODUCTION_RELEASE";
  return "UNKNOWN";
}

export function parseServerSettings(
  data: any,
  jwt: string | null,
): ServerAuthInfo {
  const entries = Array.isArray(data?.propertyEntries)
    ? data.propertyEntries
    : [];

  const releaseTypeRaw = entries.find(
    (entry: any) => entry?.key === "_WebAppReleaseType",
  )?.value;

  const webAppReleaseType =
  entries.find((entry: any) => entry?.key === "_WebAppReleaseType")?.value ??
  "PRODUCTION_RELEASE";

  console.log("APP SETTINGS RESPONSE:", data);
  console.log("releaseTypeRaw:", releaseTypeRaw);
  console.log("webAppReleaseType:", webAppReleaseType);

  const authCfg =
    entries.find(
      (entry: any) => entry?.key === "_ServerWideSecurityConfiguration",
    )?.value ??
    entries.find((entry: any) => entry?.key === "_AuthenticationMethod")?.value;

  const authenticatedRaw = entries.find(
    (entry: any) => entry?.key === "_Authenticated",
  )?.value;

  const oidcBearer = entries.find(
    (entry: any) =>
      entry?.key === "_oidc.bearer" || entry?.key === "_oidc.access_token",
  )?.value;

  const hasSessionId = entries.some(
    (entry: any) => entry?.key === "_session.id",
  );

  const hasSessionPathParameter = entries.some(
    (entry: any) => entry?.key === "_session.pathParameter",
  );

  const hasOidcParameter = entries.some((entry: any) => {
    const key = String(entry?.key ?? "").toLowerCase();
    return key.startsWith("_oidc.");
  });

  const authenticated =
    typeof authenticatedRaw === "boolean"
      ? authenticatedRaw
      : String(authenticatedRaw).toLowerCase() === "true";

  let authenticationMethod: AuthMethod = "unknown";

  if (authCfg === "OIDCSecurityHandler") {
    authenticationMethod = "oidc";
  } else if (authCfg === "JwtSingleUserSecurityHandler") {
    authenticationMethod = "jwt";
  } else if (
    authenticatedRaw !== undefined ||
    oidcBearer ||
    hasSessionId ||
    hasSessionPathParameter ||
    hasOidcParameter
  ) {
    authenticationMethod = "oidc";
  } else if (jwt) {
    authenticationMethod = "jwt";
  }

 return {
  authenticated,
  authenticationMethod,
  oidcBearer: typeof oidcBearer === "string" ? oidcBearer : null,
  sessionInvalid: false,
  webAppReleaseType,
};
}

export async function checkServerAuthenticated(
  baseUrl: string,
  jwt: string | null,
  options?: { force?: boolean },
): Promise<ServerAuthInfo> {
  const base = normalizeBaseUrl(baseUrl);

  const fallbackResult: ServerAuthInfo = {
    authenticated: false,
    authenticationMethod: "unknown",
    oidcBearer: null,
    sessionInvalid: false,
    webAppReleaseType: "UNKNOWN",
  };

  if (!base) {
    return fallbackResult;
  }

  const force = options?.force === true;

  const cacheKey = getAuthCacheKey(base, jwt);
  const now = Date.now();

  if (
    !force &&
    lastAuthKey === cacheKey &&
    lastAuthResult &&
    now - lastAuthAt < AUTH_CACHE_MS
  ) {
    return lastAuthResult;
  }

  try {
    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    if (jwt) {
      headers.Authorization = `Bearer ${jwt}`;
    }

    const res = await fetch(`${base}/api/app/settings/get`, {
      method: "GET",
      mode: "cors",
      cache: "no-store",
      credentials: "include",
      redirect: "manual",
      headers,
    });

    if (isRedirectStatus(res.status) || res.type === "opaqueredirect") {
      return setAuthCache(cacheKey, {
        authenticated: false,
        authenticationMethod: "oidc",
        oidcBearer: null,
        sessionInvalid: false,
        webAppReleaseType: "UNKNOWN",
      });
    }

    if (res.status === 400) {
      return setAuthCache(cacheKey, {
        authenticated: false,
        authenticationMethod: "unknown",
        oidcBearer: null,
        sessionInvalid: true,
        webAppReleaseType: "UNKNOWN",
      });
    }

    if (!res.ok) {
      return setAuthCache(cacheKey, fallbackResult);
    }

    const data = await res.json();
    const parsed = parseServerSettings(data, jwt);

    return setAuthCache(cacheKey, parsed);
  } catch {
    return setAuthCache(cacheKey, fallbackResult);
  }
}

export async function getServerAuthInfo(
  baseUrl: string,
  jwt: string | null,
): Promise<ServerAuthInfo> {
  return checkServerAuthenticated(baseUrl, jwt);
}