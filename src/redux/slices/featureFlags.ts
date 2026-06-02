import type { AuthMethod } from "../slices/apiSlice";

export const menuFeatureFlags: Record<number, boolean> = {
  3011: true,
  3012: true,
  3013: true,
  3014: true,
  3010: true,
};

export function isMenuEnabled(
  menuID: number,
  authenticationMethod?: AuthMethod,
): boolean {
  if (menuID === 3013 && authenticationMethod === "oidc") {
    return false;
  }

  return menuFeatureFlags[menuID] ?? true;
}