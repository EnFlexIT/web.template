import React from "react";

import {
  fireEvent,
  render,
  screen,
} from "@testing-library/react-native";

import {
  LocalContentSidebarTree,
} from "../src/template/editor/components/LocalContentSidebarTree";

import type {
  LocalContentPreviewNode,
} from "../src/template/editor/adapters/buildLocalContentPreview";

jest.mock("@expo/vector-icons/Feather", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return {
    __esModule: true,
    default: ({ name }: { name: string }) =>
      React.createElement(Text, null, name),
  };
});
jest.mock("react-native-unistyles", () => ({
  StyleSheet: {
    create: (factory: any) =>
      typeof factory === "function"
        ? factory({
            colors: {
              text: "#222222",
              border: "#cccccc",
              card: "#ffffff",
            },
          })
        : factory,
  },
  withUnistyles: (Component: any) => Component,
  useUnistyles: () => ({
    theme: {
      colors: {
        text: "#222222",
      },
    },
  }),
}));

jest.mock(
  "../src/template/components/design-system/stylistic/Text",
  () => {
    const React = require("react");
    const { Text } = require("react-native");

    return {
      Text: (props: any) =>
        React.createElement(Text, props, props.children),
    };
  },
);

const roots: LocalContentPreviewNode[] = [
  {
    id: "content:docs",
    parentId: "static:3900",
    caption: "Dokumentation",
    position: 1,
    children: [
      {
        id: "content:guide",
        parentId: "content:docs",
        caption: "Anleitung",
        position: 1,
        contentPageId: "page:guide",
        children: [],
      },
      {
        id: "content:examples",
        parentId: "content:docs",
        caption: "Beispiele",
        position: 2,
        children: [
          {
            id: "content:example-one",
            parentId: "content:examples",
            caption: "Beispiel 1",
            position: 1,
            contentPageId: "page:example-one",
            children: [],
          },
        ],
      },
    ],
  },
];

describe("LocalContentSidebarTree", () => {
  it("renders root folders but hides their children initially", () => {
    render(<LocalContentSidebarTree roots={roots} />);

    expect(screen.getByText("Dokumentation")).toBeTruthy();
    expect(screen.queryByText("Anleitung")).toBeNull();
    expect(screen.queryByText("Beispiele")).toBeNull();
  });

  it("expands and collapses a folder", () => {
    render(<LocalContentSidebarTree roots={roots} />);

    fireEvent.press(screen.getByLabelText("Dokumentation"));

    expect(screen.getByText("Anleitung")).toBeTruthy();
    expect(screen.getByText("Beispiele")).toBeTruthy();

    fireEvent.press(screen.getByLabelText("Dokumentation"));

    expect(screen.queryByText("Anleitung")).toBeNull();
  });

  it("expands nested folders independently", () => {
    render(<LocalContentSidebarTree roots={roots} />);

    fireEvent.press(screen.getByLabelText("Dokumentation"));

    expect(screen.queryByText("Beispiel 1")).toBeNull();

    fireEvent.press(screen.getByLabelText("Beispiele"));

    expect(screen.getByText("Beispiel 1")).toBeTruthy();
  });

  it("keeps content pages non-interactive", () => {
    render(<LocalContentSidebarTree roots={roots} />);

    fireEvent.press(screen.getByLabelText("Dokumentation"));

    const page = screen.getByLabelText("Anleitung");

    expect(page.props.accessibilityState.disabled).toBe(true);

    fireEvent.press(page);

    expect(screen.getByText("Anleitung")).toBeTruthy();
    expect(screen.queryByText("Beispiel 1")).toBeNull();
  });

  it("passes the selected page ID to the callback", () => {
    const onPagePress = jest.fn();

    render(
      <LocalContentSidebarTree
        roots={roots}
        onPagePress={onPagePress}
      />,
    );

    fireEvent.press(screen.getByLabelText("Dokumentation"));

    const page = screen.getByLabelText("Anleitung");

    expect(page.props.accessibilityState.disabled).toBe(false);

    fireEvent.press(page);

    expect(onPagePress).toHaveBeenCalledTimes(1);
    expect(onPagePress).toHaveBeenCalledWith("page:guide");
  });

  it("passes nested page IDs without opening other folders", () => {
    const onPagePress = jest.fn();

    render(
      <LocalContentSidebarTree
        roots={roots}
        onPagePress={onPagePress}
      />,
    );

    fireEvent.press(screen.getByLabelText("Dokumentation"));
    fireEvent.press(screen.getByLabelText("Beispiele"));
    fireEvent.press(screen.getByLabelText("Beispiel 1"));

    expect(onPagePress).toHaveBeenCalledTimes(1);
    expect(onPagePress).toHaveBeenCalledWith("page:example-one");
  });
  it("renders nothing for an empty tree", () => {
    render(<LocalContentSidebarTree roots={[]} />);

    expect(screen.queryByText("Dokumentation")).toBeNull();
  });
});