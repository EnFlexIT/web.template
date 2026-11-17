import type { EditorDraft } from "../src/template/editor/model/editorTypes";
import type {
  ProtectedMenuEntry,
  TrustedMenuInventory,
} from "../src/template/editor/model/menuProtection";
import { buildLocalContentPreview } from "../src/template/editor/adapters/buildLocalContentPreview";

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
        id: "content:hello",
        source: "content",
        parentId: "static:3900",
        caption: "hello",
        position: 2,
        contentPageId: "page:hello",
      },
      {
        id: "content:docs",
        source: "content",
        parentId: "static:3900",
        caption: "Dokumentation",
        position: 1,
      },
      {
        id: "content:guide",
        source: "content",
        parentId: "content:docs",
        caption: "Anleitung",
        position: 1,
        contentPageId: "page:guide",
      },
      {
        id: "content:examples",
        source: "content",
        parentId: "content:docs",
        caption: "Beispiele",
        position: 2,
      },
    ],
    pages: [
      {
        id: "page:hello",
        title: "hello",
        blocks: [],
      },
      {
        id: "page:guide",
        title: "Anleitung",
        blocks: [],
      },
    ],
  };

  const protectedEntries: ProtectedMenuEntry[] = [{
    original: { ...draft.entries[0] },
    permissions: {
      allowCaptionChange: false,
      allowPositionChange: false,
      allowParentChange: false,
    },
  }];

  const inventory: TrustedMenuInventory = {
    applicationId: draft.applicationId,
    staticMenuIds: ["static:3900"],
  };

  return { draft, protectedEntries, inventory };
}

describe("buildLocalContentPreview", () => {
  it("builds nested content folders and pages", () => {
    const { draft, protectedEntries, inventory } = fixture();

    const result = buildLocalContentPreview(
      draft, protectedEntries, policy, inventory,
    );

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.roots[0].caption).toBe("Dokumentation");
      expect(result.roots[0].children.map(item => item.caption))
        .toEqual(["Anleitung", "Beispiele"]);
    }
  });

  it("sorts root entries by position", () => {
    const { draft, protectedEntries, inventory } = fixture();

    const result = buildLocalContentPreview(
      draft, protectedEntries, policy, inventory,
    );

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.roots.map(item => item.caption))
        .toEqual(["Dokumentation", "hello"]);
    }
  });

  it("retains the trusted static parent reference", () => {
    const { draft, protectedEntries, inventory } = fixture();

    const result = buildLocalContentPreview(
      draft, protectedEntries, policy, inventory,
    );

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.roots.every(
        item => item.parentId === "static:3900",
      )).toBe(true);
    }
  });

  it("preserves content page identifiers", () => {
    const { draft, protectedEntries, inventory } = fixture();

    const result = buildLocalContentPreview(
      draft, protectedEntries, policy, inventory,
    );

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.roots[0].children[0].contentPageId)
        .toBe("page:guide");
      expect(result.roots[1].contentPageId)
        .toBe("page:hello");
    }
  });

  it("rejects invalid drafts", () => {
    const { draft, protectedEntries, inventory } = fixture();

    const invalidDraft: EditorDraft = {
      ...draft,
      entries: draft.entries.map(entry =>
        entry.id === "content:hello"
          ? { ...entry, parentId: "static:missing" }
          : entry,
      ),
    };

    expect(buildLocalContentPreview(
      invalidDraft, protectedEntries, policy, inventory,
    )).toEqual({
      ok: false,
      reason: "INVALID_DRAFT",
    });
  });

  it("does not mutate the original draft", () => {
    const { draft, protectedEntries, inventory } = fixture();
    const original = JSON.stringify(draft);

    buildLocalContentPreview(
      draft, protectedEntries, policy, inventory,
    );

    expect(JSON.stringify(draft)).toBe(original);
  });
});