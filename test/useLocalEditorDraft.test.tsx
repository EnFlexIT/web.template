jest.mock("react-redux", () => {
  const state = {
    api: {
      isLoggedIn: true,
      isLoggingOut: false,
    },
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

jest.mock(
  "../src/template/state/api/apiSlice",
  () => ({
    selectIsLoggedIn: (state: {
      api: { isLoggedIn: boolean };
    }) => state.api.isLoggedIn,
    selectIsLoggingOut: (state: {
      api: { isLoggingOut: boolean };
    }) => state.api.isLoggingOut,
  }),
);
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

    const state = jest.requireMock("react-redux")
      .useStore().getState();

    state.api.isLoggedIn = true;
    state.api.isLoggingOut = false;

    mockedSave.mockResolvedValue(undefined);
  });

  it("does not load storage while logged out", () => {
    const state = jest.requireMock("react-redux")
      .useStore().getState();

    state.api.isLoggedIn = false;

    const { result } = renderHook(
      () => useLocalEditorDraft(options),
    );

    expect(mockedLoad).not.toHaveBeenCalled();
    expect(mockedSave).not.toHaveBeenCalled();
    expect(result.current.canRetrySave).toBe(false);
    expect(result.current.draft.pages).toEqual([]);
  });

  it("ignores a pending load after logout", async () => {
    const state = jest.requireMock("react-redux")
      .useStore().getState();

    const loading = deferred<unknown | null>();

    mockedLoad.mockReturnValue(loading.promise);
    mockedRestore.mockReturnValue(restoredDraft);

    const { result, rerender } = renderHook(
      () => useLocalEditorDraft(options),
    );

    expect(mockedLoad).toHaveBeenCalledTimes(1);

    await act(async () => {
      state.api.isLoggingOut = true;
      rerender({});
    });

    await act(async () => {
      loading.resolve({
        schemaVersion: 1,
        applicationId: "hook-test",
        entries: [],
        pages: [],
      });

      await loading.promise;
    });

    expect(mockedRestore).not.toHaveBeenCalled();
    expect(mockedSave).not.toHaveBeenCalled();
    expect(result.current.draft.pages).toEqual([]);
    expect(result.current.canRetrySave).toBe(false);
  });

  it("rejects a queued write after logout and re-login", async () => {
    const state = jest.requireMock("react-redux")
      .useStore().getState();

    const firstSave = deferred<void>();
    mockedLoad.mockResolvedValue(null);
    mockedSave.mockImplementationOnce(() => firstSave.promise);

    const { result, rerender } = renderHook(
      () => useLocalEditorDraft(options),
    );

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });

    await act(async () => {
      result.current.setDraft(previous => ({
        ...previous,
        pages: [{
          id: "page:one",
          title: "Erste Sitzung",
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
          id: "page:two",
          title: "Alter wartender Auftrag",
          blocks: [],
        }],
      }));
    });

    expect(mockedSave).toHaveBeenCalledTimes(1);

    await act(async () => {
      state.api.isLoggingOut = true;
      rerender({});
    });

    await act(async () => {
      state.api.isLoggedIn = false;
      state.api.isLoggingOut = false;
      rerender({});
    });

    await act(async () => {
      state.api.isLoggedIn = true;
      rerender({});
    });

    await act(async () => {
      firstSave.resolve();
      await firstSave.promise;
    });

    await waitFor(() => {
      expect(mockedLoad).toHaveBeenCalledTimes(2);
    });

    expect(mockedSave).toHaveBeenCalledTimes(1);
    expect(mockedSave.mock.calls[0][0].pages[0].title)
      .toBe("Erste Sitzung");
  });
  it("hides the previous draft immediately when logout starts", async () => {
    mockedLoad.mockResolvedValue(null);

    const { result, rerender } = renderHook(
      () => useLocalEditorDraft(options),
    );

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });

    await act(async () => {
      result.current.setDraft(previous => ({
        ...previous,
        pages: [{
          id: "page:private",
          title: "Alte Sitzung",
          blocks: [],
        }],
      }));
    });

    expect(result.current.draft.pages).toHaveLength(1);

    const state = jest.requireMock("react-redux")
      .useStore().getState();

    await act(async () => {
      state.api.isLoggingOut = true;
      rerender({});
    });

    expect(result.current.draft.pages).toEqual([]);
    expect(result.current.canRetrySave).toBe(false);
  });

  it("rejects an old draft setter after logout and re-login", async () => {
    mockedLoad.mockResolvedValue(null);

    const { result, rerender } = renderHook(
      () => useLocalEditorDraft(options),
    );

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });

    const oldSetter = result.current.setDraft;
    const updater = jest.fn((previous: EditorDraft) => ({
      ...previous,
      pages: [{
        id: "page:stale",
        title: "Veralteter Setter",
        blocks: [],
      }],
    }));

    const state = jest.requireMock("react-redux")
      .useStore().getState();

    await act(async () => {
      state.api.isLoggingOut = true;
      rerender({});
    });

    await act(async () => {
      state.api.isLoggedIn = false;
      state.api.isLoggingOut = false;
      rerender({});
    });

    await act(async () => {
      state.api.isLoggedIn = true;
      rerender({});
    });

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });

    await act(async () => {
      oldSetter(updater);
    });

    expect(updater).not.toHaveBeenCalled();
    expect(result.current.draft.pages).toEqual([]);
    expect(mockedSave).not.toHaveBeenCalled();
  });
  it("does not expose an old draft while a new session loads", async () => {
    const secondLoad = deferred<unknown | null>();

    mockedLoad
      .mockResolvedValueOnce(null)
      .mockReturnValueOnce(secondLoad.promise);

    const { result, rerender } = renderHook(
      () => useLocalEditorDraft(options),
    );

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });

    await act(async () => {
      result.current.setDraft(previous => ({
        ...previous,
        pages: [{
          id: "page:old",
          title: "Sitzung A",
          blocks: [],
        }],
      }));
    });

    expect(result.current.draft.pages).toHaveLength(1);

    const state = jest.requireMock("react-redux")
      .useStore().getState();

    await act(async () => {
      state.api.isLoggingOut = true;
      rerender({});
    });

    await act(async () => {
      state.api.isLoggedIn = false;
      state.api.isLoggingOut = false;
      rerender({});
    });

    await act(async () => {
      state.api.isLoggedIn = true;
      rerender({});
    });

    expect(result.current.status).toBe("loading");
    expect(result.current.draft.pages).toEqual([]);

    await act(async () => {
      secondLoad.resolve(null);
      await secondLoad.promise;
    });

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });
  });

  it("reloads a stored draft after a new login without saving it", async () => {
    mockedLoad.mockResolvedValueOnce(null);

    const { result, rerender } = renderHook(
      () => useLocalEditorDraft(options),
    );

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });

    const state = jest.requireMock("react-redux")
      .useStore().getState();

    await act(async () => {
      state.api.isLoggingOut = true;
      rerender({});
    });

    mockedLoad.mockResolvedValueOnce({
      schemaVersion: 1,
      applicationId: "hook-test",
      entries: [],
      pages: [],
    });

    mockedRestore.mockReturnValue(restoredDraft);

    await act(async () => {
      state.api.isLoggedIn = false;
      state.api.isLoggingOut = false;
      rerender({});
    });

    await act(async () => {
      state.api.isLoggedIn = true;
      rerender({});
    });

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
      expect(result.current.draft.pages[0].title)
        .toBe("Wiederhergestellt");
    });

    expect(mockedLoad).toHaveBeenCalledTimes(2);
    expect(mockedSave).not.toHaveBeenCalled();
  });
  it("does not let an old retry alter the new session", async () => {
    const firstSave = deferred<void>();

    mockedLoad.mockResolvedValue(null);
    mockedSave.mockImplementationOnce(() => firstSave.promise);

    const { result, rerender } = renderHook(
      () => useLocalEditorDraft(options),
    );

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });

    await act(async () => {
      result.current.setDraft(previous => ({
        ...previous,
        pages: [{
          id: "page:retry-session",
          title: "Alter Entwurf",
          blocks: [],
        }],
      }));
    });

    await waitFor(() => {
      expect(mockedSave).toHaveBeenCalledTimes(1);
    });

    const state = jest.requireMock("react-redux")
      .useStore().getState();

    await act(async () => {
      firstSave.reject(new Error("Save failed"));

      try {
        await firstSave.promise;
      } catch {
        // Expected failure.
      }
    });

    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });

    const waiting = deferred<void>();

    // Keep the existing per-hook queue pending before retry.
    mockedSave.mockImplementationOnce(() => waiting.promise);

    let retryPromise!: Promise<void>;

    await act(async () => {
      retryPromise = result.current.retrySave();
    });

    await waitFor(() => {
      expect(mockedSave).toHaveBeenCalledTimes(2);
    });

    await act(async () => {
      state.api.isLoggingOut = true;
      rerender({});
    });

    await act(async () => {
      state.api.isLoggedIn = false;
      state.api.isLoggingOut = false;
      rerender({});
    });

    await act(async () => {
      state.api.isLoggedIn = true;
      rerender({});
    });

    await act(async () => {
      waiting.resolve();
      await waiting.promise;
      await retryPromise;
    });

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });

    expect(result.current.storageError).toBe("");
    expect(result.current.draft.pages).toEqual([]);
    expect(mockedSave).toHaveBeenCalledTimes(2);
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
  it("retries the latest local draft after a failed save", async () => {
    mockedLoad.mockResolvedValue(null);
    mockedSave
      .mockRejectedValueOnce(new Error("Temporary failure"))
      .mockResolvedValue(undefined);

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
          id: "page:retry",
          title: "Änderungen erhalten",
          blocks: [],
        }],
      }));
    });

    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });

    expect(mockedSave).toHaveBeenCalledTimes(1);
    expect(result.current.canRetrySave).toBe(true);

    await act(async () => {
      await result.current.retrySave();
    });

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });

    expect(result.current.storageError).toBe("");
    expect(mockedSave).toHaveBeenCalledTimes(2);
    expect(mockedSave).toHaveBeenLastCalledWith(
      expect.objectContaining({
        pages: [
          expect.objectContaining({
            id: "page:retry",
            title: "Änderungen erhalten",
          }),
        ],
      }),
      "preview",
    );
  });
  it("keeps the error state if retry fails again", async () => {
    mockedLoad.mockResolvedValue(null);
    mockedSave
      .mockRejectedValueOnce(new Error("First failure"))
      .mockRejectedValueOnce(new Error("Second failure"));

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
          id: "page:retry-failed",
          title: "Ungesicherter Entwurf",
          blocks: [],
        }],
      }));
    });

    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });

    await act(async () => {
      await result.current.retrySave();
    });

    expect(mockedSave).toHaveBeenCalledTimes(2);
    expect(result.current.status).toBe("error");
    expect(result.current.storageError).not.toBe("");
    expect(result.current.canRetrySave).toBe(true);
    expect(result.current.draft.pages[0].title)
      .toBe("Ungesicherter Entwurf");
  });

  it("does not allow retry after loading failure", async () => {
    mockedLoad.mockRejectedValueOnce(
      new Error("Storage read failed"),
    );

    const { result } = renderHook(
      () => useLocalEditorDraft(options),
    );

    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });

    expect(result.current.canRetrySave).toBe(false);

    await act(async () => {
      await result.current.retrySave();
    });

    expect(mockedSave).not.toHaveBeenCalled();
    expect(result.current.status).toBe("error");
  });
  it("blocks retry when editing permission is revoked", async () => {
    mockedLoad.mockResolvedValue(null);
    mockedSave.mockRejectedValueOnce(
      new Error("Initial storage failure"),
    );

    const reduxMock = jest.requireMock("react-redux");
    const state = reduxMock.useStore().getState();
    const previousRole = state.authorization.assignedRole;

    try {
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
            id: "page:revoked",
            title: "Nicht überschreiben",
            blocks: [],
          }],
        }));
      });

      await waitFor(() => {
        expect(result.current.status).toBe("error");
      });

      expect(mockedSave).toHaveBeenCalledTimes(1);

      // Simulate a backend/effective-role change before retry.
      state.authorization.assignedRole = "USER";

      await act(async () => {
        await result.current.retrySave();
      });

      expect(mockedSave).toHaveBeenCalledTimes(1);
      expect(result.current.status).toBe("error");
      expect(result.current.storageError).not.toBe("");
      expect(result.current.draft.pages[0].title)
        .toBe("Nicht überschreiben");
    } finally {
      state.authorization.assignedRole = previousRole;
    }
  });
});
