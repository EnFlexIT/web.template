import type {
  TemplateRootState,
} from "../src/template/state/store/templateStoreTypes";

import {
  selectUiPreviewMode,
  selectUiPreviewRoles,
  selectCanEditInUiPreview,
} from "../src/template/state/authorization/selectUiPreviewMode";

function state(
  roles: string[],
  selectedPreviewRole: string | null = null,
): TemplateRootState {
  return {
    api: {
      isLoggedIn: true,
      isSwitchingServer: false,
      isLoggingOut: false,
    },
    backendRoles: {
      status: "ready",
      roles,
      selectedPreviewRole,
    },
  } as unknown as TemplateRootState;
}

describe("UI perspective remains separate from permissions", () => {
  it("defaults to USER even for an administrator", () => {
    const current = state(["ADMIN", "EDITOR"]);
    expect(selectUiPreviewMode(current)).toBe("USER");
    expect(selectUiPreviewRoles(current)).toEqual(["USER"]);
    expect(selectCanEditInUiPreview(current)).toBe(false);
  });

  it("allows a confirmed EDITOR to use editor controls", () => {
    expect(selectCanEditInUiPreview(
      state(["EDITOR"], "EDITOR"),
    )).toBe(true);
  });

  it("does not make ADMIN an EDITOR", () => {
    expect(selectCanEditInUiPreview(
      state(["ADMIN"], "ADMIN"),
    )).toBe(false);
  });

  it("rejects a forged editor perspective", () => {
    expect(selectUiPreviewMode(
      state(["ADMIN"], "EDITOR"),
    )).toBe("USER");
  });

  it("ignores group roles as administrative privileges", () => {
    expect(selectCanEditInUiPreview(
      state(["Vermieter"], "EDITOR"),
    )).toBe(false);
  });
});
