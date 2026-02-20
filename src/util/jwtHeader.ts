// src/utils/jwtHeader.ts

export function extractJwtFromWwwAuthenticate(
  headers: Record<string, any> | undefined
): string | null {
  if (!headers) return null;

  const header =
    headers["www-authenticate"] ||
    headers["WWW-Authenticate"] ||
    headers["Www-Authenticate"];

  if (!header || typeof header !== "string") return null;

  
  const parts = header.split(" ");

  if (parts.length !== 2) return null;

  const scheme = parts[0];
  const token = parts[1];

  if (scheme !== "Bearer" || !token) return null;

  return token;
}
