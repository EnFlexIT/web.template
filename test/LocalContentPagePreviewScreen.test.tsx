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
import React from "react";

import {
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
      LocalContentPageInlineEditor: ({ page }: any) =>
        React.createElement(Text, null, `Seite: ${page.title}`),
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

    mockedRoute.mockReturnValue({
      params: { pageId: "page:guide" },
    } as ReturnType<typeof useRoute>);

    mockedPreview.mockReturnValue(validPreview);
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