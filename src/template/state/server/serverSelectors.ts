// src/template/state/server/serverSelectors.ts
import type { TemplateRootState } from '@/template/state/store/templateStoreTypes';

export function normalizeServerKey(url: string | null | undefined) {
  return (url ?? "").trim().replace(/\/+$/, "");
}

export function selectActiveServerKey(state: TemplateRootState) {
  return normalizeServerKey(state.api.ip);
}

export function getServerScopedStorageKey(
  prefix: string,
  baseUrl: string | null | undefined,
) {
  return `${prefix}::${normalizeServerKey(baseUrl)}`;
}