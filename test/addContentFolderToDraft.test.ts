import type { EditorDraft } from "../src/template/editor/model/editorTypes";
import type {
  ProtectedMenuEntry,
  TrustedMenuInventory,
} from "../src/template/editor/model/menuProtection";
import { addContentFolderToDraft } from "../src/template/editor/utils/addContentFolderToDraft";

const policy = {
  allowedContentParentIds: ["static:3900"],
};

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
        id: "content:existing",
        source: "content",
        parentId: "static:3900",
        caption: "Existing",
        position: 2,
        contentPageId: "page:existing",
      },
    ],
    pages: [
      {
        id: "page:existing",
        title: "Existing",
        blocks: [],
      },
    ],
  };
}

const protectedEntries: ProtectedMenuEntry[] = [
  {
    original: createDraft().entries[0],
    permissions: {
      allowCaptionChange: false,
      allowPositionChange: false,
      allowParentChange: false,
    },
  },
];

const inventory: TrustedMenuInventory = {
  applicationId: "test-app",
  staticMenuIds: ["static:3900"],
};
describe("addContentFolderToDraft", () => {
  it("creates a folder without a content page", () => {
    const original = createDraft();

    const result = addContentFolderToDraft(
      original,
      policy, protectedEntries, inventory,
      "static:3900",
      "  Dokumentation  ",
      "content:folder-1",
    );

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.entryId).toBe("content:folder-1");
      expect(result.draft.entries[2]).toEqual({
        id: "content:folder-1",
        source: "content",
        parentId: "static:3900",
        caption: "Dokumentation",
        position: 3,
      });
      expect(result.draft.pages).toEqual(original.pages);
      expect(original.entries).toHaveLength(2);
    }
  });

  it("rejects empty titles", () => {
    expect(
      addContentFolderToDraft(
        createDraft(), policy, protectedEntries, inventory, "static:3900", "  ", "content:new",
      ),
    ).toEqual({ ok: false, reason: "INVALID_TITLE" });
  });

  it("rejects parents that do not exist", () => {
    expect(
      addContentFolderToDraft(
        createDraft(), policy, protectedEntries, inventory, "static:999", "Folder", "content:new",
      ),
    ).toEqual({ ok: false, reason: "PARENT_NOT_FOUND" });
  });

  it("rejects approved but missing parents", () => {
    const otherPolicy = {
      allowedContentParentIds: ["static:missing"],
    };

    expect(
      addContentFolderToDraft(
        createDraft(), otherPolicy, protectedEntries, inventory, "static:missing", "Folder", "content:new",
      ),
    ).toEqual({ ok: false, reason: "PARENT_NOT_FOUND" });
  });

  it("rejects duplicate IDs", () => {
    expect(
      addContentFolderToDraft(
        createDraft(), policy, protectedEntries, inventory, "static:3900", "Folder", "content:existing",
      ),
    ).toEqual({ ok: false, reason: "DUPLICATE_ID" });
  });

  it("rejects IDs without the content namespace", () => {
    expect(
      addContentFolderToDraft(
        createDraft(), policy, protectedEntries, inventory, "static:3900", "Folder", "static:123",
      ),
    ).toEqual({ ok: false, reason: "DUPLICATE_ID" });
  });

  it("rejects nesting under an unapproved content menu", () => {
    expect(
      addContentFolderToDraft(
        createDraft(), policy, protectedEntries, inventory, "content:existing", "Folder", "content:new",
      ),
    ).toEqual({ ok: false, reason: "PARENT_NOT_ALLOWED" });
  });
});