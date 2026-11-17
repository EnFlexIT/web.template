/**
 * @jest-environment jsdom
 */

import React from "react";
import { render } from "@testing-library/react-native";
import { useEditor } from "@tiptap/react";

import {
  ContentTextBlockEditor,
} from "../src/template/editor/components/ContentTextBlockEditor";

jest.mock("@tiptap/react", () => {
  const React = require("react");
  const { View } = require("react-native");

  return {
    useEditor: jest.fn(),
    EditorContent: () => React.createElement(View),
  };
});

jest.mock(
  "../src/template/components/rich-text-editor",
  () => {
    const React = require("react");
    const { View } = require("react-native");

    return {
      RichTextToolbar: () => React.createElement(View),
    };
  },
);

jest.mock("react-native-unistyles", () => ({
  useUnistyles: () => ({
    theme: {
      colors: {
        text: "#111111",
        border: "#cccccc",
        card: "#ffffff",
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

describe("ContentTextBlockEditor existing behavior", () => {
  const setContent = jest.fn();
  const getHTML = jest.fn();
  const onChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    getHTML.mockReturnValue("<p>Vorhandener Inhalt</p>");

    mockedUseEditor.mockReturnValue({
      getHTML,
      commands: {
        setContent,
      },
    } as unknown as ReturnType<typeof useEditor>);
  });

  it("sanitizes unsafe initial HTML", () => {
    render(
      <ContentTextBlockEditor
        blockId="block:1"
        html={'<p onclick="alert(1)">Hallo</p>'}
        onChange={onChange}
      />,
    );

    expect(mockedUseEditor).toHaveBeenCalledWith(
      expect.objectContaining({
        content: "<p>Hallo</p>",
      }),
    );

    expect(onChange).not.toHaveBeenCalled();
  });

  it("sanitizes unsafe external HTML updates", () => {
    const { update } = render(
      <ContentTextBlockEditor
        blockId="block:1"
        html="<p>Vorhandener Inhalt</p>"
        onChange={onChange}
      />,
    );

    setContent.mockClear();

    update(
      <ContentTextBlockEditor
        blockId="block:1"
        html={'<p onmouseover="alert(1)">Neu</p>'}
        onChange={onChange}
      />,
    );

    expect(setContent).toHaveBeenCalledWith(
      "<p>Neu</p>",
      { emitUpdate: false },
    );

    expect(onChange).not.toHaveBeenCalled();
  });

  it("sanitizes HTML from actual Tiptap updates", () => {
    render(
      <ContentTextBlockEditor
        blockId="block:1"
        html="<p>Vorhandener Inhalt</p>"
        onChange={onChange}
      />,
    );

    const options = mockedUseEditor.mock.calls[0][0];

    getHTML.mockReturnValue(
      '<p onclick="alert(1)"><strong>Bearbeitet</strong></p>',
    );

    options.onUpdate?.({
      editor: { getHTML },
    } as unknown as Parameters<NonNullable<typeof options.onUpdate>>[0]);

    expect(onChange).toHaveBeenCalledWith(
      "block:1",
      "<p><strong>Bearbeitet</strong></p>",
    );
  });

  it("initializes Tiptap with the existing HTML", () => {
    render(
      <ContentTextBlockEditor
        blockId="block:1"
        html="<p>Vorhandener Inhalt</p>"
        onChange={onChange}
      />,
    );

    expect(mockedUseEditor).toHaveBeenCalledWith(
      expect.objectContaining({
        content: "<p>Vorhandener Inhalt</p>",
      }),
    );
  });

  it("does not call onChange merely from rendering", () => {
    render(
      <ContentTextBlockEditor
        blockId="block:1"
        html="<p>Vorhandener Inhalt</p>"
        onChange={onChange}
      />,
    );

    expect(onChange).not.toHaveBeenCalled();
  });

  it("synchronizes external changes without emitting updates", () => {
    const { update } = render(
      <ContentTextBlockEditor
        blockId="block:1"
        html="<p>Vorhandener Inhalt</p>"
        onChange={onChange}
      />,
    );

    setContent.mockClear();

    update(
      <ContentTextBlockEditor
        blockId="block:1"
        html="<p>Neuer Inhalt</p>"
        onChange={onChange}
      />,
    );

    expect(setContent).toHaveBeenCalledWith(
      "<p>Neuer Inhalt</p>",
      { emitUpdate: false },
    );

    expect(onChange).not.toHaveBeenCalled();
  });

  it("forwards real Tiptap updates to onChange", () => {
    render(
      <ContentTextBlockEditor
        blockId="block:1"
        html="<p>Vorhandener Inhalt</p>"
        onChange={onChange}
      />,
    );

    const options = mockedUseEditor.mock.calls[0][0];

    getHTML.mockReturnValue(
      "<p><strong>Bearbeitet</strong></p>",
    );

    options.onUpdate?.({
      editor: {
        getHTML,
      },
    } as unknown as Parameters<NonNullable<typeof options.onUpdate>>[0]);

    expect(onChange).toHaveBeenCalledWith(
      "block:1",
      "<p><strong>Bearbeitet</strong></p>",
    );
  });
});