import { useFrontendVersionReloadWeb } from "../../hooks/useFrontendVersionReloadWeb";
import { useUpdateNotifierWeb } from "../../hooks/useUpdateNotifierWeb";

type Props = {
  enabled: boolean;
  intervalMs?: number;
};

export function UpdateNotificationWatcher({
  enabled,
  intervalMs,
}: Props) {
  /*
   * Führt einen vollständigen Reload aus, sobald sich die
   * tatsächlich installierte WEBAPP-Version geändert hat.
   */
  useFrontendVersionReloadWeb({
    enabled,
  });

  /*
   * Prüft während der Benutzung auf Updates und erzeugt
   * Frontend-/Backend-Notifications.
   */
  useUpdateNotifierWeb({
    enabled,
    intervalMs,
  });

  return null;
}