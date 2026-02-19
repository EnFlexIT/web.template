// src/utils/jwtTime.ts
import { jwtDecode } from "jwt-decode";

export function getJwtExpMs(jwt: string | null): number {
  if (!jwt) return 0;
  try {
    const decoded: any = jwtDecode(jwt);
    return (decoded?.exp ?? 0) * 1000;
  } catch {
    return 0;
  }
}

export function getJwtRemainingMs(jwt: string | null): number {
  const expMs = getJwtExpMs(jwt);
  return expMs - Date.now();
}
