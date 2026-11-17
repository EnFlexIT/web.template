import type { EditorDraft } from "../src/template/editor/model/editorTypes";
import type { ProtectedMenuEntry } from "../src/template/editor/model/menuProtection";
import { validateEditorDraft } from "../src/template/editor/validation/validateEditorDraft";

function createFixture() {
  const draft: EditorDraft = {
    schemaVersion: 1,
    applicationId: "hems",
    entries: [
      {
        id: "applicationRoot",
        source: "application",
        menuID: 100,
        caption: "Application",
        position: 1,
      },
      {
        id: "documentation",
        source: "content",
        parentId: "applicationRoot",
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

  const protectedEntries: ProtectedMenuEntry[] = [
    {
      original: { ...draft.entries[0] },
      permissions: {
        allowCaptionChange: false,
        allowPositionChange: false,
        allowParentChange: false,
      },
    },
  ];

  const placementPolicy = {
    allowedContentParentIds: ["applicationRoot"],
  };

  const inventory = {
    applicationId: "hems",
    staticMenuIds: ["applicationRoot"],
  };

  return { draft, protectedEntries, placementPolicy, inventory };
}

describe("validateEditorDraft", () => {
  it("accepts a valid draft", () => {
    const fixture = createFixture();

    expect(
      validateEditorDraft(
        fixture.draft,
        fixture.protectedEntries,
        fixture.placementPolicy,
        fixture.inventory,
      ),
    ).toEqual([]);
  });

  it("combines structure, protection and placement errors", () => {
    const fixture = createFixture();

    fixture.draft.entries[0].caption = "Changed";
    fixture.draft.entries[1].caption = " ";
    fixture.draft.entries[1].parentId = "unknown";

    const errors = validateEditorDraft(
      fixture.draft,
      fixture.protectedEntries,
      fixture.placementPolicy,
        fixture.inventory,
    );

    expect(errors.map(error => error.code)).toEqual(
      expect.arrayContaining([
        "PROTECTED_MENU_CAPTION_CHANGED",
        "INVALID_CAPTION",
        "MISSING_PARENT",
        "CONTENT_PARENT_NOT_ALLOWED",
      ]),
    );
  });

  it("rejects content below an unapproved existing menu", () => {
    const fixture = createFixture();

    fixture.draft.entries.push({
      id: "systemSettings",
      source: "template",
      menuID: 3021,
      caption: "System Settings",
      position: 3,
    });

    fixture.protectedEntries.push({
      original: { ...fixture.draft.entries[2] },
      permissions: {
        allowCaptionChange: false,
        allowPositionChange: false,
        allowParentChange: false,
      },
    });

    fixture.inventory.staticMenuIds.push("systemSettings");
    fixture.draft.entries[1].parentId = "systemSettings";

    const errors = validateEditorDraft(
      fixture.draft,
      fixture.protectedEntries,
      fixture.placementPolicy,
        fixture.inventory,
    );

    expect(errors.some(
      error => error.code === "CONTENT_PARENT_NOT_ALLOWED",
    )).toBe(true);
  });
});

