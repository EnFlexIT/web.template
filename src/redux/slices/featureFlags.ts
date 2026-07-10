import type { AuthMethod } from "../slices/apiSlice";

export const menuFeatureFlags: Record<number, boolean> = {
  3011: false,
  3012: true,
  3013: true,
  3014: true,
  3010: true,
  3024: true,
  3025: true, // User Profile
};

export function isMenuEnabled(
  menuID: number,
  authenticationMethod?: AuthMethod,
): boolean {
  /**
   * Passwort ändern bei OIDC ausblenden.
   */
  if (menuID === 3013 && authenticationMethod === "oidc") {
    return false;
  }

  /**
   * Benutzerprofil:
   *
   * - Bei OIDC sichtbar.
   * - Bei undefined ebenfalls erlauben, damit Routing/Screen-Resolver,
   *   die getStaticMenu() ohne AuthMethod aufrufen, den Screen finden.
   * - Bei JWT und unknown ausblenden.
   */
  if (menuID === 3025) {
    return authenticationMethod === "oidc" || authenticationMethod === undefined;
  }

  return menuFeatureFlags[menuID] ?? true;
}