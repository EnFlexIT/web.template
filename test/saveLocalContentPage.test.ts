import type {
  EditorContentPage,
  EditorDraft,
} from "@/template/editor/model/editorTypes";

import { saveLocalContentPage } from
  "@/template/editor/storage/saveLocalContentPage";

import {
  loadLocalEditorDraft,
  saveLocalEditorDraft,
} from "@/template/editor/storage/localEditorDraftStorage";

import {
  restoreLocalEditorDraft,
} from "@/template/editor/storage/restoreLocalEditorDraft";

import {
  validateEditorDraft,
} from "@/template/editor/validation/validateEditorDraft";

import {
  notifyLocalEditorDraftSaved,
} from "@/template/editor/storage/localEditorDraftEvents";

jest.mock(
  "@/template/editor/storage/localEditorDraftStorage",
  () => ({
    loadLocalEditorDraft: jest.fn(),
    saveLocalEditorDraft: jest.fn(),
  }),
);

jest.mock(
  "@/template/editor/storage/restoreLocalEditorDraft",
  () => ({
    restoreLocalEditorDraft: jest.fn(),
  }),
);

jest.mock(
  "@/template/editor/validation/validateEditorDraft",
  () => ({
    validateEditorDraft: jest.fn(),
  }),
);

jest.mock(
  "@/template/editor/storage/localEditorDraftEvents",
  () => ({
    notifyLocalEditorDraftSaved: jest.fn(),
  }),
);

describe("saveLocalContentPage", () => {
  const originalPage: EditorContentPage = {
    id: "page:local-1",
    title: "Original",
    blocks: [],
  };

  const otherPage: EditorContentPage = {
    id: "page:local-2",
    title: "Andere Seite",
    blocks: [],
  };

  const initialDraft: EditorDraft = {
    schemaVersion: 1,
    applicationId: "test-app",
    entries: [
      {
        id: "menu:local-1",
        source: "content",
        caption: "Seite",
        position: 0,
        contentPageId: "page:local-1",
      },
    ],
    pages: [originalPage, otherPage],
  };

  const updatedPage: EditorContentPage = {
    ...originalPage,
    title: "Aktualisiert",
  };

  const loadMock = jest.mocked(loadLocalEditorDraft);
  const saveMock = jest.mocked(saveLocalEditorDraft);
  const restoreMock = jest.mocked(restoreLocalEditorDraft);
  const validateMock = jest.mocked(validateEditorDraft);
  const notifyMock = jest.mocked(notifyLocalEditorDraftSaved);

  beforeEach(() => {
    jest.clearAllMocks();

    loadMock.mockResolvedValue({ stored: true });
    saveMock.mockResolvedValue(undefined);
    restoreMock.mockReturnValue(initialDraft);
    validateMock.mockReturnValue([]);
  });

  async function runSave(
    original = originalPage,
    updated = updatedPage,
    canWrite: () => boolean = () => true,
  ) {
    return saveLocalContentPage(
      initialDraft,
      [],
      { allowedContentParentIds: [] },
      {} as Parameters<typeof saveLocalContentPage>[3],
      original,
      updated,
      canWrite,
    );
  }

  it("rejects saving when editing permission is missing", async () => {
    const result = await runSave(
      originalPage,
      updatedPage,
      () => false,
    );

    expect(result).toEqual({ status: "forbidden" });
    expect(saveMock).not.toHaveBeenCalled();
    expect(notifyMock).not.toHaveBeenCalled();
  });
  it("saves the edited page and preserves other data", async () => {
    const result = await runSave();

    expect(result).toEqual({ status: "saved" });
    expect(saveMock).toHaveBeenCalledTimes(1);

    const savedDraft = saveMock.mock.calls[0][0];

    expect(savedDraft.pages[0].title).toBe("Aktualisiert");
    expect(savedDraft.pages[1]).toEqual(otherPage);
    expect(savedDraft.entries).toEqual(initialDraft.entries);
    expect(saveMock.mock.calls[0][1]).toBe("regular");
    expect(notifyMock).toHaveBeenCalledTimes(1);
  });

  it("rejects a concurrent change", async () => {
    restoreMock.mockReturnValue({
      ...initialDraft,
      pages: [
        { ...originalPage, title: "Andere Änderung" },
        otherPage,
      ],
    });

    const result = await runSave();

    expect(result).toEqual({ status: "conflict" });
    expect(saveMock).not.toHaveBeenCalled();
    expect(notifyMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid restored draft", async () => {
    restoreMock.mockReturnValue(null);

    const result = await runSave();

    expect(result).toEqual({ status: "invalid" });
    expect(saveMock).not.toHaveBeenCalled();
  });

  it("rejects a missing local draft", async () => {
    loadMock.mockResolvedValue(null);

    const result = await runSave();

    expect(result).toEqual({ status: "no-draft" });
    expect(saveMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid updated draft", async () => {
    validateMock.mockReturnValue([
      "invalid" as never,
    ]);

    const result = await runSave();

    expect(result).toEqual({ status: "invalid" });
    expect(saveMock).not.toHaveBeenCalled();
  });
});