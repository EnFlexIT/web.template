jest.mock("react-redux", () => {
  const state = {
    api: {
      isLoggedIn: true,
      isLoggingOut: false,
    },
    backendRoles: {
      status: "ready",
      roles: ["EDITOR"],
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

jest.mock(
  "../src/template/editor/config/localContentPreviewConfig",
  () => ({
    isLocalContentPreviewEnabled: jest.fn(() => true),
  }),
);
jest.mock(
  "../src/template/editor/adapters/createRuntimeMenuSnapshot",
  () => ({
    createRuntimeMenuSnapshot: jest.fn(() => ({
      entries: [],
      protectedEntries: [],
      inventory: {},
    })),
  }),
);
import React from "react";

import {
  act,
  render,
  screen,
} from "@testing-library/react-native";

import {
  useRoute,
} from "@react-navigation/native";

import {
  LocalContentPagePreviewScreen,
} from "../src/template/editor/screens/LocalContentPagePreviewScreen";

import {
  useSharedLocalContentPreview,
} from "../src/template/editor/context/LocalContentPreviewContext";

jest.mock(
  "../src/template/application/ApplicationConfigContext",
  () => ({
    useApplicationConfig: () => ({
      id: "preview-test",
      navigation: {
        menu: {},
        editor: { allowedContentParentIds: [] },
      },
    }),
  }),
);

jest.mock(
  "../src/template/editor/components/LocalContentPageInlineEditor",
  () => {
    const React = require("react");
    const { Text } = require("react-native");

    return {
      LocalContentPageInlineEditor: ({
        page,
        onSave,
      }: any) => {
        (globalThis as any).__previewTestOnSave = onSave;
        return React.createElement(Text, null, `Seite: ${page.title}`);
      },
    };
  },
);
jest.mock("@react-navigation/native", () => ({
  useRoute: jest.fn(),
}));

jest.mock(
  "../src/template/editor/context/LocalContentPreviewContext",
  () => ({
    useSharedLocalContentPreview: jest.fn(),
    useLocalContentLivePage: () => ({
      livePage: null,
      setLivePage: jest.fn(),
    }),
  }),
);

jest.mock(
  "../src/template/editor/components/LocalContentPageViewer",
  () => {
    const React = require("react");
    const { Text } = require("react-native");

    return {
      LocalContentPageViewer: ({ page }: any) =>
        React.createElement(Text, null, `Seite: ${page.title}`),
    };
  },
);

jest.mock(
  "../src/template/components/design-system/ui-elements/Card",
  () => {
    const React = require("react");
    const { View } = require("react-native");

    return {
      Card: ({ children }: any) =>
        React.createElement(View, null, children),
    };
  },
);

jest.mock(
  "../src/template/components/design-system/themed/ThemedText",
  () => {
    const React = require("react");
    const { Text } = require("react-native");

    return {
      ThemedText: ({ children }: any) =>
        React.createElement(Text, null, children),
    };
  },
);

const mockedRoute = jest.mocked(useRoute);
const mockedPreview = jest.mocked(useSharedLocalContentPreview);

const validPreview = {
  status: "ready" as const,
  roots: [{
    id: "content:docs",
    parentId: "static:3900",
    caption: "Dokumentation",
    position: 1,
    children: [{
      id: "content:guide",
      parentId: "content:docs",
      caption: "Anleitung",
      position: 1,
      contentPageId: "page:guide",
      children: [],
    }],
  }],
  pages: [
    {
      id: "page:guide",
      title: "Anleitung",
      blocks: [],
    },
    {
      id: "page:orphan",
      title: "Nicht verknüpft",
      blocks: [],
    },
  ],
};

describe("LocalContentPagePreviewScreen", () => {
  beforeEach(() => {
    jest.resetAllMocks();

    jest.requireMock(
      "../src/template/editor/config/localContentPreviewConfig"
    ).isLocalContentPreviewEnabled.mockReturnValue(true);

    jest.requireMock(
      "../src/template/editor/adapters/createRuntimeMenuSnapshot"
    ).createRuntimeMenuSnapshot.mockReturnValue({
      entries: [],
      protectedEntries: [],
      inventory: {},
    });

    const state = jest.requireMock("react-redux")
      .useStore().getState();

    state.api.isLoggedIn = true;
    state.api.isLoggingOut = false;
    state.backendRoles.status = "ready";
    state.backendRoles.roles = ["EDITOR"];

    mockedRoute.mockReturnValue({
      params: { pageId: "page:guide" },
    } as ReturnType<typeof useRoute>);

    mockedPreview.mockReturnValue(validPreview);
  });

  it("rejects an old save callback after logout and re-login", async () => {
    const saveModule = require(
      "../src/template/editor/storage/saveLocalContentPage"
    );

    const saveSpy = jest.spyOn(saveModule, "saveLocalContentPage")
      .mockResolvedValue({ status: "saved" });

    try {
      const view = render(<LocalContentPagePreviewScreen />);

      const oldSave = (globalThis as any).__previewTestOnSave;
      expect(typeof oldSave).toBe("function");

      const state = jest.requireMock("react-redux")
        .useStore().getState();

      await act(async () => {
        await oldSave(validPreview.pages[0], {
          ...validPreview.pages[0],
          title: "Alter Auftrag",
        });
      });


      expect(saveSpy).toHaveBeenCalledTimes(1);

      const oldCanWrite = saveSpy.mock.calls[0][6] as () => boolean;
      expect(oldCanWrite()).toBe(true);

      act(() => {
        state.api.isLoggingOut = true;
        view.rerender(<LocalContentPagePreviewScreen />);
      });

      expect(oldCanWrite()).toBe(false);

      act(() => {
        state.api.isLoggedIn = false;
        state.api.isLoggingOut = false;
        view.rerender(<LocalContentPagePreviewScreen />);
      });

      act(() => {
        state.api.isLoggedIn = true;
        view.rerender(<LocalContentPagePreviewScreen />);
      });

      expect(oldCanWrite()).toBe(false);
    } finally {
      saveSpy.mockRestore();
    }
  });
  it("rejects new save requests during logout", async () => {
    const saveModule = require(
      "../src/template/editor/storage/saveLocalContentPage"
    );

    const saveSpy = jest.spyOn(saveModule, "saveLocalContentPage")
      .mockResolvedValue({ status: "saved" });

    try {
      const view = render(<LocalContentPagePreviewScreen />);

      const state = jest.requireMock("react-redux")
        .useStore().getState();

      act(() => {
        state.api.isLoggingOut = true;
        view.rerender(<LocalContentPagePreviewScreen />);
      });

      const onSave = (globalThis as any).__previewTestOnSave;

      let result: unknown;

      await act(async () => {
        result = await onSave(
          validPreview.pages[0],
          {
            ...validPreview.pages[0],
            title: "Nicht speichern",
          },
        );
      });

      expect(result).toEqual({ status: "forbidden" });
      expect(saveSpy).not.toHaveBeenCalled();
    } finally {
      saveSpy.mockRestore();
    }
  });
  it("renders a registered local content page", () => {
    render(<LocalContentPagePreviewScreen />);

    expect(screen.getByText("Seite: Anleitung")).toBeTruthy();
  });

  it("rejects an unknown page ID", () => {
    mockedRoute.mockReturnValue({
      params: { pageId: "page:unknown" },
    } as ReturnType<typeof useRoute>);

    render(<LocalContentPagePreviewScreen />);

    expect(
      screen.getByText("Lokale Inhaltsseite nicht gefunden."),
    ).toBeTruthy();
  });

  it("rejects an unlinked content page", () => {
    mockedRoute.mockReturnValue({
      params: { pageId: "page:orphan" },
    } as ReturnType<typeof useRoute>);

    render(<LocalContentPagePreviewScreen />);

    expect(
      screen.getByText("Lokale Inhaltsseite nicht gefunden."),
    ).toBeTruthy();
  });

  it("does not render pages from invalid preview data", () => {
    mockedPreview.mockReturnValue({
      status: "invalid",
      roots: [],
      pages: [],
    });

    render(<LocalContentPagePreviewScreen />);

    expect(
      screen.getByText("Lokale Inhaltsseite nicht verfügbar."),
    ).toBeTruthy();
  });

  it("renders nothing when preview is disabled", () => {
    mockedPreview.mockReturnValue({
      status: "disabled",
      roots: [],
      pages: [],
    });

    const { toJSON } = render(
      <LocalContentPagePreviewScreen />,
    );

    expect(toJSON()).toBeNull();
  });
});