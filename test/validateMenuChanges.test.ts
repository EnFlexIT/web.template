import type { EditorMenuEntry } from "../src/template/editor/model/editorTypes";
import type { ProtectedMenuEntry } from "../src/template/editor/model/menuProtection";
import { validateMenuChanges } from "../src/template/editor/validation/validateMenuChanges";

function original(): EditorMenuEntry {
  return {
    id: "projectSetup",
    source: "application",
    menuID: 100,
    parentId: "applicationRoot",
    caption: "Project Setup",
    position: 1,
  };
}

function protectedMenu(
  permissions: Partial<ProtectedMenuEntry["permissions"]> = {},
): ProtectedMenuEntry {
  return {
    original: original(),
    permissions: {
      allowCaptionChange: false,
      allowPositionChange: false,
      allowParentChange: false,
      ...permissions,
    },
  };
}

describe("validateMenuChanges", () => {
  it("accepts unchanged menus", () => {
    expect(validateMenuChanges([protectedMenu()], [original()])).toEqual([]);
  });

  it("rejects removed protected menus", () => {
    expect(validateMenuChanges([protectedMenu()], []).some(
      error => error.code === "PROTECTED_MENU_REMOVED",
    )).toBe(true);
  });

  it("rejects source changes", () => {
    expect(validateMenuChanges(
      [protectedMenu()],
      [{ ...original(), source: "content" }],
    ).some(error => error.code === "PROTECTED_MENU_SOURCE_CHANGED")).toBe(true);
  });

  it("rejects numeric ID changes", () => {
    expect(validateMenuChanges(
      [protectedMenu()],
      [{ ...original(), menuID: 999 }],
    ).some(error => error.code === "PROTECTED_MENU_ID_CHANGED")).toBe(true);
  });

  it("rejects unauthorized caption changes", () => {
    expect(validateMenuChanges(
      [protectedMenu()],
      [{ ...original(), caption: "Changed" }],
    ).some(error => error.code === "PROTECTED_MENU_CAPTION_CHANGED")).toBe(true);
  });

  it("accepts authorized caption changes", () => {
    expect(validateMenuChanges(
      [protectedMenu({ allowCaptionChange: true })],
      [{ ...original(), caption: "Changed" }],
    )).toEqual([]);
  });

  it("rejects unauthorized position changes", () => {
    expect(validateMenuChanges(
      [protectedMenu()],
      [{ ...original(), position: 5 }],
    ).some(error => error.code === "PROTECTED_MENU_POSITION_CHANGED")).toBe(true);
  });

  it("rejects unauthorized parent changes", () => {
    expect(validateMenuChanges(
      [protectedMenu()],
      [{ ...original(), parentId: "settings" }],
    ).some(error => error.code === "PROTECTED_MENU_PARENT_CHANGED")).toBe(true);
  });

  it("rejects unregistered application menus", () => {
    expect(validateMenuChanges(
      [protectedMenu()],
      [
        original(),
        { id: "unknown", source: "application", menuID: 999, caption: "Unknown", position: 2 },
      ],
    ).some(error => error.code === "UNREGISTERED_STATIC_MENU")).toBe(true);
  });

  it("accepts new content menus", () => {
    expect(validateMenuChanges(
      [protectedMenu()],
      [
        original(),
        { id: "docs", source: "content", caption: "Documentation", position: 2, contentPageId: "page-1" },
      ],
    )).toEqual([]);
  });
});

describe("static menu relocation protection", () => {
  it("rejects parent changes even when legacy permission allows them", () => {
    const errors = validateMenuChanges(
      [protectedMenu({ allowParentChange: true })],
      [{ ...original(), parentId: "systemSettings" }],
    );

    expect(errors.some(
      error => error.code === "PROTECTED_MENU_PARENT_CHANGED",
    )).toBe(true);
  });
});
