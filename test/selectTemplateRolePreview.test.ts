import {
  selectActiveTemplatePreviewRole,
  selectTemplatePreviewPermission,
} from "../src/template/state/authorization/selectTemplateRolePreview";

import type {
  TemplateRootState,
} from "../src/template/state/store/templateStoreTypes";

function createState(
  preview: Partial<TemplateRootState["templateRolePreview"]> = {},
  api: Partial<TemplateRootState["api"]> = {},
): TemplateRootState {
  return {
    api: {
      isLoggedIn: true,
      isLoggingOut: false,
      isSwitchingServer: false,
      ...api,
    },
    templateRolePreview: {
      enabled: true,
      actualRole: "superAdmin",
      selectedPreviewRole: "user",
      ...preview,
    },
  } as TemplateRootState;
}

describe("selectTemplateRolePreview", () => {
  it("shows the user perspective without editing rights", () => {
    const state = createState();

    expect(selectActiveTemplatePreviewRole(state)).toBe("user");
    expect(selectTemplatePreviewPermission(state, "readContent")).toBe(true);
    expect(
      selectTemplatePreviewPermission(state, "editFrontendContent"),
    ).toBe(false);
  });

  it("shows frontend editing in frontendEditor perspective", () => {
    const state = createState({
      selectedPreviewRole: "frontendEditor",
    });

    expect(
      selectTemplatePreviewPermission(state, "editFrontendContent"),
    ).toBe(true);
    expect(
      selectTemplatePreviewPermission(state, "manageBackend"),
    ).toBe(false);
  });

  it("does not give backendEditor frontend editing rights", () => {
    const state = createState({
      selectedPreviewRole: "backendEditor",
    });

    expect(
      selectTemplatePreviewPermission(state, "manageBackend"),
    ).toBe(true);
    expect(
      selectTemplatePreviewPermission(state, "editFrontendContent"),
    ).toBe(false);
  });

  it("rejects a preview outside the configured role", () => {
    const state = createState({
      actualRole: "user",
      selectedPreviewRole: "frontendEditor",
    });

    expect(selectActiveTemplatePreviewRole(state)).toBeNull();
    expect(
      selectTemplatePreviewPermission(state, "editFrontendContent"),
    ).toBe(false);
  });

  it("does not expose a preview when disabled", () => {
    expect(
      selectActiveTemplatePreviewRole(createState({ enabled: false })),
    ).toBeNull();
  });

  it("does not expose a preview after logout", () => {
    expect(
      selectActiveTemplatePreviewRole(
        createState({}, { isLoggedIn: false }),
      ),
    ).toBeNull();
  });

  it("does not expose a preview during server switching", () => {
    expect(
      selectActiveTemplatePreviewRole(
        createState({}, { isSwitchingServer: true }),
      ),
    ).toBeNull();
  });

  it("does not expose a preview during logout", () => {
    expect(
      selectActiveTemplatePreviewRole(
        createState({}, { isLoggingOut: true }),
      ),
    ).toBeNull();
  });
});