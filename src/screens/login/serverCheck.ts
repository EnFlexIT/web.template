import { ServerCheckResult } from "./types";

export function normalizeBaseUrl(url: string) {
  return (url ?? "").toString().trim().replace(/\/+$/, "");
}

export function normalizeName(name: string) {
  return (name ?? "").toString().trim();
}

/**
 * Web-check: GET {base}/api/app/settings/get
 * 200 => ok, 401 => server da (ok), sonst => error
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
  headers: {
    Accept: "application/json",
  },
});

    console.log("[checkServerReachable] status:", res.status, "url:", `${base}/api/app/settings/get`);

    if (res.ok) return { ok: true };
    if (res.status === 401) return { ok: true };

    return {
      ok: false,
      message: `Server antwortet, aber Status ${res.status}. Bitte URL prüfen.`,
    };
  } catch (error) {
    console.log("[checkServerReachable] failed:", base, error);

    return {
      ok: false,
      message:
        "Server nicht erreichbar. Bitte andere URL verwenden.",
    };
  }
}