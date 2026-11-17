import {
  selectConfirmedApplicationRoles,
} from "../src/template/state/authorization/selectConfirmedApplicationRoles";

import type {
  TemplateRootState,
} from "../src/template/state/store/templateStoreTypes";

function makeState(
  roles: string[],
  options: {
    isLoggedIn?: boolean;
    isSwitchingServer?: boolean;
    isLoggingOut?: boolean;
    status?: "idle" | "loading" | "ready" | "error";
  } = {},
): TemplateRootState {
  return {
    api: {
      isLoggedIn: options.isLoggedIn ?? true,
      isSwitchingServer: options.isSwitchingServer ?? false,
      isLoggingOut: options.isLoggingOut ?? false,
    },
    backendRoles: {
      roles,
      status: options.status ?? "ready",
    },
  } as unknown as TemplateRootState;
}

describe("confirmed application roles", () => {
  it("does not grant ADMIN by default", () => {
    expect(selectConfirmedApplicationRoles(makeState([])))
      .toEqual([]);
  });

  it("does not grant EDITOR without confirmation", () => {
    expect(selectConfirmedApplicationRoles(makeState(["Vermieter"])))
      .toEqual([]);
  });

  it("allows a confirmed EDITOR", () => {
    expect(selectConfirmedApplicationRoles(makeState(["EDITOR"])))
      .toEqual(["EDITOR"]);
  });

  it("allows a confirmed ADMIN", () => {
    expect(selectConfirmedApplicationRoles(makeState(["ADMIN"])))
      .toEqual(["ADMIN"]);
  });

  it("supports both independent backend roles", () => {
    expect(selectConfirmedApplicationRoles(
      makeState(["ADMIN", "EDITOR"]),
    )).toEqual(["ADMIN", "EDITOR"]);
  });

  it("does not treat group roles as backend permissions", () => {
    expect(selectConfirmedApplicationRoles(
      makeState(["Vermieter", "Mieter"]),
    )).toEqual([]);
  });

  it("returns no roles during loading", () => {
    expect(selectConfirmedApplicationRoles(
      makeState(["ADMIN"], { status: "loading" }),
    )).toEqual([]);
  });

  it("returns no roles after logout", () => {
    expect(selectConfirmedApplicationRoles(
      makeState(["ADMIN"], { isLoggedIn: false }),
    )).toEqual([]);
  });

  it("returns no roles during server switching", () => {
    expect(selectConfirmedApplicationRoles(
      makeState(["ADMIN"], { isSwitchingServer: true }),
    )).toEqual([]);
  });

  it("returns no roles during logout", () => {
    expect(selectConfirmedApplicationRoles(
      makeState(["EDITOR"], { isLoggingOut: true }),
    )).toEqual([]);
  });
});