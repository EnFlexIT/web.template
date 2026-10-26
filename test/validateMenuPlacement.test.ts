import type {
  EditorMenuEntry,
} from "../src/template/editor/model/editorTypes";

import {
  validateMenuPlacement,
} from "../src/template/editor/validation/validateMenuPlacement";

function contentMenu(
  parentId?: string,
): EditorMenuEntry {
  return {
    id: "documentation",
    source: "content",
    caption: "Documentation",
    position: 1,
    parentId,
    contentPageId: "page-1",
  };
}

describe("validateMenuPlacement", () => {
  const policy = {
    allowedContentParentIds: ["applicationRoot", "home"],
  };

  it("accepts an explicitly allowed application parent", () => {
    const applicationRoot: EditorMenuEntry = {
      id: "applicationRoot",
      source: "application",
      caption: "Application",
      position: 1,
      menuID: 100,
    };

    expect(
      validateMenuPlacement(
        [applicationRoot, contentMenu("applicationRoot")],
        policy,
      ),
    ).toEqual([]);
  });

  it("rejects a protected parent", () => {
    expect(
      validateMenuPlacement(
        [contentMenu("systemSettings")],
        policy,
      ).some(
        error => error.code === "CONTENT_PARENT_NOT_ALLOWED",
      ),
    ).toBe(true);
  });

  it("rejects content menus without a parent", () => {
    expect(
      validateMenuPlacement(
        [contentMenu()],
        policy,
      ).some(
        error => error.code === "CONTENT_PARENT_NOT_ALLOWED",
      ),
    ).toBe(true);
  });

  it("rejects unlisted nested parents", () => {
    expect(
      validateMenuPlacement(
        [contentMenu("documentationFolder")],
        policy,
      ).some(
        error => error.code === "CONTENT_PARENT_NOT_ALLOWED",
      ),
    ).toBe(true);
  });

  it("does not restrict existing application menus", () => {
    const applicationMenu: EditorMenuEntry = {
      id: "projectSetup",
      source: "application",
      caption: "Project Setup",
      position: 1,
      parentId: "applicationRoot",
      menuID: 100,
    };

    expect(
      validateMenuPlacement(
        [applicationMenu],
        policy,
      ),
    ).toEqual([]);
  });
});
