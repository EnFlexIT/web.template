import {
  setContentMenuVisibility,
} from "../src/template/editor/utils/setContentMenuVisibility";

import type {
  EditorDraft,
} from "../src/template/editor/model/editorTypes";

function createDraft(): EditorDraft {
  return {
    schemaVersion: 1,
    applicationId: "test-app",
    entries: [
      {
        id: "static:1",
        source: "template",
        caption: "Settings",
        position: 1,
      },
      {
        id: "content:folder",
        source: "content",
        parentId: "static:1",
        caption: "Dokumentation",
        position: 1,
      },
      {
        id: "content:page",
        source: "content",
        parentId: "content:folder",
        caption: "Anleitung",
        contentPageId: "page:guide",
        position: 1,
      },
    ],
    pages: [
      {
        id: "page:guide",
        title: "Anleitung",
        blocks: [],
      },
    ],
  };
}

describe("setContentMenuVisibility", () => {
  it("hides a content entry without deleting it", () => {
    const original = createDraft();

    const result = setContentMenuVisibility(
      original,
      "content:page",
      true,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.draft.entries).toHaveLength(3);
    expect(result.draft.entries[2].hidden).toBe(true);
    expect(result.draft.pages).toEqual(original.pages);
    expect(original.entries[2].hidden).toBeUndefined();
  });

  it("can make a hidden entry visible again", () => {
    const draft = createDraft();
    const hidden = setContentMenuVisibility(
      draft,
      "content:page",
      true,
    );

    expect(hidden.ok).toBe(true);
    if (!hidden.ok) return;

    const visible = setContentMenuVisibility(
      hidden.draft,
      "content:page",
      false,
    );

    expect(visible.ok).toBe(true);
    if (!visible.ok) return;

    expect(visible.draft.entries[2].hidden).toBe(false);
    expect(visible.draft.entries[2].contentPageId)
      .toBe("page:guide");
  });

  it("preserves unrelated entries and positions", () => {
    const original = createDraft();

    const result = setContentMenuVisibility(
      original,
      "content:folder",
      true,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.draft.entries[0]).toEqual(original.entries[0]);
    expect(result.draft.entries[2]).toEqual(original.entries[2]);
    expect(result.draft.entries.map(entry => entry.position))
      .toEqual([1, 1, 1]);
  });

  it("rejects changes to template menus", () => {
    const original = createDraft();

    expect(
      setContentMenuVisibility(original, "static:1", true),
    ).toEqual({
      ok: false,
      reason: "NOT_CONTENT",
    });
  });

  it("rejects unknown entries", () => {
    const original = createDraft();

    expect(
      setContentMenuVisibility(original, "missing", true),
    ).toEqual({
      ok: false,
      reason: "NOT_FOUND",
    });
  });
});