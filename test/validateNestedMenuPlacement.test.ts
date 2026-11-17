import type {
  EditorMenuEntry,
  EditorDraft,
} from "../src/template/editor/model/editorTypes";

import { validateMenuPlacement } from "../src/template/editor/validation/validateMenuPlacement";
import { validateMenuDraft } from "../src/template/editor/validation/validateMenuDraft";

const policy = {
  allowedContentParentIds: ["static:3900"],
};

const root: EditorMenuEntry = {
  id: "static:3900",
  source: "application",
  caption: "Application",
  position: 1,
};

function folder(
  id: string,
  parentId: string,
): EditorMenuEntry {
  return {
    id,
    source: "content",
    parentId,
    caption: id,
    position: 1,
  };
}

function page(
  id: string,
  parentId: string,
): EditorMenuEntry {
  return {
    ...folder(id, parentId),
    contentPageId: "page:" + id,
  };
}

describe("nested content menu placement", () => {
  it("allows a page directly under the configured root", () => {
    expect(
      validateMenuPlacement(
        [root, page("content:a", root.id)],
        policy,
      ),
    ).toEqual([]);
  });

  it("allows a page inside a content folder", () => {
    expect(
      validateMenuPlacement(
        [
          root,
          folder("content:docs", root.id),
          page("content:a", "content:docs"),
        ],
        policy,
      ),
    ).toEqual([]);
  });

  it("allows nested content folders", () => {
    expect(
      validateMenuPlacement(
        [
          root,
          folder("content:docs", root.id),
          folder("content:examples", "content:docs"),
          page("content:a", "content:examples"),
        ],
        policy,
      ),
    ).toEqual([]);
  });

  it("rejects a page as parent", () => {
    const errors = validateMenuPlacement(
      [
        root,
        page("content:a", root.id),
        folder("content:child", "content:a"),
      ],
      policy,
    );

    expect(errors).toContainEqual(
      expect.objectContaining({
        code: "CONTENT_PARENT_IS_PAGE",
        entryId: "content:child",
      }),
    );
  });

  it("rejects content outside the allowed subtree", () => {
    const errors = validateMenuPlacement(
      [
        root,
        {
          id: "static:other",
          source: "application",
          caption: "Other",
          position: 2,
        },
        folder("content:a", "static:other"),
      ],
      policy,
    );

    expect(errors).toContainEqual(
      expect.objectContaining({
        code: "CONTENT_PARENT_NOT_ALLOWED",
        entryId: "content:a",
      }),
    );
  });

  it("rejects cyclic parent relationships structurally", () => {
    const draft: EditorDraft = {
      schemaVersion: 1,
      applicationId: "test-app",
      entries: [
        root,
        folder("content:a", "content:b"),
        folder("content:b", "content:a"),
      ],
      pages: [],
    };

    expect(
      validateMenuDraft(draft),
    ).toContainEqual(
      expect.objectContaining({
        code: "CYCLIC_PARENT",
      }),
    );
  });

  it("does not trust a content entry posing as an allowed root", () => {
    const entries: EditorMenuEntry[] = [
      {
        id: "static:3900",
        source: "content",
        caption: "Fake root",
        position: 1,
      },
      folder("content:child", "static:3900"),
    ];

    expect(
      validateMenuPlacement(entries, policy),
    ).toContainEqual(
      expect.objectContaining({
        code: "CONTENT_PARENT_NOT_ALLOWED",
        entryId: "content:child",
      }),
    );
  });
});