export const menuFeatureFlags: Record<number, boolean> = {
  // Settings children
  3011: false,   // devHome
  3012: true,   // serverSettings
  3013: true,  // changePassword 
  // weitere IDs...
};

export function isMenuEnabled(menuID: number): boolean {
  // default: enabled, wenn nicht gelistet
  return menuFeatureFlags[menuID] ?? true;
}
