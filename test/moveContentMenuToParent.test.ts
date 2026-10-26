import type { EditorDraft } from "../src/template/editor/model/editorTypes";
import type {
  ProtectedMenuEntry,
  TrustedMenuInventory,
} from "../src/template/editor/model/menuProtection";
import { moveContentMenuToParent } from "../src/template/editor/utils/moveContentMenuToParent";
import { validateEditorDraft } from "../src/template/editor/validation/validateEditorDraft";

const policy = {
  allowedContentParentIds: ["static:3900"],
};

function fixture() {
  const draft: EditorDraft = {
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
        id: "static:other",
        source: "application",
        menuID: 4000,
        caption: "Other",
        position: 2,
      },
      {
        id: "content:docs",
        source: "content",
        parentId: "static:3900",
        caption: "Dokumentation",
        position: 1,
      },
      {
        id: "content:examples",
        source: "content",
        parentId: "content:docs",
        caption: "Beispiele",
        position: 1,
      },
      {
        id: "content:hello",
        source: "content",
        parentId: "static:3900",
        caption: "hello",
        position: 2,
        contentPageId: "page:hello",
      },
    ],
    pages: [
      {
        id: "page:hello",
        title: "hello",
        blocks: [
          { id: "block:1", type: "text", html: "<p>Hallo</p>" },
        ],
      },
    ],
  };

  const protectedEntries: ProtectedMenuEntry[] = draft.entries
    .filter(entry => entry.source !== "content")
    .map(entry => ({
      original: { ...entry },
      permissions: {
        allowCaptionChange: false,
        allowPositionChange: false,
        allowParentChange: false,
      },
    }));

  const inventory: TrustedMenuInventory = {
    applicationId: draft.applicationId,
    staticMenuIds: protectedEntries.map(item => item.original.id),
  };

  return { draft, protectedEntries, inventory };
}

describe("moveContentMenuToParent", () => {
  it("moves a page into a content folder without losing its contents", () => {
    const { draft, protectedEntries, inventory } = fixture();

    const result = moveContentMenuToParent(
      draft, policy, protectedEntries, inventory,
      "content:hello", "content:docs",
    );

    expect(result.ok).toBe(true);

    if (result.ok) {
      const moved = result.draft.entries.find(
        entry => entry.id === "content:hello",
      );

      expect(moved?.parentId).toBe("content:docs");
      expect(moved?.position).toBe(2);
      expect(result.draft.pages).toEqual(draft.pages);
      expect(draft.entries.find(
        entry => entry.id === "content:hello",
      )?.parentId).toBe("static:3900");
      expect(validateEditorDraft(
        result.draft, protectedEntries, policy, inventory,
      )).toEqual([]);
    }
  });

  it("moves a complete folder with its children", () => {
    const { draft, protectedEntries, inventory } = fixture();

    const result = moveContentMenuToParent(
      draft, policy, protectedEntries, inventory,
      "content:examples", "static:3900",
    );

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.draft.entries.find(
        entry => entry.id === "content:examples",
      )?.parentId).toBe("static:3900");
    }
  });

  it("rejects moving protected menus", () => {
    const { draft, protectedEntries, inventory } = fixture();

    expect(moveContentMenuToParent(
      draft, policy, protectedEntries, inventory,
      "static:3900", "content:docs",
    )).toEqual({ ok: false, reason: "MENU_PROTECTED" });
  });

  it("rejects missing menus", () => {
    const { draft, protectedEntries, inventory } = fixture();

    expect(moveContentMenuToParent(
      draft, policy, protectedEntries, inventory,
      "content:missing", "content:docs",
    )).toEqual({ ok: false, reason: "MENU_NOT_FOUND" });
  });

  it("rejects missing parents", () => {
    const { draft, protectedEntries, inventory } = fixture();

    expect(moveContentMenuToParent(
      draft, policy, protectedEntries, inventory,
      "content:hello", "content:missing",
    )).toEqual({ ok: false, reason: "PARENT_NOT_FOUND" });
  });

  it("rejects moving under a content page", () => {
    const { draft, protectedEntries, inventory } = fixture();

    expect(moveContentMenuToParent(
      draft, policy, protectedEntries, inventory,
      "content:examples", "content:hello",
    )).toEqual({ ok: false, reason: "PARENT_NOT_ALLOWED" });
  });

  it("rejects moving into a protected area outside the allowlist", () => {
    const { draft, protectedEntries, inventory } = fixture();

    expect(moveContentMenuToParent(
      draft, policy, protectedEntries, inventory,
      "content:hello", "static:other",
    )).toEqual({ ok: false, reason: "PARENT_NOT_ALLOWED" });
  });

  it("rejects moving a folder into itself", () => {
    const { draft, protectedEntries, inventory } = fixture();

    expect(moveContentMenuToParent(
      draft, policy, protectedEntries, inventory,
      "content:docs", "content:docs",
    )).toEqual({ ok: false, reason: "CYCLIC_PARENT" });
  });

  it("rejects moving a folder into its descendant", () => {
    const { draft, protectedEntries, inventory } = fixture();

    expect(moveContentMenuToParent(
      draft, policy, protectedEntries, inventory,
      "content:docs", "content:examples",
    )).toEqual({ ok: false, reason: "CYCLIC_PARENT" });
  });
});