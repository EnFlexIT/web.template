export function resolveRuntimeBaseUrl(): string | null {
  /**
   * WEB:
   * Wenn App im Browser läuft → aktuelle Origin verwenden
   * Beispiel:
   * http://localhost:8082/login
   * → http://localhost:8082
   */
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  /**
   * Native (React Native):
   * kein window vorhanden
   */
  return null;
}