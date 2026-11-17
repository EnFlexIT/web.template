import AsyncStorage from "@react-native-async-storage/async-storage";

import type { EditorDraft } from "../src/template/editor/model/editorTypes";
import type {
  ProtectedMenuEntry,
  TrustedMenuInventory,
} from "../src/template/editor/model/menuProtection";

import { loadLocalContentPreview } from "../src/template/editor/adapters/loadLocalContentPreview";

jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

const mockedGet = jest.mocked(AsyncStorage.getItem);
const mockedSet = jest.mocked(AsyncStorage.setItem);
const mockedRemove = jest.mocked(AsyncStorage.removeItem);

const staticEntry = {
  id: "static:3900",
  source: "application" as const,
  menuID: 3900,
  caption: "Application",
  position: 1,
};

const currentDraft: EditorDraft = {
  schemaVersion: 1,
  applicationId: "test-app",
  entries: [{ ...staticEntry }],
  pages: [],
};

const protectedEntries: ProtectedMenuEntry[] = [{
  original: { ...staticEntry },
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

const storageKey = "content-menu-editor:regular:v1:test-app";

function storedDraft(): EditorDraft {
  return {
    ...currentDraft,
    entries: [
      { ...staticEntry },
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
    ],
    pages: [{
      id: "page:guide",
      title: "Anleitung",
      blocks: [],
    }],
  };
}

async function load() {
  return loadLocalContentPreview(
    currentDraft,
    protectedEntries,
    policy,
    inventory,
  );
}

describe("loadLocalContentPreview", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("loads valid regular content without writing", async () => {
    mockedGet.mockResolvedValue(JSON.stringify(storedDraft()));

    const result = await load();

    expect(result.status).toBe("ready");

    if (result.status === "ready") {
      expect(result.roots).toHaveLength(1);
      expect(result.roots[0].caption).toBe("Dokumentation");
      expect(result.roots[0].children[0].caption).toBe("Anleitung");
    }

    expect(mockedGet).toHaveBeenCalledWith(storageKey);
    expect(mockedSet).not.toHaveBeenCalled();
    expect(mockedRemove).not.toHaveBeenCalled();
  });

  it("returns validated content pages without writing", async () => {
    const stored = storedDraft();

    stored.pages[0].blocks = [
      {
        id: "block:introduction",
        type: "text",
        html: "<p>Willkommen zur Anleitung</p>",
      },
    ];

    mockedGet.mockResolvedValue(JSON.stringify(stored));

    const result = await load();

    expect(result.status).toBe("ready");

    if (result.status !== "ready") {
      throw new Error("Expected ready preview");
    }

    expect(result.pages).toEqual(stored.pages);
    expect(result.pages).not.toBe(stored.pages);
    expect(result.pages[0]).not.toBe(stored.pages[0]);
    expect(result.pages[0].blocks).not.toBe(stored.pages[0].blocks);

    expect(mockedGet).toHaveBeenCalledWith(storageKey);
    expect(mockedSet).not.toHaveBeenCalled();
    expect(mockedRemove).not.toHaveBeenCalled();
  });
  it("returns empty when no draft exists", async () => {
    mockedGet.mockResolvedValue(null);

    expect(await load()).toEqual({
      status: "empty",
      roots: [],
    });
  });

  it("rejects invalid content placement", async () => {
    const stored = storedDraft();
    stored.entries[1].parentId = "static:999";

    mockedGet.mockResolvedValue(JSON.stringify(stored));

    expect(await load()).toEqual({
      status: "invalid",
      roots: [],
    });
  });

  it("does not trust modified static-menu values", async () => {
    const stored = storedDraft();
    stored.entries[0].caption = "Manipuliert";

    mockedGet.mockResolvedValue(JSON.stringify(stored));

    const result = await load();

    expect(result.status).toBe("ready");
    expect(currentDraft.entries[0].caption).toBe("Application");
  });

  it("handles damaged JSON without writing", async () => {
    mockedGet.mockResolvedValue("{invalid-json");

    expect(await load()).toEqual({
      status: "error",
      roots: [],
    });

    expect(mockedSet).not.toHaveBeenCalled();
    expect(mockedRemove).not.toHaveBeenCalled();
  });

  it("handles storage errors without writing", async () => {
    mockedGet.mockRejectedValue(new Error("Storage unavailable"));

    expect(await load()).toEqual({
      status: "error",
      roots: [],
    });

    expect(mockedSet).not.toHaveBeenCalled();
    expect(mockedRemove).not.toHaveBeenCalled();
  });
});