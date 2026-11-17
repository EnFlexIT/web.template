/**
 * @jest-environment jsdom
 */
import React from "react";
import { render } from "@testing-library/react-native";

import { useEditor } from "@tiptap/react";

import { ContentTextBlockViewer } from
  "../src/template/editor/components/ContentTextBlockViewer";

jest.mock("@tiptap/react", () => {
  const React = require("react");
  const { View } = require("react-native");

  return {
    useEditor: jest.fn(),
    EditorContent: () => React.createElement(View),
  };
});

jest.mock("react-native-unistyles", () => ({
  useUnistyles: () => ({
    theme: {
      colors: {
        text: "#111111",
      },
    },
  }),
}));

jest.mock(
  "../src/template/components/design-system/themed/ThemedText",
  () => {
    const React = require("react");
    const { Text } = require("react-native");

    return {
      ThemedText: ({ children }: { children: React.ReactNode }) =>
        React.createElement(Text, null, children),
    };
  },
);

const mockedUseEditor = jest.mocked(useEditor);

describe("ContentTextBlockViewer HTML security", () => {
  const setContent = jest.fn();
  const getHTML = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    getHTML.mockReturnValue("<p>Alter Inhalt</p>");

    mockedUseEditor.mockReturnValue({
      getHTML,
      commands: {
        setContent,
      },
    } as unknown as ReturnType<typeof useEditor>);
  });

  it("sanitizes HTML before passing it to Tiptap", () => {
    render(
      <ContentTextBlockViewer
        html={'<p onclick="alert(1)">Hallo</p>'}
      />,
    );

    expect(mockedUseEditor).toHaveBeenCalledWith(
      expect.objectContaining({
        content: "<p>Hallo</p>",
        editable: false,
      }),
    );
  });

  it("sanitizes updated HTML before setContent", () => {
    const { update } = render(
      <ContentTextBlockViewer html="<p>Alt</p>" />,
    );

    setContent.mockClear();

    update(
      <ContentTextBlockViewer
        html={'<p onmouseover="alert(1)">Neu</p>'}
      />,
    );

    expect(setContent).toHaveBeenCalledWith(
      "<p>Neu</p>",
      { emitUpdate: false },
    );
  });

  it("does not mutate the original HTML string", () => {
    const original =
      '<p onclick="alert(1)">Original</p>';

    render(
      <ContentTextBlockViewer html={original} />,
    );

    expect(original).toBe(
      '<p onclick="alert(1)">Original</p>',
    );
  });
});