// src/util/applicationMode.ts
export type ApplicationMode = "CENTRAL_SHELL" | "STANDALONE";

export function getApplicationMode(): ApplicationMode {
  const raw = (process.env.EXPO_PUBLIC_APPLICATION_MODE ?? "CENTRAL_SHELL").toUpperCase();

  if (raw === "STANDALONE") {
    return "STANDALONE";
  }

  return "CENTRAL_SHELL";
}