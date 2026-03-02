// src/config/tabFeatureFlags.ts

export const tabFeatureFlags: Record<number, boolean> = {
  5001: true, // Factory Tab 
};

export function isTabEnabled(flagID: number): boolean {
  return tabFeatureFlags[flagID] ?? true;
}