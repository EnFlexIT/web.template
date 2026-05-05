// src/config/tabFeatureFlags.ts

export const tabFeatureFlags: Record<number, boolean> = {
  5001: true, // Factory Tab 
  3111: true, // Update Backend Tab
  3000: true, // Data Analyzing Tab
};

export function isTabEnabled(flagID: number): boolean {
  return tabFeatureFlags[flagID] ?? true;
}