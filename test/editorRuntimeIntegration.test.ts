import type { EditorDraft } from "../src/template/editor/model/editorTypes";

import {
  configureNavigationRuntime,
  getNavigationRuntime,
  resetNavigationRuntime,
} from "../src/template/navigation/navigationRuntime";

import {
  createRuntimeMenuSnapshot,
} from "../src/template/editor/adapters/createRuntimeMenuSnapshot";

import {
  validateEditorDraft,
} from "../src/template/editor/validation/validateEditorDraft";

const TestScreen = () => null;

describe("editor runtime integration", () => {
  beforeEach(() => {
    resetNavigationRuntime();

    configureNavigationRuntime({
      menu: {
        items: [
          {
            menuID: 100,
            caption: "Application",
            position: 1,
            Screen: TestScreen,
          },
          {
            menuID: 110,
            parentID: 100,
            caption: "Project Setup",
            position: 2,
            Screen: TestScreen,
          },
        ],
        isEnabled: () => true,
      },
      tabs: {
        items: [],
        isEnabled: () => true,
      },
    });
  });

  afterEach(() => {
    resetNavigationRuntime();
  });

  function createFixture() {
    const snapshot = createRuntimeMenuSnapshot("hems");

    const draft: EditorDraft = {
      schemaVersion: 1,
      applicationId: "hems",
      entries: snapshot.entries.map(entry => ({ ...entry })),
      pages: [],
    };

    const placementPolicy = {
      allowedContentParentIds: ["static:100"],
    };

    return { snapshot, draft, placementPolicy };
  }

  it("accepts an unchanged runtime-derived draft", () => {
    const { snapshot, draft, placementPolicy } = createFixture();

    expect(
      validateEditorDraft(
        draft,
        snapshot.protectedEntries,
        placementPolicy,
        snapshot.inventory,
      ),
    ).toEqual([]);
  });

  it("accepts a content page under an approved menu", () => {
    const { snapshot, draft, placementPolicy } = createFixture();

    draft.pages.push({
      id: "page-1",
      title: "Documentation",
      blocks: [],
    });

    draft.entries.push({
      id: "documentation",
      source: "content",
      caption: "Documentation",
      position: 3,
      parentId: "static:100",
      contentPageId: "page-1",
    });

    expect(
      validateEditorDraft(
        draft,
        snapshot.protectedEntries,
        placementPolicy,
        snapshot.inventory,
      ),
    ).toEqual([]);
  });

  it("rejects a changed static menu ID", () => {
    const { snapshot, draft, placementPolicy } = createFixture();

    draft.entries[1].menuID = 999;

    const errors = validateEditorDraft(
      draft,
      snapshot.protectedEntries,
      placementPolicy,
      snapshot.inventory,
    );

    expect(
      errors.some(error => error.code === "PROTECTED_MENU_ID_CHANGED"),
    ).toBe(true);
  });

  it("does not modify production navigation", () => {
    const { draft } = createFixture();

    draft.entries[0].caption = "Changed in editor";

    expect(getNavigationRuntime().menu.items[0].caption).toBe(
      "Application",
    );
  });
});
