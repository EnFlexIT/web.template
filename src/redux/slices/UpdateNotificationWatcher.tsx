import {
  useUpdateNotifierWeb,
} from "../../hooks/useUpdateNotifierWeb";

type Props = {
  enabled: boolean;
  intervalMs?: number;
};

/**
 * Dieser Watcher:
 * - prüft bei aktivierter Strategie periodisch
 * - erzeugt Notifications
 * - installiert nichts
 * - führt keinen Reload aus
 */
export function UpdateNotificationWatcher({
  enabled,
  intervalMs,
}: Props) {
  useUpdateNotifierWeb({
    enabled,
    intervalMs,
  });

  return null;
}
