import type {
  EditorDraft,
} from "../src/template/editor/model/editorTypes";

import {
  renameContentMenuInDraft,
} from "../src/template/editor/utils/renameContentMenuInDraft";

const createDraft = (): EditorDraft => ({
  schemaVersion: 1,
  applicationId: "test-app",
  entries: [
    {
      id: "static:100",
      source: "application",
      caption: "Settings",
      position: 1,
    },
    {
      id: "content:1",
      source: "content",
      parentId: "static:100",
      caption: "Old title",
      position: 2,
      contentPageId: "page:1",
    },
  ],
  pages: [
    {
      id: "page:1",
      title: "Page title",
      blocks: [],
    },
  ],
});

describe("renameContentMenuInDraft", () => {
  it("renames an editable content menu", () => {
    const draft = createDraft();

    const result = renameContentMenuInDraft(
      draft,
      "content:1",
      "New title",
    );

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.draft.entries[1].caption)
        .toBe("New title");
      expect(result.draft.pages[0].title)
        .toBe("Page title");
      expect(draft.entries[1].caption)
        .toBe("Old title");
    }
  });

  it("rejects protected Application menus", () => {
    const result = renameContentMenuInDraft(
      createDraft(),
      "static:100",
      "Changed",
    );

    expect(result).toEqual({
      ok: false,
      reason: "MENU_PROTECTED",
    });
  });

  it("rejects empty titles", () => {
    const result = renameContentMenuInDraft(
      createDraft(),
      "content:1",
      "   ",
    );

    expect(result).toEqual({
      ok: false,
      reason: "INVALID_TITLE",
    });
  });

  it("rejects missing menus", () => {
    const result = renameContentMenuInDraft(
      createDraft(),
      "content:unknown",
      "Changed",
    );

    expect(result).toEqual({
      ok: false,
      reason: "MENU_NOT_FOUND",
    });
  });

  it("preserves menu position and parent", () => {
    const draft = createDraft();

    const result = renameContentMenuInDraft(
      draft,
      "content:1",
      "Renamed",
    );

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.draft.entries[1].position)
        .toBe(2);
      expect(result.draft.entries[1].parentId)
        .toBe("static:100");
    }
  });
});