export type ServerCheckResult =
  | { ok: true }
  | { ok: false; message: string };
  export type ServerEnvironment = "DEV" | "TEST" | "PROD";
