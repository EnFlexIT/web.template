import { normalizeBaseUrl, normalizeName } from "./serverCheck";

export function normalizeServerInputs(
  name: string,
  baseUrl: string,
) {
  return {
    name: normalizeName(name) || "Custom",
    baseUrl: normalizeBaseUrl(baseUrl),
  };
}