import type { EditorDraft } from "../src/template/editor/model/editorTypes";
import { moveContentMenuInDraft } from "../src/template/editor/utils/moveContentMenuInDraft";
import { buildMenuTreeRows } from "../src/template/editor/utils/buildMenuTreeRows";

function draft(): EditorDraft {
  return {
    schemaVersion: 1,
    applicationId: "test-app",
    entries: [
      { id: "static:root", source: "application", caption: "Root", position: 1 },
      { id: "content:a", source: "content", parentId: "static:root", caption: "A", position: 1 },
      { id: "content:b", source: "content", parentId: "static:root", caption: "B", position: 1 },
      { id: "content:c", source: "content", parentId: "static:root", caption: "C", position: 1 },
      { id: "content:d", source: "content", parentId: "static:root", caption: "D", position: 2 },
    ],
    pages: [],
  };
}

function order(value: EditorDraft): string[] {
  return buildMenuTreeRows(value.entries)
    .filter(row => row.entry.source === "content")
    .map(row => row.entry.id);
}

describe("moveContentMenuInDraft edge cases", () => {
  it("moves within several equal positions without changing other sibling order", () => {
    const result = moveContentMenuInDraft(draft(), "content:a", "down");

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(order(result.draft)).toEqual([
        "content:b", "content:a", "content:c", "content:d",
      ]);
    }
  });

  it("does not cross a protected sibling", () => {
    const value = draft();
    value.entries.push({
      id: "static:protected",
      source: "application",
      parentId: "static:root",
      caption: "Protected",
      position: 0,
    });

    expect(moveContentMenuInDraft(value, "content:a", "up"))
      .toEqual({ ok: false, reason: "PROTECTED_SIBLING" });
  });

  it("does not affect menus with other parents", () => {
    const value = draft();
    value.entries.push({
      id: "static:other",
      source: "application",
      caption: "Other",
      position: 2,
    });
    value.entries.push({
      id: "content:other",
      source: "content",
      parentId: "static:other",
      caption: "Other content",
      position: 8,
    });

    const result = moveContentMenuInDraft(value, "content:a", "down");

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(
        result.draft.entries.find(entry => entry.id === "content:other")?.position,
      ).toBe(8);
    }
  });
});