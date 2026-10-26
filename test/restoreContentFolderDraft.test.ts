import type { EditorDraft } from "../src/template/editor/model/editorTypes";
import type {
  ProtectedMenuEntry,
  TrustedMenuInventory,
} from "../src/template/editor/model/menuProtection";

import { restoreLocalEditorDraft } from "../src/template/editor/storage/restoreLocalEditorDraft";

const staticEntry = {
  id: "static:3900",
  source: "application" as const,
  menuID: 3900,
  caption: "Application",
  position: 1,
};

const protectedEntries: ProtectedMenuEntry[] = [{
  original: staticEntry,
  permissions: {
    allowCaptionChange: false,
    allowPositionChange: false,
    allowParentChange: false,
  },
}];

const inventory: TrustedMenuInventory = {
  applicationId: "test-app",
  staticMenuIds: ["static:3900"],
};

const policy = {
  allowedContentParentIds: ["static:3900"],
};

function currentDraft(): EditorDraft {
  return {
    schemaVersion: 1,
    applicationId: "test-app",
    entries: [{ ...staticEntry }],
    pages: [],
  };
}

describe("restore content folders", () => {
  it("restores a valid content folder", () => {
    const stored = {
      ...currentDraft(),
      entries: [
        { ...staticEntry },
        {
          id: "content:folder-1",
          source: "content",
          parentId: "static:3900",
          caption: "Dokumentation",
          position: 1,
        },
      ],
    };

    const restored = restoreLocalEditorDraft(
      stored,
      currentDraft(),
      protectedEntries,
      policy,
      inventory,
    );

    expect(restored).not.toBeNull();
    expect(restored?.entries).toHaveLength(2);
    expect(restored?.entries[1].contentPageId).toBeUndefined();
  });

  it("rejects folders under forbidden parents", () => {
    const stored = {
      ...currentDraft(),
      entries: [{
        id: "content:folder-1",
        source: "content",
        parentId: "static:999",
        caption: "Forbidden",
        position: 1,
      }],
    };

    expect(
      restoreLocalEditorDraft(
        stored,
        currentDraft(),
        protectedEntries,
        policy,
        inventory,
      ),
    ).toBeNull();
  });

  it("restores static menus from trusted configuration", () => {
    const stored = {
      ...currentDraft(),
      entries: [
        { ...staticEntry, caption: "Manipulated" },
        {
          id: "content:folder-1",
          source: "content",
          parentId: "static:3900",
          caption: "Folder",
          position: 1,
        },
      ],
    };

    const restored = restoreLocalEditorDraft(
      stored,
      currentDraft(),
      protectedEntries,
      policy,
      inventory,
    );

    expect(restored?.entries[0].caption).toBe("Application");
  });

  it("rejects content folders from another Application", () => {
    const stored = {
      ...currentDraft(),
      applicationId: "another-app",
    };

    expect(
      restoreLocalEditorDraft(
        stored,
        currentDraft(),
        protectedEntries,
        policy,
        inventory,
      ),
    ).toBeNull();
  });
});