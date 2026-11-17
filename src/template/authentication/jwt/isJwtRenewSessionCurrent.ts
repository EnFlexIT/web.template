export type JwtRenewSessionSnapshot = {
  baseUrl: string;
  jwt: string | null;
  authenticationMethod: string;
  isLoggedIn: boolean;
};

export function isJwtRenewSessionCurrent(
  started: JwtRenewSessionSnapshot,
  current: JwtRenewSessionSnapshot,
): boolean {
  return (
    started.baseUrl === current.baseUrl &&
    started.jwt === current.jwt &&
    started.authenticationMethod === current.authenticationMethod &&
    started.isLoggedIn &&
    current.isLoggedIn &&
    current.authenticationMethod === "jwt"
  );
}