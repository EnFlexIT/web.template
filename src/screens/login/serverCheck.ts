import type { AuthMethod } from "../../redux/slices/apiSlice";
import { ServerCheckResult } from "./types";

export function normalizeBaseUrl(url: string) {
  return (url ?? "").toString().trim().replace(/\/+$/, "");
}

export function normalizeName(name: string) {
  return (name ?? "").toString().trim();
}

/**
 * Reiner Reachability-Check:
 * Wenn der Server überhaupt mit HTTP antwortet, gilt er als erreichbar.
 */
export async function checkServerReachable(
  baseUrl: string,
): Promise<ServerCheckResult> {
  const base = normalizeBaseUrl(baseUrl);

  console.log("[checkServerReachable] checking:", base);

  try {
    const res = await fetch(`${base}/api/app/settings/get`, {
      method: "GET",
      mode: "cors",
      cache: "no-store",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    });

    console.log(
      "[checkServerReachable] status:",
      res.status,
      "url:",
      `${base}/api/app/settings/get`,
    );

    // 200 = ok
    // 400 = Server lebt, aber Session/Cookies evtl. kaputt
    // 401/403 = Server lebt, aber nicht autorisiert
    if ([200, 400, 401, 403].includes(res.status)) {
      return { ok: true };
    }

    return {
      ok: false,
      message: `Server antwortet, aber Status ${res.status}. Bitte URL prüfen.`,
    };
  } catch (error) {
    console.log("[checkServerReachable] failed:", base, error);

    return {
      ok: false,
      message: "Server nicht erreichbar. Bitte andere URL verwenden.",
    };
  }
}

export type ServerAuthInfo = {
  authenticated: boolean;
  authenticationMethod: AuthMethod;
  oidcBearer: string | null;
  sessionInvalid: boolean;
};

export function parseServerSettings(data: any, jwt: string | null): ServerAuthInfo {
  const entries = Array.isArray(data?.propertyEntries) ? data.propertyEntries : [];

  const authCfg = entries.find(
    (entry: any) => entry?.key === "_ServerWideSecurityConfiguration",
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
    (entry: any) => entry?.key === "_session.pathParameter",
  );

  const authenticated =
    typeof authenticatedRaw === "boolean"
      ? authenticatedRaw
      : String(authenticatedRaw).toLowerCase() === "true";

  let authenticationMethod: AuthMethod = "unknown";

  if (authCfg === "OIDCSecurityHandler") {
    authenticationMethod = "oidc";
  } else if (authCfg === "JwtSingleUserSecurityHandler") {
    authenticationMethod = "jwt";
  } else if (oidcBearer || hasSessionId || hasSessionPathParameter) {
    authenticationMethod = "oidc";
  } else if (jwt) {
    // nur wenn wirklich ein JWT lokal bekannt ist
    authenticationMethod = "jwt";
  }

  return {
    authenticated,
    authenticationMethod,
    oidcBearer: typeof oidcBearer === "string" ? oidcBearer : null,
    sessionInvalid: false,
  };
}

export async function checkServerAuthenticated(
  baseUrl: string,
  jwt: string | null,
): Promise<ServerAuthInfo> {
  const base = normalizeBaseUrl(baseUrl);

  console.log("[checkServerAuthenticated] checking:", base, "hasJwt:", !!jwt);

  try {
    const res = await fetch(`${base}/api/app/settings/get`, {
      method: "GET",
      mode: "cors",
      cache: "no-store",
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
      },
    });

    console.log(
      "[checkServerAuthenticated] status:",
      res.status,
      "url:",
      `${base}/api/app/settings/get`,
    );

    // Typischer Fall nach Server-Neustart / kaputten alten Cookies
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

    console.log("[checkServerAuthenticated] parsed:", parsed);

    return parsed;
  } catch (error) {
    console.log("[checkServerAuthenticated] failed:", base, error);

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