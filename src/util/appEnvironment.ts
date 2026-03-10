// src/util/appEnvironment.ts
export type AppEnvironment = "DEV" | "TEST" | "PROD";

export function getAppEnvironment(): AppEnvironment {
  const raw = (process.env.EXPO_PUBLIC_APP_ENV ?? "DEV").toUpperCase();

  if (raw === "TEST") return "TEST";
  if (raw === "PROD") return "PROD";
  return "DEV";
}