import type { AuthMethod } from "../../redux/slices/apiSlice";
import { ServerCheckResult } from "./types";

export function normalizeBaseUrl(url: string) {
  return (url ?? "").toString().trim().replace(/\/+$/, "");
}

export function normalizeName(name: string) {
  return (name ?? "").toString().trim();
}

function isReachableStatus(status?: number): boolean {
  if (status == null) {
    return false;
  }

  // 2xx = OK
  // 3xx = Redirect/Login/OIDC
  // 4xx = Server antwortet trotzdem
  // Erst ab 5xx oder Network Error wirklich offline
  return status >= 200 && status < 500;
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

/**
 * Prüft nur:
 * Antwortet der Server überhaupt?
 */
export async function checkServerReachable(
  baseUrl: string,
  jwt?: string | null,
  authenticationMethod: AuthMethod = "unknown",
): Promise<ServerCheckResult> {
  const base = normalizeBaseUrl(baseUrl);

  console.log("[checkServerReachable] checking:", base);
  if (base === "http://localhost:8081") {
  console.log("[checkServerReachable] skip Expo frontend:", base);

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

  const urls = [
    `${base}/api/alive`,
    `${base}/api/app/settings/get`,
  ];

  for (const url of urls) {
    try {
      const res = await fetchReachable(url, jwt,authenticationMethod);

      console.log(
        "[checkServerReachable] status:",
        res.status,
        "url:",
        url,
      );

      // WICHTIG:
      // 303 = erreichbar
      // 401 = erreichbar
      // 403 = erreichbar
      // 404 = erreichbar
     if (isReachableStatus(res.status) || res.status === 0 || res.type === "opaqueredirect") {
          console.log("[checkServerReachable] redirect detected but server is reachable:", {
            status: res.status,
            type: res.type,
            url,
          });

          return {
            ok: true,
          };
        }
    } catch (error) {
      console.log(
        "[checkServerReachable] failed:",
        url,
        error,
      );
    }
  }

  return {
    ok: false,
    message:
      "Server nicht erreichbar. Bitte andere URL verwenden.",
  };
}

export type ServerAuthInfo = {
  authenticated: boolean;
  authenticationMethod: AuthMethod;
  oidcBearer: string | null;
  sessionInvalid: boolean;
};

export function parseServerSettings(
  data: any,
  jwt: string | null,
): ServerAuthInfo {
  const entries = Array.isArray(data?.propertyEntries)
    ? data.propertyEntries
    : [];

  const authCfg = entries.find(
    (entry: any) =>
      entry?.key === "_ServerWideSecurityConfiguration",
  )?.value;

  const authenticatedRaw = entries.find(
    (entry: any) => entry?.key === "_Authenticated",
  )?.value;

  const oidcBearer = entries.find(
    (entry: any) => entry?.key === "_oidc.bearer",
  )?.value;

  const hasSessionId = entries.some(
    (entry: any) => entry?.key === "_session.id",
  );

  const hasSessionPathParameter = entries.some(
    (entry: any) =>
      entry?.key === "_session.pathParameter",
  );

  const authenticated =
    typeof authenticatedRaw === "boolean"
      ? authenticatedRaw
      : String(authenticatedRaw).toLowerCase() === "true";

  let authenticationMethod: AuthMethod = "unknown";

  if (authCfg === "OIDCSecurityHandler") {
    authenticationMethod = "oidc";
  } else if (
    authCfg === "JwtSingleUserSecurityHandler"
  ) {
    authenticationMethod = "jwt";
  } else if (
    oidcBearer ||
    hasSessionId ||
    hasSessionPathParameter
  ) {
    authenticationMethod = "oidc";
  } else if (jwt) {
    authenticationMethod = "jwt";
  }

  return {
    authenticated,
    authenticationMethod,
    oidcBearer:
      typeof oidcBearer === "string"
        ? oidcBearer
        : null,
    sessionInvalid: false,
  };
}

export async function checkServerAuthenticated(
  baseUrl: string,
  jwt: string | null,
): Promise<ServerAuthInfo> {
  const base = normalizeBaseUrl(baseUrl);

  console.log(
    "[checkServerAuthenticated] checking:",
    base,
    "hasJwt:",
    !!jwt,
  );

  try {
    const res = await fetch(
      `${base}/api/app/settings/get`,
      {
        method: "GET",
        mode: "cors",
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
      },
    );

    console.log(
      "[checkServerAuthenticated] status:",
      res.status,
      "url:",
      `${base}/api/app/settings/get`,
    );

    if (res.status === 400) {
      return {
        authenticated: false,
        authenticationMethod: "unknown",
        oidcBearer: null,
        sessionInvalid: true,
      };
    }

    if (!res.ok) {
      return {
        authenticated: false,
        authenticationMethod: "unknown",
        oidcBearer: null,
        sessionInvalid: false,
      };
    }

    const data = await res.json();
    const parsed = parseServerSettings(data, jwt);

    console.log(
      "[checkServerAuthenticated] parsed:",
      parsed,
    );

    return parsed;
  } catch (error) {
    console.log(
      "[checkServerAuthenticated] failed:",
      base,
      error,
    );

    return {
      authenticated: false,
      authenticationMethod: "unknown",
      oidcBearer: null,
      sessionInvalid: false,
    };
  }
}

export async function getServerAuthInfo(
  baseUrl: string,
  jwt: string | null,
): Promise<ServerAuthInfo> {
  return checkServerAuthenticated(baseUrl, jwt);
}