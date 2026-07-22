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

async function updateRegisteredServiceWorkers(): Promise<void> {
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
        await registration.update();

        try {
          registration.waiting?.postMessage({
            type: "SKIP_WAITING",
          });
        } catch {
          // Der Service Worker muss diese Nachricht nicht unterstützen.
        }
      }),
    );
  } catch (error) {
    console.warn(
      "[FRONTEND UPDATE] Service worker update failed",
      error,
    );
  }
}

function buildReloadUrl(version?: string): URL {
  const targetUrl =
    new URL(window.location.href);

  /*
   * Alte Cache-Busting-Parameter entfernen, damit die URL
   * nicht bei jedem Update länger wird.
   */
  targetUrl.searchParams.delete(
    "__frontendVersion",
  );

  targetUrl.searchParams.delete(
    "__frontendUpdate",
  );

  targetUrl.searchParams.delete(
    "__cacheBust",
  );

  targetUrl.searchParams.set(
    "__frontendVersion",
    String(version || "unknown"),
  );

  targetUrl.searchParams.set(
    "__cacheBust",
    String(Date.now()),
  );

  return targetUrl;
}

/**
 * Führt eine vollständige Dokumentnavigation aus.
 *
 * Wichtig:
 * - kein Logout
 * - kein Löschen von localStorage/sessionStorage
 * - kein Löschen aller Cache-Storage-Einträge
 * - kein Unregister aller Service Worker
 * - aktuelle Route bleibt erhalten
 *
 * Auf localhost:8081 läuft die Anwendung über den Expo-/Metro-
 * Development-Server. Ein auf dem AWB-Server installiertes Frontend
 * kann den lokalen Metro-Bundle nicht ersetzen. Der Reload ist dort
 * trotzdem vollständig, zeigt aber weiterhin den lokalen Source-Code.
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

  const serverBaseUrl =
    normalizeBaseUrl(params.baseUrl);

  if (isExpoDevelopmentRuntime()) {
    console.warn(
      "[FRONTEND UPDATE] The app is running on the Expo development server.",
      {
        currentOrigin:
          window.location.origin,
        updatedServer:
          serverBaseUrl,
        explanation:
          "A server-installed frontend update cannot replace the Metro development bundle. Test the deployed update from the server-hosted WebApp.",
      },
    );
  }

  await updateRegisteredServiceWorkers();

  const targetUrl =
    buildReloadUrl(params.version);

  console.info(
    "[FRONTEND UPDATE] Performing manual full reload",
    {
      targetUrl:
        targetUrl.toString(),
      version:
        params.version ?? null,
    },
  );

  /*
   * replace() erzeugt eine neue Dokumentnavigation.
   * Das ist kein React-Navigation-Wechsel innerhalb der SPA.
   */
  window.location.replace(
    targetUrl.toString(),
  );

  return true;
}
