import type { AuthMethod } from "../slices/apiSlice";

export const menuFeatureFlags: Record<number, boolean> = {
  3011: false,// Menüpunkt "System Settings" - enthält die Tabs "General", "Factory Settings" und "Derby Network Server"
  3012: true,// Menüpunkt "System Settings" - enthält die Tabs "General", "Factory Settings" und "Derby Network Server"
  3013: true,// Menüpunkt "Personal Settings" - enthält die Tabs "Appearance", "Privacy Settings" und "Change Password"
  3014: true,// Menüpunkt "System Settings" - enthält die Tabs "General", "Factory Settings" und "Derby Network Server"
  3010: true // Menüpunkt "System Settings" - enthält die Tabs "General", "Factory Settings" und "Derby Network Server"
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