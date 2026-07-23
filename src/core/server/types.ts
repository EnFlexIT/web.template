export type ServerCheckResult =
  | { ok: true }
  | { ok: false; message: string };
