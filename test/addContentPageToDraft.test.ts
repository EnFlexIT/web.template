import type { EditorDraft } from "../src/template/editor/model/editorTypes";
import type {
  ProtectedMenuEntry,
  TrustedMenuInventory,
} from "../src/template/editor/model/menuProtection";
import { addContentPageToDraft } from "../src/template/editor/utils/addContentPageToDraft";

function createFixture() {
  const draft: EditorDraft = {
    schemaVersion: 1,
    applicationId: "hems",
    entries: [
      {
        id: "static:100",
        source: "application",
        menuID: 100,
        caption: "Application",
        position: 1,
      },
      {
        id: "static:200",
        source: "template",
        menuID: 200,
        caption: "Settings",
        position: 2,
      },
    ],
    pages: [],
  };

  const policy = {
    allowedContentParentIds: ["static:100"],
  };

  return { draft, policy };
}

function createProtection(draft: EditorDraft) {
  const protectedEntries: ProtectedMenuEntry[] = draft.entries
    .filter(entry => entry.source !== "content")
    .map(entry => ({
      original: entry,
      permissions: {
        allowCaptionChange: false,
        allowPositionChange: false,
        allowParentChange: false,
      },
    }));

  const inventory: TrustedMenuInventory = {
    applicationId: draft.applicationId,
    staticMenuIds: protectedEntries.map(entry => entry.original.id),
  };

  return { protectedEntries, inventory };
}
describe("addContentPageToDraft", () => {
  it("adds a content menu and its page", () => {
    const { draft, policy } = createFixture();
    const { protectedEntries, inventory } = createProtection(draft);

    const result = addContentPageToDraft(
      draft,
      policy, protectedEntries, inventory,
      "static:100",
      "Documentation",
      "content:1",
      "page:1",
    );

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(result.entryId).toBe("content:1");
    expect(result.draft.entries[2]).toEqual({
      id: "content:1",
      source: "content",
      parentId: "static:100",
      caption: "Documentation",
      position: 1,
      contentPageId: "page:1",
    });

    expect(result.draft.pages[0]).toEqual({
      id: "page:1",
      title: "Documentation",
      blocks: [],
    });
  });

  it("rejects content below a protected menu", () => {
    const { draft, policy } = createFixture();
    const { protectedEntries, inventory } = createProtection(draft);

    expect(addContentPageToDraft(
      draft, policy, protectedEntries, inventory, "static:200", "Page", "content:1", "page:1",
    )).toEqual({
      ok: false,
      reason: "PARENT_NOT_ALLOWED",
    });
  });

  it("rejects parents that do not exist", () => {
    const { draft, policy } = createFixture();
    const { protectedEntries, inventory } = createProtection(draft);
    policy.allowedContentParentIds.push("static:999");

    expect(addContentPageToDraft(
      draft, policy, protectedEntries, inventory, "static:999", "Page", "content:1", "page:1",
    )).toEqual({
      ok: false,
      reason: "PARENT_NOT_FOUND",
    });
  });

  it("rejects empty titles", () => {
    const { draft, policy } = createFixture();
    const { protectedEntries, inventory } = createProtection(draft);

    expect(addContentPageToDraft(
      draft, policy, protectedEntries, inventory, "static:100", "  ", "content:1", "page:1",
    )).toEqual({
      ok: false,
      reason: "INVALID_TITLE",
    });
  });

  it("rejects duplicate menu IDs", () => {
    const { draft, policy } = createFixture();
    const { protectedEntries, inventory } = createProtection(draft);

    expect(addContentPageToDraft(
      draft, policy, protectedEntries, inventory, "static:100", "Page", "static:100", "page:1",
    )).toEqual({
      ok: false,
      reason: "DUPLICATE_ID",
    });
  });

  it("rejects duplicate page IDs", () => {
    const { draft, policy } = createFixture();
    const { protectedEntries, inventory } = createProtection(draft);

    draft.pages.push({
      id: "page:1",
      title: "Existing",
      blocks: [],
    });

    expect(addContentPageToDraft(
      draft, policy, protectedEntries, inventory, "static:100", "Page", "content:1", "page:1",
    )).toEqual({
      ok: false,
      reason: "DUPLICATE_ID",
    });
  });

  it("does not modify the original draft", () => {
    const { draft, policy } = createFixture();
    const { protectedEntries, inventory } = createProtection(draft);

    const result = addContentPageToDraft(
      draft, policy, protectedEntries, inventory, "static:100", "Page", "content:1", "page:1",
    );

    expect(result.ok).toBe(true);
    expect(draft.entries).toHaveLength(2);
    expect(draft.pages).toHaveLength(0);
  });

  it("places new pages after existing siblings", () => {
    const { draft, policy } = createFixture();
    const { protectedEntries, inventory } = createProtection(draft);

    draft.entries.push({
      id: "content:existing",
      source: "content",
      parentId: "static:100",
      caption: "Existing",
      position: 5,
      contentPageId: "page:existing",
    });

    const result = addContentPageToDraft(
      draft, policy, protectedEntries, inventory, "static:100", "New", "content:new", "page:new",
    );

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.draft.entries.at(-1)?.position).toBe(6);
    }
  });
});
