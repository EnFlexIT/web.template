// src/util/runtimeBaseUrl.ts

import { Platform } from "react-native";
import Constants from "expo-constants";

function normalizeUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  const normalized = url.trim().replace(/\/+$/, "");
  return normalized.length > 0 ? normalized : null;
}

function getExpoHost(): string | null {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as any).manifest2?.extra?.expoClient?.hostUri ??
    null;

  if (!hostUri || typeof hostUri !== "string") {
    return null;
  }

  const host = hostUri.split(":")[0]?.trim();
  return host || null;
}

function isLoopbackHost(host: string): boolean {
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

export function resolveRuntimeBaseUrl(): string | null {
  /**
   * WEB:
   * bestehendes Verhalten beibehalten
   */
  if (typeof window !== "undefined" && window.location?.origin) {
    return normalizeUrl(window.location.origin);
  }

  /**
   * Native / Expo:
   * API-URL aus dem aktuellen Expo-Host ableiten
   */
  if (Platform.OS !== "web") {
    const host = getExpoHost();

    if (host && !isLoopbackHost(host)) {
      const protocol = process.env.EXPO_PUBLIC_DEV_API_PROTOCOL ?? "http";
      const port = process.env.EXPO_PUBLIC_DEV_API_PORT ?? "8080";

      return normalizeUrl(`${protocol}://${host}:${port}`);
    }

    /**
     * Optionaler Fallback für Native,
     * falls Expo-Host mal nicht erkannt wird
     */
    return normalizeUrl(
      process.env.EXPO_PUBLIC_NATIVE_FALLBACK_API_URL ?? null
    );
  }

  return null;
}