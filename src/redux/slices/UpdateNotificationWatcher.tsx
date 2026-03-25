// src/components/notifications/UpdateNotificationWatcher.tsx

import { useUpdateNotifierWeb } from "../../hooks/useUpdateNotifierWeb";

export function UpdateNotificationWatcher() {
  useUpdateNotifierWeb();
  return null;
}