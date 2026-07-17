import { Platform } from "react-native";

type ReloadUpdatedFrontendParams = {
  baseUrl: string;
  version?: string;
};

function normalizeBaseUrl(value: string): string {
  return String(value ?? "")
    .trim()
    .replace(/\/+$/, "");
}

function isExpoDevelopmentRuntime(): boolean {
  if (
    Platform.OS !== "web" ||
    typeof window === "undefined"
  ) {
    return false;
  }

  return (
    window.location.origin.includes("localhost:8081") ||
    window.location.origin.includes("127.0.0.1:8081")
  );
}

function buildReloadTarget(params: {
  baseUrl: string;
  version?: string;
}): URL {
  const serverBaseUrl =
    normalizeBaseUrl(params.baseUrl);

  const targetOrigin =
    isExpoDevelopmentRuntime()
      ? window.location.origin
      : serverBaseUrl || window.location.origin;

  const targetUrl = new URL(
    "/index.html",
    `${targetOrigin}/`,
  );

  targetUrl.searchParams.set(
    "__frontendVersion",
    params.version || "unknown",
  );

  targetUrl.searchParams.set(
    "__cacheBust",
    String(Date.now()),
  );

  return targetUrl;
}

async function clearBrowserCacheStorage(): Promise<void> {
  if (
    typeof window === "undefined" ||
    !("caches" in window)
  ) {
    return;
  }

  try {
    const cacheNames =
      await window.caches.keys();

    await Promise.allSettled(
      cacheNames.map((cacheName) =>
        window.caches.delete(cacheName),
      ),
    );
  } catch (error) {
    console.warn(
      "[FRONTEND UPDATE] Cache Storage could not be cleared",
      error,
    );
  }
}

async function resetServiceWorkers(): Promise<void> {
  if (
    typeof navigator === "undefined" ||
    !("serviceWorker" in navigator)
  ) {
    return;
  }

  try {
    const registrations =
      await navigator.serviceWorker.getRegistrations();

    await Promise.allSettled(
      registrations.map(async (registration) => {
        try {
          registration.waiting?.postMessage({
            type: "SKIP_WAITING",
          });
        } catch {
          // Der Service Worker muss diese Nachricht nicht unterstützen.
        }

        await registration.unregister();
      }),
    );
  } catch (error) {
    console.warn(
      "[FRONTEND UPDATE] Service workers could not be reset",
      error,
    );
  }
}

async function warmFreshIndex(
  targetUrl: URL,
): Promise<void> {
  try {
    /*
     * Nur vorbereitend. Ein Fehler darf den echten Reload
     * niemals verhindern.
     */
    await fetch(targetUrl.toString(), {
      method: "GET",
      cache: "reload",
      credentials: "include",
      redirect: "follow",
    });
  } catch (error) {
    console.warn(
      "[FRONTEND UPDATE] Fresh index could not be prefetched",
      error,
    );
  }
}

/**
 * Führt eine vollständige Browsernavigation zur aktualisierten Web-App aus.
 *
 * Erhalten bleiben:
 * - localStorage
 * - sessionStorage
 * - JWT
 * - OIDC-Cookies
 *
 * Bereinigt werden:
 * - Cache Storage
 * - registrierte Service Worker
 * - HTTP-Cache durch einen eindeutigen Query-Parameter
 */
export async function reloadUpdatedFrontendWebApp(
  params: ReloadUpdatedFrontendParams,
): Promise<boolean> {
  if (
    Platform.OS !== "web" ||
    typeof window === "undefined"
  ) {
    return false;
  }

  const targetUrl =
    buildReloadTarget(params);

  await Promise.allSettled([
    clearBrowserCacheStorage(),
    resetServiceWorkers(),
  ]);

  /*
   * Wichtig:
   * Das Prefetch-Ergebnis blockiert die Navigation nicht.
   */
  await warmFreshIndex(targetUrl);

  console.info(
    "[FRONTEND UPDATE] Performing full application reload",
    {
      targetUrl: targetUrl.toString(),
      version: params.version ?? null,
    },
  );

  window.location.replace(
    targetUrl.toString(),
  );

  return true;
}