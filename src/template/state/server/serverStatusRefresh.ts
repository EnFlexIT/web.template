export const SERVER_STATUS_REFRESH_EVENT = "server-status-refresh";

export function dispatchServerStatusRefresh() {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new Event(SERVER_STATUS_REFRESH_EVENT));
}