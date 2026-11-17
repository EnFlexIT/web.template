import type {
  EditorDraft,
} from "../src/template/editor/model/editorTypes";

import {
  validateMenuDraft,
} from "../src/template/editor/validation/validateMenuDraft";

function createValidDraft(): EditorDraft {
  return {
    schemaVersion: 1,
    applicationId: "test-application",
    entries: [
      {
        id: "home",
        source: "application",
        menuID: 100,
        caption: "Home",
        position: 1,
      },
      {
        id: "documentation",
        source: "content",
        parentId: "home",
        caption: "Documentation",
        position: 2,
        contentPageId: "page-1",
      },
    ],
    pages: [
      {
        id: "page-1",
        title: "Documentation",
        blocks: [],
      },
    ],
  };
}

describe("validateMenuDraft", () => {
  it("accepts a valid draft", () => {
    expect(validateMenuDraft(createValidDraft())).toEqual([]);
  });

  it("rejects duplicate semantic menu IDs", () => {
    const draft = createValidDraft();
    draft.entries[1].id = "home";

    expect(validateMenuDraft(draft)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "DUPLICATE_MENU_ID",
        }),
      ]),
    );
  });

  it("rejects duplicate numeric menu IDs", () => {
    const draft = createValidDraft();
    draft.entries[1].menuID = 100;

    expect(validateMenuDraft(draft)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "DUPLICATE_NUMERIC_ID",
        }),
      ]),
    );
  });

  it("rejects missing parents", () => {
    const draft = createValidDraft();
    draft.entries[1].parentId = "unknown";

    expect(validateMenuDraft(draft)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "MISSING_PARENT",
        }),
      ]),
    );
  });

  it("rejects cyclic parent relationships", () => {
    const draft = createValidDraft();
    draft.entries[0].parentId = "documentation";

    expect(validateMenuDraft(draft)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "CYCLIC_PARENT",
        }),
      ]),
    );
  });

  it("rejects missing content pages", () => {
    const draft = createValidDraft();
    draft.entries[1].contentPageId = "unknown-page";

    expect(validateMenuDraft(draft)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "MISSING_CONTENT_PAGE",
        }),
      ]),
    );
  });

  it("rejects content references on application menus", () => {
    const draft = createValidDraft();
    draft.entries[0].contentPageId = "page-1";

    expect(validateMenuDraft(draft)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "INVALID_CONTENT_REFERENCE",
        }),
      ]),
    );
  });
});
describe("validateMenuDraft - additional validation", () => {
  function validDraft(): import("../src/template/editor/model/editorTypes").EditorDraft {
    return {
      schemaVersion: 1,
      applicationId: "test-application",
      entries: [{
        id: "documentation",
        source: "content",
        caption: "Documentation",
        position: 1,
        contentPageId: "page-1",
      }],
      pages: [{
        id: "page-1",
        title: "Documentation",
        blocks: [],
      }],
    };
  }

  it("rejects empty menu captions", () => {
    const draft = validDraft();
    draft.entries[0].caption = "   ";

    expect(validateMenuDraft(draft)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "INVALID_CAPTION" }),
      ]),
    );
  });

  it("rejects invalid menu positions", () => {
    const draft = validDraft();
    draft.entries[0].position = -1;

    expect(validateMenuDraft(draft)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "INVALID_POSITION" }),
      ]),
    );
  });

  it("rejects duplicate content page IDs", () => {
    const draft = validDraft();
    draft.pages.push({
      id: "page-1",
      title: "Second page",
      blocks: [],
    });

    expect(validateMenuDraft(draft)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "DUPLICATE_CONTENT_PAGE_ID" }),
      ]),
    );
  });

  it("rejects empty content page titles", () => {
    const draft = validDraft();
    draft.pages[0].title = "  ";

    expect(validateMenuDraft(draft)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "INVALID_PAGE_TITLE" }),
      ]),
    );
  });

  it("rejects unsupported schema versions", () => {
    const draft = validDraft();
    (draft as { schemaVersion: number }).schemaVersion = 2;

    expect(validateMenuDraft(draft)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "INVALID_SCHEMA_VERSION" }),
      ]),
    );
  });
});
