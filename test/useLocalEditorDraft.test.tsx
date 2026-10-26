jest.mock("react-redux", () => {
  const state = {
    authorization: {
      assignedRole: "ADMIN",
      previewRole: null,
    },
  };

  const store = {
    getState: () => state,
  };

  const selectorHook = (selector: (state: any) => unknown) =>
    selector(state);

  const useSelector = Object.assign(selectorHook, {
    withTypes: () => selectorHook,
  });

  return {
    useStore: () => store,
    useSelector,
  };
});
import {
  act,
  renderHook,
  waitFor,
} from "@testing-library/react-native";

import { useLocalEditorDraft } from "../src/template/editor/hooks/useLocalEditorDraft";

import {
  subscribeLocalEditorDraftSaved,
} from "../src/template/editor/storage/localEditorDraftEvents";

import {
  loadLocalEditorDraft,
  saveLocalEditorDraft,
} from "../src/template/editor/storage/localEditorDraftStorage";

import {
  restoreLocalEditorDraft,
} from "../src/template/editor/storage/restoreLocalEditorDraft";

import type { EditorDraft } from "../src/template/editor/model/editorTypes";
import type {
  ProtectedMenuEntry,
  TrustedMenuInventory,
} from "../src/template/editor/model/menuProtection";
import type { MenuPlacementPolicy } from "../src/template/editor/model/menuPlacement";

jest.mock(
  "../src/template/editor/storage/localEditorDraftStorage",
  () => ({
    loadLocalEditorDraft: jest.fn(),
    saveLocalEditorDraft: jest.fn(),
  }),
);

jest.mock(
  "../src/template/editor/storage/restoreLocalEditorDraft",
  () => ({
    restoreLocalEditorDraft: jest.fn(),
  }),
);

const mockedLoad = jest.mocked(loadLocalEditorDraft);
const mockedSave = jest.mocked(saveLocalEditorDraft);
const mockedRestore = jest.mocked(restoreLocalEditorDraft);

const initialDraft: EditorDraft = {
  schemaVersion: 1,
  applicationId: "hook-test",
  entries: [],
  pages: [],
};

const restoredDraft: EditorDraft = {
  ...initialDraft,
  pages: [
    {
      id: "page:restored",
      title: "Wiederhergestellt",
      blocks: [],
    },
  ],
};

const options = {
  initialDraft,
  protectedEntries: [] as ProtectedMenuEntry[],
  placementPolicy: {
    allowedContentParentIds: [],
  } as unknown as MenuPlacementPolicy,
  inventory: {
    staticMenuIds: [],
  } as unknown as TrustedMenuInventory,
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

describe("useLocalEditorDraft", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedSave.mockResolvedValue(undefined);
  });

  it("loads a saved draft without overwriting it during initialization", async () => {
    const loading = deferred<unknown | null>();

    mockedLoad.mockReturnValue(loading.promise);
    mockedRestore.mockReturnValue(restoredDraft);

    const { result } = renderHook(
      () => useLocalEditorDraft(options),
    );

    expect(result.current.status).toBe("loading");
    expect(mockedSave).not.toHaveBeenCalled();

    await act(async () => {
      loading.resolve({
        schemaVersion: 1,
        applicationId: "hook-test",
        entries: [],
        pages: [],
      });

      await loading.promise;
    });

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
      expect(result.current.draft.pages[0].title)
        .toBe("Wiederhergestellt");
    });

    expect(mockedRestore).toHaveBeenCalledTimes(1);
    expect(mockedSave).not.toHaveBeenCalled();
  });
  it("does not save after a loading failure", async () => {
    mockedLoad.mockRejectedValue(
      new Error("Storage unavailable"),
    );

    const { result } = renderHook(
      () => useLocalEditorDraft(options),
    );

    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });

    expect(result.current.storageError).not.toBe("");
    expect(mockedSave).not.toHaveBeenCalled();
    expect(mockedRestore).not.toHaveBeenCalled();
  });

  it("does not overwrite an invalid stored draft", async () => {
    mockedLoad.mockResolvedValue({
      schemaVersion: 1,
      applicationId: "hook-test",
      entries: [],
      pages: [],
    });

    mockedRestore.mockReturnValue(null);

    const { result } = renderHook(
      () => useLocalEditorDraft(options),
    );

    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });

    expect(result.current.storageError).not.toBe("");
    expect(mockedRestore).toHaveBeenCalledTimes(1);
    expect(mockedSave).not.toHaveBeenCalled();
  });
  it("serializes rapid changes and waits for the latest save", async () => {
    const firstSave = deferred<void>();
    const secondSave = deferred<void>();

    mockedLoad.mockResolvedValue(null);

    mockedSave
      .mockImplementationOnce(() => firstSave.promise)
      .mockImplementationOnce(() => secondSave.promise);

    const { result } = renderHook(
      () => useLocalEditorDraft(options),
    );

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });

    await act(async () => {
      result.current.setDraft(previous => ({
        ...previous,
        pages: [{
          id: "page:local-1",
          title: "Erste Änderung",
          blocks: [],
        }],
      }));
    });

    await waitFor(() => {
      expect(mockedSave).toHaveBeenCalledTimes(1);
    });

    expect(result.current.status).toBe("saving");

    await act(async () => {
      result.current.setDraft(previous => ({
        ...previous,
        pages: [{
          id: "page:local-1",
          title: "Zweite Änderung",
          blocks: [],
        }],
      }));
    });

    // The second write must wait for the first.
    expect(mockedSave).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe("saving");

    await act(async () => {
      firstSave.resolve();
      await firstSave.promise;
    });

    await waitFor(() => {
      expect(mockedSave).toHaveBeenCalledTimes(2);
    });

    expect(result.current.status).toBe("saving");

    await act(async () => {
      secondSave.resolve();
      await secondSave.promise;
    });

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });

    expect(mockedSave.mock.calls[0][0].pages[0].title)
      .toBe("Erste Änderung");

    expect(mockedSave.mock.calls[1][0].pages[0].title)
      .toBe("Zweite Änderung");
  });
  it("notifies only after a successful regular save", async () => {
    const pendingSave = deferred<void>();
    const listener = jest.fn();

    const unsubscribe =
      subscribeLocalEditorDraftSaved(listener);

    try {
      mockedLoad.mockResolvedValue(null);
      mockedSave.mockReturnValueOnce(pendingSave.promise);

      const { result } = renderHook(
        () => useLocalEditorDraft({
          ...options,
          storageScope: "regular",
        }),
      );

      await waitFor(() => {
        expect(result.current.status).toBe("ready");
      });

      await act(async () => {
        result.current.setDraft(previous => ({
          ...previous,
          pages: [{
            id: "page:notification",
            title: "Benachrichtigung",
            blocks: [],
          }],
        }));
      });

      await waitFor(() => {
        expect(mockedSave).toHaveBeenCalledTimes(1);
      });

      expect(listener).not.toHaveBeenCalled();

      await act(async () => {
        pendingSave.resolve();
        await pendingSave.promise;
      });

      await waitFor(() => {
        expect(listener).toHaveBeenCalledTimes(1);
      });

      expect(listener).toHaveBeenCalledWith({
        applicationId: "hook-test",
        scope: "regular",
      });
    } finally {
      unsubscribe();
    }
  });

  it("does not notify after a failed save", async () => {
    const pendingSave = deferred<void>();
    const listener = jest.fn();

    const unsubscribe =
      subscribeLocalEditorDraftSaved(listener);

    try {
      mockedLoad.mockResolvedValue(null);
      mockedSave.mockReturnValueOnce(pendingSave.promise);

      const { result } = renderHook(
        () => useLocalEditorDraft({
          ...options,
          storageScope: "regular",
        }),
      );

      await waitFor(() => {
        expect(result.current.status).toBe("ready");
      });

      await act(async () => {
        result.current.setDraft(previous => ({
          ...previous,
          pages: [{
            id: "page:failed",
            title: "Fehlgeschlagen",
            blocks: [],
          }],
        }));
      });

      await waitFor(() => {
        expect(mockedSave).toHaveBeenCalledTimes(1);
      });

      await act(async () => {
        pendingSave.reject(new Error("Storage write failed"));

        try {
          await pendingSave.promise;
        } catch {
          // Expected write failure.
        }
      });

      await waitFor(() => {
        expect(result.current.status).toBe("error");
      });

      expect(listener).not.toHaveBeenCalled();
    } finally {
      unsubscribe();
    }
  });
  it("reports a failed save without claiming success", async () => {
    const failedSave = deferred<void>();

    mockedLoad.mockResolvedValue(null);
    mockedSave.mockReturnValueOnce(failedSave.promise);

    const { result } = renderHook(
      () => useLocalEditorDraft(options),
    );

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });

    await act(async () => {
      result.current.setDraft(previous => ({
        ...previous,
        pages: [
          {
            id: "page:local-1",
            title: "Nicht gespeichert",
            blocks: [],
          },
        ],
      }));
    });

    await waitFor(() => {
      expect(mockedSave).toHaveBeenCalledTimes(1);
    });

    expect(result.current.status).toBe("saving");

    await act(async () => {
      failedSave.reject(new Error("Storage write failed"));

      try {
        await failedSave.promise;
      } catch {
        // Expected storage error.
      }
    });

    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });

    expect(result.current.storageError)
      .toContain("nicht gespeichert");

    expect(mockedSave).toHaveBeenCalledTimes(1);
  });
  it("does not claim success when an earlier queued save fails", async () => {
    const firstSave = deferred<void>();

    mockedLoad.mockResolvedValue(null);
    mockedSave.mockImplementationOnce(() => firstSave.promise);

    const { result } = renderHook(
      () => useLocalEditorDraft(options),
    );

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });

    await act(async () => {
      result.current.setDraft(previous => ({
        ...previous,
        pages: [{
          id: "page:local-1",
          title: "Erste Änderung",
          blocks: [],
        }],
      }));
    });

    await waitFor(() => {
      expect(mockedSave).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      result.current.setDraft(previous => ({
        ...previous,
        pages: [{
          id: "page:local-1",
          title: "Zweite Änderung",
          blocks: [],
        }],
      }));
    });

    expect(result.current.status).toBe("saving");

    await act(async () => {
      firstSave.reject(new Error("First save failed"));

      try {
        await firstSave.promise;
      } catch {
        // Expected failure.
      }
    });

    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });

    expect(result.current.storageError).not.toBe("");

    // A queued write must not silently report success
    // after the first write failed.
    expect(result.current.status).not.toBe("ready");
  });
  it("blocks queued writes after a failed save", async () => {
    const firstSave = deferred<void>();

    mockedLoad.mockResolvedValue(null);
    mockedSave.mockImplementationOnce(() => firstSave.promise);

    const { result } = renderHook(
      () => useLocalEditorDraft(options),
    );

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });

    await act(async () => {
      result.current.setDraft(previous => ({
        ...previous,
        pages: [{
          id: "page:local-1",
          title: "Erste Änderung",
          blocks: [],
        }],
      }));
    });

    await waitFor(() => {
      expect(mockedSave).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      result.current.setDraft(previous => ({
        ...previous,
        pages: [{
          id: "page:local-1",
          title: "Zweite Änderung",
          blocks: [],
        }],
      }));
    });

    await act(async () => {
      firstSave.reject(new Error("Storage write failed"));

      try {
        await firstSave.promise;
      } catch {
        // Expected failure.
      }
    });

    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });

    expect(mockedSave).toHaveBeenCalledTimes(1);
    expect(result.current.storageError).not.toBe("");
  });
});
