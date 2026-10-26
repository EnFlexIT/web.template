import type {
  EditorDraft,
} from "../src/template/editor/model/editorTypes";

import {
  addTextBlockToDraft,
  updateTextBlockInDraft,
} from "../src/template/editor/utils/textBlockDraft";

function createDraft(): EditorDraft {
  return {
    schemaVersion: 1,
    applicationId: "hems",
    entries: [],
    pages: [
      {
        id: "page:1",
        title: "Dokumentation",
        blocks: [],
      },
      {
        id: "page:2",
        title: "Weitere Seite",
        blocks: [],
      },
    ],
  };
}

describe("textBlockDraft", () => {
  it("adds a text block to the selected page", () => {
    const draft = createDraft();

    const result = addTextBlockToDraft(
      draft, "page:1", "block:1",
    );

    expect(result.ok).toBe(true);

    if (!result.ok) return;

    expect(result.draft.pages[0].blocks).toEqual([
      {
        id: "block:1",
        type: "text",
        html: "<p></p>",
      },
    ]);

    expect(result.draft.pages[1].blocks).toEqual([]);
  });

  it("rejects missing pages when adding blocks", () => {
    const result = addTextBlockToDraft(
      createDraft(), "missing", "block:1",
    );

    expect(result).toEqual({
      ok: false,
      reason: "PAGE_NOT_FOUND",
    });
  });

  it("rejects empty block IDs", () => {
    const result = addTextBlockToDraft(
      createDraft(), "page:1", "  ",
    );

    expect(result).toEqual({
      ok: false,
      reason: "INVALID_BLOCK_ID",
    });
  });

  it("rejects duplicate IDs across pages", () => {
    const draft = createDraft();

    draft.pages[1].blocks.push({
      id: "block:1",
      type: "image",
      assetId: "asset:1",
      alt: "Example",
    });

    expect(addTextBlockToDraft(
      draft, "page:1", "block:1",
    )).toEqual({
      ok: false,
      reason: "DUPLICATE_BLOCK_ID",
    });
  });

  it("updates HTML on the correct text block", () => {
    const draft = createDraft();

    draft.pages[0].blocks.push({
      id: "block:1",
      type: "text",
      html: "<p>Alt</p>",
    });

    const result = updateTextBlockInDraft(
      draft,
      "page:1",
      "block:1",
      "<p><strong>Neu</strong></p>",
    );

    expect(result.ok).toBe(true);

    if (!result.ok) return;

    expect(result.draft.pages[0].blocks[0]).toEqual({
      id: "block:1",
      type: "text",
      html: "<p><strong>Neu</strong></p>",
    });

    expect(draft.pages[0].blocks[0]).toEqual({
      id: "block:1",
      type: "text",
      html: "<p>Alt</p>",
    });
  });

  it("rejects updates to missing blocks", () => {
    expect(updateTextBlockInDraft(
      createDraft(),
      "page:1",
      "missing",
      "<p>Text</p>",
    )).toEqual({
      ok: false,
      reason: "BLOCK_NOT_FOUND",
    });
  });

  it("rejects updating an image block as text", () => {
    const draft = createDraft();

    draft.pages[0].blocks.push({
      id: "image:1",
      type: "image",
      assetId: "asset:1",
      alt: "Bild",
    });

    expect(updateTextBlockInDraft(
      draft,
      "page:1",
      "image:1",
      "<p>Text</p>",
    )).toEqual({
      ok: false,
      reason: "BLOCK_NOT_FOUND",
    });
  });

  it("rejects updates to missing pages", () => {
    expect(updateTextBlockInDraft(
      createDraft(),
      "missing",
      "block:1",
      "<p>Text</p>",
    )).toEqual({
      ok: false,
      reason: "PAGE_NOT_FOUND",
    });
  });

  it("preserves the original draft when adding", () => {
    const draft = createDraft();

    const result = addTextBlockToDraft(
      draft, "page:1", "block:1",
    );

    expect(result.ok).toBe(true);
    expect(draft.pages[0].blocks).toEqual([]);
  });
});
