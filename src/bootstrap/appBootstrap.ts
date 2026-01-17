// src/bootstrap/appBootstrap.ts
export type AppMode = "ENFLEX_BASE" | "ENFLEX_CLOUD";

type PropertyEntry = {
  key: string;
  value: string;
  valueType: string;
};

type AppSettingsResponse = {
  propertyEntries: PropertyEntry[];
};

function getProperty(entries: PropertyEntry[], key: string) {
  return entries.find((e) => e.key === key)?.value;
}

function detectAppModeFromSettings(res: AppSettingsResponse): AppMode {
  const auth = getProperty(res.propertyEntries, "_Authenticated");
  const security = getProperty(res.propertyEntries, "_ServerWideSecurityConfiguration");

  // Dein Router-ähnlicher Setup-Fall
  if (auth === "false" && security === "JwtSingleUserSecurityHandler") {
    return "ENFLEX_BASE";
  }

  return "ENFLEX_CLOUD";
}

/**
 * Versucht den lokalen EnFlex-Server zu erreichen.
 * Wenn erreichbar + Settings passen => ENFLEX_BASE
 * sonst => ENFLEX_CLOUD
 */
export async function bootstrapAppMode(options?: {
  baseUrl?: string;          // default: http://localhost:8080
  timeoutMs?: number;        // default: 2500
}): Promise<AppMode> {
  const baseUrl = options?.baseUrl ?? "http://localhost:8080";
  const timeoutMs = options?.timeoutMs ?? 2500;

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `${baseUrl}/api/app/settings/get`;
    const resp = await fetch(url, { signal: controller.signal });

    if (!resp.ok) return "ENFLEX_CLOUD";

    const json = (await resp.json()) as AppSettingsResponse;
    return detectAppModeFromSettings(json);
  } catch (e) {
    // nicht erreichbar / timeout / offline
    return "ENFLEX_CLOUD";
  } finally {
    clearTimeout(t);
  }
}
