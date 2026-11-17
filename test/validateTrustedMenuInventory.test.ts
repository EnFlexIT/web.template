import type { EditorDraft } from "../src/template/editor/model/editorTypes";
import type {
  ProtectedMenuEntry,
  TrustedMenuInventory,
} from "../src/template/editor/model/menuProtection";

import {
  validateTrustedMenuInventory,
} from "../src/template/editor/validation/validateTrustedMenuInventory";

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
    ],
    pages: [],
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

  const inventory: TrustedMenuInventory = {
    applicationId: "hems",
    staticMenuIds: ["applicationRoot"],
  };

  return { draft, protectedEntries, inventory };
}

describe("validateTrustedMenuInventory", () => {
  it("accepts a complete trusted inventory", () => {
    const { draft, protectedEntries, inventory } = createFixture();

    expect(
      validateTrustedMenuInventory(draft, protectedEntries, inventory),
    ).toEqual([]);
  });

  it("rejects a different application ID", () => {
    const fixture = createFixture();
    fixture.inventory.applicationId = "plant-assist";

    const errors = validateTrustedMenuInventory(
      fixture.draft,
      fixture.protectedEntries,
      fixture.inventory,
    );

    expect(errors.some(
      error => error.code === "INVENTORY_APPLICATION_MISMATCH",
    )).toBe(true);
  });

  it("rejects duplicate inventory IDs", () => {
    const fixture = createFixture();
    fixture.inventory.staticMenuIds = ["applicationRoot", "applicationRoot"];

    const errors = validateTrustedMenuInventory(
      fixture.draft,
      fixture.protectedEntries,
      fixture.inventory,
    );

    expect(errors.some(
      error => error.code === "DUPLICATE_INVENTORY_ID",
    )).toBe(true);
  });

  it("rejects duplicate protected definitions", () => {
    const fixture = createFixture();
    fixture.protectedEntries.push({
      ...fixture.protectedEntries[0],
    });

    const errors = validateTrustedMenuInventory(
      fixture.draft,
      fixture.protectedEntries,
      fixture.inventory,
    );

    expect(errors.some(
      error => error.code === "DUPLICATE_PROTECTED_ID",
    )).toBe(true);
  });

  it("rejects missing protected definitions", () => {
    const fixture = createFixture();
    fixture.protectedEntries.length = 0;

    const errors = validateTrustedMenuInventory(
      fixture.draft,
      fixture.protectedEntries,
      fixture.inventory,
    );

    expect(errors.some(
      error => error.code === "MISSING_PROTECTED_DEFINITION",
    )).toBe(true);
  });

  it("rejects unknown protected definitions", () => {
    const fixture = createFixture();
    fixture.inventory.staticMenuIds = [];

    const errors = validateTrustedMenuInventory(
      fixture.draft,
      fixture.protectedEntries,
      fixture.inventory,
    );

    expect(errors.some(
      error => error.code === "UNKNOWN_PROTECTED_DEFINITION",
    )).toBe(true);
  });

  it("rejects content menus as protected static definitions", () => {
    const fixture = createFixture();
    fixture.protectedEntries[0] = {
      ...fixture.protectedEntries[0],
      original: {
        ...fixture.protectedEntries[0].original,
        source: "content",
      },
    };

    const errors = validateTrustedMenuInventory(
      fixture.draft,
      fixture.protectedEntries,
      fixture.inventory,
    );

    expect(errors.some(
      error => error.code === "INVALID_PROTECTED_SOURCE",
    )).toBe(true);
  });
});
