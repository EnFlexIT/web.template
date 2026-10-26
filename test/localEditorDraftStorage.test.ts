import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  clearLocalEditorDraft,
  loadLocalEditorDraft,
  saveLocalEditorDraft,
} from "../src/template/editor/storage/localEditorDraftStorage";

import type {
  EditorDraft,
} from "../src/template/editor/model/editorTypes";

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

const draft: EditorDraft = {
  schemaVersion: 1,
  applicationId: "storage-test",
  entries: [],
  pages: [],
};

describe("localEditorDraftStorage scopes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGet.mockResolvedValue(null);
    mockedSet.mockResolvedValue(undefined);
    mockedRemove.mockResolvedValue(undefined);
  });

  it("uses preview storage by default", async () => {
    await saveLocalEditorDraft(draft);

    expect(mockedSet).toHaveBeenCalledWith(
      "content-menu-editor:preview:v1:storage-test",
      JSON.stringify(draft),
    );
  });

  it("saves regular drafts under a separate key", async () => {
    await saveLocalEditorDraft(draft, "regular");

    expect(mockedSet).toHaveBeenCalledWith(
      "content-menu-editor:regular:v1:storage-test",
      JSON.stringify(draft),
    );
  });

  it("loads only the requested scope", async () => {
    const regularDraft = {
      ...draft,
      pages: [{
        id: "page:regular",
        title: "Regular",
        blocks: [],
      }],
    };

    mockedGet.mockResolvedValueOnce(
      JSON.stringify(regularDraft),
    );

    const result = await loadLocalEditorDraft(
      "storage-test",
      "regular",
    );

    expect(mockedGet).toHaveBeenCalledWith(
      "content-menu-editor:regular:v1:storage-test",
    );

    expect(result).toEqual(regularDraft);
  });

  it("clears only the requested scope", async () => {
    await clearLocalEditorDraft(
      "storage-test",
      "regular",
    );

    expect(mockedRemove).toHaveBeenCalledTimes(1);
    expect(mockedRemove).toHaveBeenCalledWith(
      "content-menu-editor:regular:v1:storage-test",
    );
  });
});