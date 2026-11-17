import type {
  TemplateRootState,
} from "../src/template/state/store/templateStoreTypes";

import {
  selectUiPreviewRoles,
  selectCanEditInUiPreview,
} from "../src/template/state/authorization/selectUiPreviewMode";

function makeState(
  roles: string[],
  options: {
    status?: "ready" | "loading" | "error";
    loggedIn?: boolean;
    switching?: boolean;
    loggingOut?: boolean;
  } = {},
): TemplateRootState {
  return {
    api: {
      isLoggedIn: options.loggedIn ?? true,
      isSwitchingServer: options.switching ?? false,
      isLoggingOut: options.loggingOut ?? false,
    },
    backendRoles: {
      status: options.status ?? "ready",
      roles,
      selectedPreviewRole: null,
    },
  } as unknown as TemplateRootState;
}

describe("public USER preview fallback", () => {
  it("shows USER when confirmed roles are empty", () => {
    expect(selectUiPreviewRoles(makeState([]))).toEqual(["USER"]);
  });

  it("shows USER when only group roles exist", () => {
    expect(selectUiPreviewRoles(makeState(["Vermieter"])))
      .toEqual(["USER"]);
  });

  it("never grants editing for an empty role list", () => {
    expect(selectCanEditInUiPreview(makeState([]))).toBe(false);
  });

  it("does not expose preview roles during loading", () => {
    expect(selectUiPreviewRoles(
      makeState([], { status: "loading" }),
    )).toEqual([]);
  });

  it("does not expose preview roles after logout", () => {
    expect(selectUiPreviewRoles(
      makeState([], { loggedIn: false }),
    )).toEqual([]);
  });

  it("does not expose preview roles during server switching", () => {
    expect(selectUiPreviewRoles(
      makeState(["ADMIN"], { switching: true }),
    )).toEqual([]);
  });

  it("does not expose preview roles during logout", () => {
    expect(selectUiPreviewRoles(
      makeState(["EDITOR"], { loggingOut: true }),
    )).toEqual([]);
  });

  it("does not expose preview roles after a role-fetch error", () => {
    expect(selectUiPreviewRoles(
      makeState([], { status: "error" }),
    )).toEqual([]);
  });
});
