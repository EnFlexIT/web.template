import type {
  EditorContentPage,
  EditorDraft,
} from "@/template/editor/model/editorTypes";

import {
  updateContentPageInDraft,
} from "@/template/editor/utils/updateContentPageInDraft";

describe("updateContentPageInDraft", () => {
  const originalPage: EditorContentPage = {
    id: "page:local-1",
    title: "Anleitung",
    blocks: [
      {
        id: "block:local-1",
        type: "text",
        html: "<p>Original</p>",
      },
    ],
  };

  const otherPage: EditorContentPage = {
    id: "page:local-2",
    title: "Andere Seite",
    blocks: [],
  };

  function createDraft(): EditorDraft {
    return {
      schemaVersion: 1,
      applicationId: "test-application",
      entries: [
        {
          id: "menu:local-1",
          source: "content",
          caption: "Anleitung",
          position: 0,
          contentPageId: "page:local-1",
        },
      ],
      pages: [
        JSON.parse(JSON.stringify(originalPage)),
        JSON.parse(JSON.stringify(otherPage)),
      ],
    };
  }

  it("updates only the selected page", () => {
    const draft = createDraft();

    const updatedPage = {
      ...originalPage,
      title: "Neue Anleitung",
    };

    const result = updateContentPageInDraft(
      draft,
      originalPage,
      updatedPage,
    );

    expect(result.ok).toBe(true);

    if (!result.ok) return;

    expect(result.draft.pages[0].title).toBe("Neue Anleitung");
    expect(result.draft.pages[1]).toEqual(otherPage);
    expect(result.draft.entries).toEqual(draft.entries);
    expect(draft.pages[0].title).toBe("Anleitung");
  });

  it("rejects concurrent page changes", () => {
    const draft = createDraft();
    draft.pages[0].title = "Zwischenzeitlich geändert";

    const result = updateContentPageInDraft(
      draft,
      originalPage,
      {
        ...originalPage,
        title: "Andere Änderung",
      },
    );

    expect(result).toEqual({
      ok: false,
      reason: "conflict",
    });
  });

  it("rejects missing pages", () => {
    const draft = createDraft();
    draft.pages = [otherPage];

    const result = updateContentPageInDraft(
      draft,
      originalPage,
      {
        ...originalPage,
        title: "Neue Anleitung",
      },
    );

    expect(result).toEqual({
      ok: false,
      reason: "not-found",
    });
  });

  it("does not update unchanged pages", () => {
    const draft = createDraft();

    const result = updateContentPageInDraft(
      draft,
      originalPage,
      {
        ...originalPage,
        blocks: originalPage.blocks.map(block => ({ ...block })),
      },
    );

    expect(result).toEqual({
      ok: false,
      reason: "unchanged",
    });
  });
});