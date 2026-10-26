import type { EditorDraft } from "../src/template/editor/model/editorTypes";
import { deleteContentMenuFromDraft } from "../src/template/editor/utils/deleteContentMenuFromDraft";

const createDraft = (): EditorDraft => ({
  schemaVersion: 1,
  applicationId: "test-app",
  entries: [
    { id: "static:1", source: "application", caption: "Settings", position: 1 },
    {
      id: "content:1",
      source: "content",
      parentId: "static:1",
      caption: "Documentation",
      position: 2,
      contentPageId: "page:1",
    },
  ],
  pages: [
    { id: "page:1", title: "Documentation", blocks: [] },
  ],
});

describe("deleteContentMenuFromDraft", () => {
  it("deletes the menu and its page", () => {
    const draft = createDraft();
    const result = deleteContentMenuFromDraft(draft, "content:1");

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.draft.entries).toHaveLength(1);
      expect(result.draft.pages).toHaveLength(0);
      expect(draft.entries).toHaveLength(2);
      expect(draft.pages).toHaveLength(1);
    }
  });

  it("rejects protected menus", () => {
    expect(deleteContentMenuFromDraft(createDraft(), "static:1"))
      .toEqual({ ok: false, reason: "MENU_PROTECTED" });
  });

  it("rejects missing menus", () => {
    expect(deleteContentMenuFromDraft(createDraft(), "missing"))
      .toEqual({ ok: false, reason: "MENU_NOT_FOUND" });
  });

  it("rejects menus with children", () => {
    const draft = createDraft();
    draft.entries.push({
      id: "content:2",
      source: "content",
      parentId: "content:1",
      caption: "Child",
      position: 1,
      contentPageId: "page:2",
    });
    draft.pages.push({ id: "page:2", title: "Child", blocks: [] });

    expect(deleteContentMenuFromDraft(draft, "content:1"))
      .toEqual({ ok: false, reason: "HAS_CHILDREN" });
  });

  it("rejects shared content pages", () => {
    const draft = createDraft();
    draft.entries.push({
      id: "content:2",
      source: "content",
      parentId: "static:1",
      caption: "Another",
      position: 3,
      contentPageId: "page:1",
    });

    expect(deleteContentMenuFromDraft(draft, "content:1"))
      .toEqual({ ok: false, reason: "SHARED_CONTENT_PAGE" });
  });
});