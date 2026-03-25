// src/redux/selectors/serverSelectors.ts

import type { RootState } from "../store";

export function normalizeServerKey(url: string | null | undefined) {
  return (url ?? "").trim().replace(/\/+$/, "");
}

export function selectActiveServerKey(state: RootState) {
  return normalizeServerKey(state.api.ip);
}

export function getServerScopedStorageKey(
  prefix: string,
  baseUrl: string | null | undefined,
) {
  return `${prefix}::${normalizeServerKey(baseUrl)}`;
}