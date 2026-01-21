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

  try {
    const res = await fetch(`${base}/api/app/settings/get`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (res.ok) return { ok: true };
    if (res.status === 401) return { ok: true };

    return {
      ok: false,
      message: `Server antwortet, aber Status ${res.status}. Bitte URL prüfen.`,
    };
  } catch {
    return {
      ok: false,
      message:
        "Server nicht erreichbar. Bitte andere URL verwenden (z.B. http://localhost:8080).",
    };
  }
}
