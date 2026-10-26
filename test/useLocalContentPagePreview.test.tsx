import {
  act,
  renderHook,
  waitFor,
} from "@testing-library/react-native";

import {
  useLocalContentPagePreview,
} from "../src/template/editor/hooks/useLocalContentPagePreview";

import {
  isLocalContentPreviewEnabled,
} from "../src/template/editor/config/localContentPreviewConfig";

import {
  createRuntimeMenuSnapshot,
} from "../src/template/editor/adapters/createRuntimeMenuSnapshot";

import {
  loadLocalContentPreview,
} from "../src/template/editor/adapters/loadLocalContentPreview";

import {
  notifyLocalEditorDraftSaved,
} from "../src/template/editor/storage/localEditorDraftEvents";

jest.mock(
  "../src/template/application/ApplicationConfigContext",
  () => ({
    useApplicationConfig: () => ({
      id: "test-application",
      navigation: {
        editor: {
          allowedContentParentIds: ["static:3900"],
        },
      },
    }),
  }),
);

jest.mock(
  "../src/template/editor/config/localContentPreviewConfig",
  () => ({
    isLocalContentPreviewEnabled: jest.fn(),
  }),
);

jest.mock(
  "../src/template/editor/adapters/createRuntimeMenuSnapshot",
  () => ({
    createRuntimeMenuSnapshot: jest.fn(),
  }),
);

jest.mock(
  "../src/template/editor/adapters/loadLocalContentPreview",
  () => ({
    loadLocalContentPreview: jest.fn(),
  }),
);

const mockedEnabled = jest.mocked(isLocalContentPreviewEnabled);
const mockedSnapshot = jest.mocked(createRuntimeMenuSnapshot);
const mockedLoad = jest.mocked(loadLocalContentPreview);

const previewRoots = [{
  id: "content:docs",
  parentId: "static:3900",
  caption: "Dokumentation",
  position: 1,
  children: [],
}];

const previewPages = [{
  id: "page:guide",
  title: "Anleitung",
  blocks: [{
    id: "block:one",
    type: "text" as const,
    html: "<p>Hallo</p>",
  }],
}];

describe("useLocalContentPagePreview", () => {
  beforeEach(() => {
    jest.resetAllMocks();

    mockedEnabled.mockReturnValue(false);

    mockedSnapshot.mockReturnValue({
      entries: [],
      protectedEntries: [],
      inventory: {
        applicationId: "test-application",
        staticMenuIds: [],
      },
    });
  });

  it("does not load storage when disabled", () => {
    const { result } = renderHook(
      () => useLocalContentPagePreview(),
    );

    expect(result.current).toEqual({
      status: "disabled",
      roots: [],
      pages: [],
    });

    expect(mockedSnapshot).not.toHaveBeenCalled();
    expect(mockedLoad).not.toHaveBeenCalled();
  });

  it("provides validated roots and pages", async () => {
    mockedEnabled.mockReturnValue(true);

    mockedLoad.mockResolvedValue({
      status: "ready",
      roots: previewRoots,
      pages: previewPages,
    });

    const { result } = renderHook(
      () => useLocalContentPagePreview(),
    );

    await waitFor(() => {
      expect(result.current).toEqual({
        status: "ready",
        roots: previewRoots,
        pages: previewPages,
      });
    });

    expect(mockedLoad).toHaveBeenCalledTimes(1);
  });

  it("exposes no pages for invalid drafts", async () => {
    mockedEnabled.mockReturnValue(true);

    mockedLoad.mockResolvedValue({
      status: "invalid",
      roots: [],
    });

    const { result } = renderHook(
      () => useLocalContentPagePreview(),
    );

    await waitFor(() => {
      expect(result.current.status).toBe("invalid");
    });

    expect(result.current.pages).toEqual([]);
    expect(result.current.roots).toEqual([]);
  });

  it("ignores a completed load after unmount", async () => {
    mockedEnabled.mockReturnValue(true);

    let resolveLoad!: (
      value: Awaited<ReturnType<typeof loadLocalContentPreview>>,
    ) => void;

    const pending = new Promise<
      Awaited<ReturnType<typeof loadLocalContentPreview>>
    >(resolve => {
      resolveLoad = resolve;
    });

    mockedLoad.mockReturnValue(pending);

    const { unmount } = renderHook(
      () => useLocalContentPagePreview(),
    );

    unmount();

    await act(async () => {
      resolveLoad({
        status: "ready",
        roots: previewRoots,
        pages: previewPages,
      });

      await pending;
    });

    expect(mockedLoad).toHaveBeenCalledTimes(1);
  });
  it("reloads only for matching regular save events", async () => {
    mockedEnabled.mockReturnValue(true);

    mockedLoad.mockResolvedValue({
      status: "ready",
      roots: previewRoots,
      pages: previewPages,
    });

    const { result } = renderHook(
      () => useLocalContentPagePreview(),
    );

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });

    expect(mockedLoad).toHaveBeenCalledTimes(1);

    await act(async () => {
      notifyLocalEditorDraftSaved({
        applicationId: "another-application",
        scope: "regular",
      });

      notifyLocalEditorDraftSaved({
        applicationId: "test-application",
        scope: "preview",
      });
    });

    expect(mockedLoad).toHaveBeenCalledTimes(1);

    await act(async () => {
      notifyLocalEditorDraftSaved({
        applicationId: "test-application",
        scope: "regular",
      });
    });

    await waitFor(() => {
      expect(mockedLoad).toHaveBeenCalledTimes(2);
    });

    expect(result.current.status).toBe("ready");
  });
  it("does not overwrite newer data with an older load", async () => {
    mockedEnabled.mockReturnValue(true);

    let resolveFirst!: (
      value: Awaited<ReturnType<typeof loadLocalContentPreview>>,
    ) => void;

    const firstLoad = new Promise<
      Awaited<ReturnType<typeof loadLocalContentPreview>>
    >(resolve => {
      resolveFirst = resolve;
    });

    const newerPages = [{
      id: "page:guide",
      title: "Aktualisierte Anleitung",
      blocks: [{
        id: "block:new",
        type: "text" as const,
        html: "<p>Neuer Inhalt</p>",
      }],
    }];

    mockedLoad
      .mockReturnValueOnce(firstLoad)
      .mockResolvedValueOnce({
        status: "ready",
        roots: previewRoots,
        pages: newerPages,
      });

    const { result } = renderHook(
      () => useLocalContentPagePreview(),
    );

    await waitFor(() => {
      expect(mockedLoad).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      notifyLocalEditorDraftSaved({
        applicationId: "test-application",
        scope: "regular",
      });
    });

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
      expect(result.current.pages).toEqual(newerPages);
    });

    expect(mockedLoad).toHaveBeenCalledTimes(2);

    await act(async () => {
      resolveFirst({
        status: "ready",
        roots: previewRoots,
        pages: previewPages,
      });

      await firstLoad;
    });

    expect(result.current.pages).toEqual(newerPages);
    expect(result.current.pages).not.toEqual(previewPages);
  });
  it("handles loading errors safely", async () => {
    mockedEnabled.mockReturnValue(true);
    mockedLoad.mockRejectedValue(new Error("Unavailable"));

    const { result } = renderHook(
      () => useLocalContentPagePreview(),
    );

    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });

    expect(result.current.pages).toEqual([]);
    expect(result.current.roots).toEqual([]);
  });
});