import {
  act,
  renderHook,
  waitFor,
} from "@testing-library/react-native";

import {
  useLocalContentSidebarPreview,
} from "../src/template/editor/hooks/useLocalContentSidebarPreview";

import {
  isLocalContentPreviewEnabled,
} from "../src/template/editor/config/localContentPreviewConfig";

import {
  createRuntimeMenuSnapshot,
} from "../src/template/editor/adapters/createRuntimeMenuSnapshot";

import {
  loadLocalContentPreview,
} from "../src/template/editor/adapters/loadLocalContentPreview";

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

const previewRoots = [
  {
    id: "content:docs",
    parentId: "static:3900",
    caption: "Dokumentation",
    position: 1,
    children: [],
  },
];

describe("useLocalContentSidebarPreview", () => {
  beforeEach(() => {
    jest.clearAllMocks();

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

  it("does not load storage when the preview is disabled", () => {
    const { result } = renderHook(
      () => useLocalContentSidebarPreview(),
    );

    expect(result.current).toEqual([]);
    expect(mockedSnapshot).not.toHaveBeenCalled();
    expect(mockedLoad).not.toHaveBeenCalled();
  });

  it("loads valid local preview entries", async () => {
    mockedEnabled.mockReturnValue(true);

    mockedLoad.mockResolvedValue({
      status: "ready",
      roots: previewRoots,
      pages: [],
    });

    const { result } = renderHook(
      () => useLocalContentSidebarPreview(),
    );

    await waitFor(() => {
      expect(result.current).toEqual(previewRoots);
    });

    expect(mockedLoad).toHaveBeenCalledTimes(1);
  });

  it("ignores invalid stored drafts", async () => {
    mockedEnabled.mockReturnValue(true);

    mockedLoad.mockResolvedValue({
      status: "invalid",
      roots: [],
    });

    const { result } = renderHook(
      () => useLocalContentSidebarPreview(),
    );

    await waitFor(() => {
      expect(mockedLoad).toHaveBeenCalledTimes(1);
    });

    expect(result.current).toEqual([]);
  });

  it("returns an empty preview after a loading error", async () => {
    mockedEnabled.mockReturnValue(true);

    mockedLoad.mockRejectedValue(new Error("Storage unavailable"));

    const { result } = renderHook(
      () => useLocalContentSidebarPreview(),
    );

    await waitFor(() => {
      expect(mockedLoad).toHaveBeenCalledTimes(1);
    });

    expect(result.current).toEqual([]);
  });

  it("ignores results after unmounting", async () => {
    mockedEnabled.mockReturnValue(true);

    let resolveLoad!: (value: {
      status: "ready";
      roots: typeof previewRoots;
      pages: [];
    }) => void;

    const pending = new Promise<{
      status: "ready";
      roots: typeof previewRoots;
      pages: [];
    }>(resolve => {
      resolveLoad = resolve;
    });

    mockedLoad.mockReturnValue(pending);

    const { unmount } = renderHook(
      () => useLocalContentSidebarPreview(),
    );

    unmount();

    await act(async () => {
      resolveLoad({
        status: "ready",
        roots: previewRoots,
        pages: [],
      });

      await pending;
    });

    expect(mockedLoad).toHaveBeenCalledTimes(1);
  });
});