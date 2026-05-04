export const menuFeatureFlags: Record<number, boolean> = {
  // Settings children
  3011: true,   // devHome
  3012: true,   // serverSettings
  3013: true,  // changePassword 
  3014: true,  // featureFlagForNewFeature
  3010: true,   // databaseConnectionsAndSettings

};

export function isMenuEnabled(menuID: number): boolean {
  // default: enabled, wenn nicht gelistet
  return menuFeatureFlags[menuID] ?? true;
}
