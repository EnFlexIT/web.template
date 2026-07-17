import { useUpdateNotifierWeb } from "../../hooks/useUpdateNotifierWeb";

type Props = {
  enabled: boolean;
  intervalMs?: number;
};

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