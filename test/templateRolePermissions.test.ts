import {
  canPreviewTemplateRole,
  hasTemplatePermission,
  resolveTemplatePermissions,
} from "../src/template/state/authorization/templateRolePermissions";

describe("template role permissions", () => {
  it("allows a regular user to read but not edit", () => {
    expect(hasTemplatePermission("user", "readContent")).toBe(true);
    expect(hasTemplatePermission("user", "editFrontendContent")).toBe(false);
    expect(hasTemplatePermission("user", "manageBackend")).toBe(false);
  });

  it("allows frontend editors to edit frontend content", () => {
    expect(
      hasTemplatePermission("frontendEditor", "editFrontendContent"),
    ).toBe(true);
    expect(
      hasTemplatePermission("frontendEditor", "manageBackend"),
    ).toBe(false);
  });

  it("does not grant frontend editing to backend editors", () => {
    expect(
      hasTemplatePermission("backendEditor", "manageBackend"),
    ).toBe(true);
    expect(
      hasTemplatePermission("backendEditor", "editFrontendContent"),
    ).toBe(false);
  });

  it("gives superAdmin the union of effective role permissions", () => {
    expect(new Set(resolveTemplatePermissions("superAdmin"))).toEqual(
      new Set([
        "readContent",
        "editFrontendContent",
        "manageBackend",
      ]),
    );
  });

  it("allows superAdmin to preview every effective role", () => {
    expect(canPreviewTemplateRole("superAdmin", "user")).toBe(true);
    expect(canPreviewTemplateRole("superAdmin", "frontendEditor")).toBe(true);
    expect(canPreviewTemplateRole("superAdmin", "backendEditor")).toBe(true);
  });

  it("does not allow ordinary roles to preview other roles", () => {
    expect(canPreviewTemplateRole("user", "frontendEditor")).toBe(false);
    expect(canPreviewTemplateRole("frontendEditor", "backendEditor")).toBe(false);
    expect(canPreviewTemplateRole("backendEditor", "user")).toBe(false);
  });

  it("returns a new permission array for each resolution", () => {
    const first = resolveTemplatePermissions("user");
    const second = resolveTemplatePermissions("user");

    expect(first).toEqual(second);
    expect(first).not.toBe(second);
  });
});