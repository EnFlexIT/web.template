import type {
  EditorDraft,
  EditorMenuEntry,
} from "../src/template/editor/model/editorTypes";

import {
  validateMenuDraft,
} from "../src/template/editor/validation/validateMenuDraft";

import {
  isStoredContentEntry,
} from "../src/template/editor/storage/storedDraftGuards";

const folder: EditorMenuEntry = {
  id: "content:folder-1",
  source: "content",
  parentId: "static:3900",
  caption: "Dokumentation",
  position: 1,
};

function createDraft(): EditorDraft {
  return {
    schemaVersion: 1,
    applicationId: "test-app",
    entries: [
      {
        id: "static:3900",
        source: "application",
        menuID: 3900,
        caption: "Application",
        position: 1,
      },
      { ...folder },
    ],
    pages: [],
  };
}

describe("content folder validation", () => {
  it("accepts a content folder without a page", () => {
    expect(validateMenuDraft(createDraft())).toEqual([]);
  });

  it("accepts stored content folders without a page", () => {
    expect(isStoredContentEntry(folder)).toBe(true);
  });

  it("still accepts stored content menus with a page", () => {
    expect(
      isStoredContentEntry({
        ...folder,
        contentPageId: "page:1",
      }),
    ).toBe(true);
  });

  it("rejects an empty page reference", () => {
    const draft = createDraft();
    draft.entries[1].contentPageId = "";

    expect(
      validateMenuDraft(draft).some(
        error => error.code === "MISSING_CONTENT_PAGE",
      ),
    ).toBe(true);

    expect(
      isStoredContentEntry({
        ...folder,
        contentPageId: "",
      }),
    ).toBe(false);
  });

  it("rejects a nonexistent page reference", () => {
    const draft = createDraft();
    draft.entries[1].contentPageId = "page:missing";

    expect(
      validateMenuDraft(draft).some(
        error => error.code === "MISSING_CONTENT_PAGE",
      ),
    ).toBe(true);
  });

  it("rejects an invalid stored page reference type", () => {
    expect(
      isStoredContentEntry({
        ...folder,
        contentPageId: 123,
      }),
    ).toBe(false);
  });
});