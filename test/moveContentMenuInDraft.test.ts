import type { EditorDraft } from "../src/template/editor/model/editorTypes";
import { moveContentMenuInDraft } from "../src/template/editor/utils/moveContentMenuInDraft";
import { buildMenuTreeRows } from "../src/template/editor/utils/buildMenuTreeRows";

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
      {
        id: "content:first",
        source: "content",
        parentId: "static:3900",
        caption: "First",
        position: 1,
      },
      {
        id: "content:second",
        source: "content",
        parentId: "static:3900",
        caption: "Second",
        position: 2,
      },
      {
        id: "content:third",
        source: "content",
        parentId: "static:3900",
        caption: "Third",
        position: 3,
      },
    ],
    pages: [],
  };
}

function order(draft: EditorDraft): string[] {
  return buildMenuTreeRows(draft.entries)
    .filter(row => row.entry.source === "content")
    .map(row => row.entry.id);
}

describe("moveContentMenuInDraft", () => {
  it("moves a menu down", () => {
    const original = createDraft();
    const result = moveContentMenuInDraft(
      original, "content:first", "down",
    );

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(order(result.draft)).toEqual([
        "content:second",
        "content:first",
        "content:third",
      ]);
      expect(order(original)).toEqual([
        "content:first",
        "content:second",
        "content:third",
      ]);
    }
  });

  it("moves a menu up", () => {
    const result = moveContentMenuInDraft(
      createDraft(), "content:third", "up",
    );

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(order(result.draft)).toEqual([
        "content:first",
        "content:third",
        "content:second",
      ]);
    }
  });

  it("rejects protected menus", () => {
    expect(
      moveContentMenuInDraft(
        createDraft(), "static:3900", "down",
      ),
    ).toEqual({
      ok: false,
      reason: "MENU_PROTECTED",
    });
  });

  it("rejects unknown menus", () => {
    expect(
      moveContentMenuInDraft(
        createDraft(), "content:missing", "up",
      ),
    ).toEqual({
      ok: false,
      reason: "MENU_NOT_FOUND",
    });
  });

  it("rejects moving past the first sibling", () => {
    expect(
      moveContentMenuInDraft(
        createDraft(), "content:first", "up",
      ),
    ).toEqual({
      ok: false,
      reason: "NO_SIBLING",
    });
  });

  it("exposes the duplicate-position problem", () => {
    const draft = createDraft();
    draft.entries[2].position = 1;

    const result = moveContentMenuInDraft(
      draft, "content:first", "down",
    );

    expect(result.ok).toBe(true);

    if (result.ok) {
      // Must change the actual visible order.
      expect(order(result.draft)).toEqual([
        "content:second",
        "content:first",
        "content:third",
      ]);
    }
  });
});