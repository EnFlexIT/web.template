type SidebarAuthState = {
  api: {
    isLoggedIn: boolean;
    isLoggingOut: boolean;
  };
};

const authState: SidebarAuthState = {
  api: {
    isLoggedIn: true,
    isLoggingOut: false,
  },
};

jest.mock(
  "../src/template/state/api/apiSlice",
  () => ({
    selectIsLoggedIn: (state: SidebarAuthState) =>
      state.api.isLoggedIn,
    selectIsLoggingOut: (state: SidebarAuthState) =>
      state.api.isLoggingOut,
  }),
);

jest.mock(
  "../src/template/state/store/useAppSelector",
  () => ({
    useAppSelector: (selector: (state: SidebarAuthState) => unknown) =>
      selector(authState),
  }),
);
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

    authState.api.isLoggedIn = true;
    authState.api.isLoggingOut = false;

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

  it("does not load local entries while logged out", () => {
    mockedEnabled.mockReturnValue(true);
    authState.api.isLoggedIn = false;

    const { result } = renderHook(
      () => useLocalContentSidebarPreview(),
    );

    expect(result.current).toEqual([]);
    expect(mockedSnapshot).not.toHaveBeenCalled();
    expect(mockedLoad).not.toHaveBeenCalled();
  });

  it("hides existing sidebar entries when logout starts", async () => {
    mockedEnabled.mockReturnValue(true);

    mockedLoad.mockResolvedValue({
      status: "ready",
      roots: previewRoots,
      pages: [],
    });

    const { result, rerender } = renderHook(
      () => useLocalContentSidebarPreview(),
    );

    await waitFor(() => {
      expect(result.current).toEqual(previewRoots);
    });

    await act(async () => {
      authState.api.isLoggingOut = true;
      rerender({});
    });

    expect(result.current).toEqual([]);
    expect(mockedLoad).toHaveBeenCalledTimes(1);
  });

  it("ignores pending sidebar loads after logout", async () => {
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

    const { result, rerender } = renderHook(
      () => useLocalContentSidebarPreview(),
    );

    expect(mockedLoad).toHaveBeenCalledTimes(1);

    await act(async () => {
      authState.api.isLoggedIn = false;
      rerender({});
    });

    expect(result.current).toEqual([]);

    await act(async () => {
      resolveLoad({
        status: "ready",
        roots: previewRoots,
        pages: [],
      });

      await pending;
    });

    expect(result.current).toEqual([]);
    expect(mockedLoad).toHaveBeenCalledTimes(1);
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