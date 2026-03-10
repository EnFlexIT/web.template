// src/config/tabFeatureFlags.ts

export const tabFeatureFlags: Record<number, boolean> = {
  5001: true, // Factory Tab 
  3111: false, // Update Backend Tab
};

export function isTabEnabled(flagID: number): boolean {
  return tabFeatureFlags[flagID] ?? true;
}