import {
  isJwtRenewSessionCurrent,
  type JwtRenewSessionSnapshot,
} from "../src/template/authentication/jwt/isJwtRenewSessionCurrent";

const initial: JwtRenewSessionSnapshot = {
  baseUrl: "http://localhost:8080",
  jwt: "jwt-old",
  authenticationMethod: "jwt",
  isLoggedIn: true,
};

describe("isJwtRenewSessionCurrent", () => {
  it("accepts an unchanged JWT session", () => {
    expect(isJwtRenewSessionCurrent(initial, { ...initial })).toBe(true);
  });

  it("rejects a server change", () => {
    expect(
      isJwtRenewSessionCurrent(initial, {
        ...initial,
        baseUrl: "http://localhost:9090",
      }),
    ).toBe(false);
  });

  it("rejects a JWT change on the same server", () => {
    expect(
      isJwtRenewSessionCurrent(initial, {
        ...initial,
        jwt: "jwt-another-user",
      }),
    ).toBe(false);
  });

  it("rejects a logout", () => {
    expect(
      isJwtRenewSessionCurrent(initial, {
        ...initial,
        jwt: null,
        isLoggedIn: false,
      }),
    ).toBe(false);
  });

  it("rejects an authentication-method change", () => {
    expect(
      isJwtRenewSessionCurrent(initial, {
        ...initial,
        authenticationMethod: "oidc",
      }),
    ).toBe(false);
  });

  it("rejects an unauthenticated initial state", () => {
    expect(
      isJwtRenewSessionCurrent(
        { ...initial, isLoggedIn: false },
        initial,
      ),
    ).toBe(false);
  });
});