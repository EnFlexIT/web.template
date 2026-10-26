import React from "react";

import {
  render,
  screen,
} from "@testing-library/react-native";

import {
  LocalContentPageViewer,
} from "../src/template/editor/components/LocalContentPageViewer";

import type {
  EditorContentPage,
} from "../src/template/editor/model/editorTypes";

jest.mock(
  "../src/template/editor/components/ContentTextBlockViewer",
  () => {
    const React = require("react");
    const { Text } = require("react-native");

    return {
      ContentTextBlockViewer: ({ html }: { html: string }) =>
        React.createElement(Text, null, html),
    };
  },
);

jest.mock(
  "../src/template/components/design-system/ui-elements/Card",
  () => {
    const React = require("react");
    const { View } = require("react-native");

    return {
      Card: ({ children }: { children: React.ReactNode }) =>
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
      ThemedText: (props: any) =>
        React.createElement(Text, props, props.children),
    };
  },
);

const examplePage: EditorContentPage = {
  id: "page:guide",
  title: "Anleitung",
  blocks: [
    {
      id: "block:one",
      type: "text",
      html: "<p>Erster Inhalt</p>",
    },
    {
      id: "block:two",
      type: "text",
      html: "<p>Zweiter Inhalt</p>",
    },
  ],
};

describe("LocalContentPageViewer", () => {
  it("renders a page title and its text blocks", () => {
    render(<LocalContentPageViewer page={examplePage} />);

    expect(screen.getByText("Anleitung")).toBeTruthy();
    expect(screen.getByText("<p>Erster Inhalt</p>")).toBeTruthy();
    expect(screen.getByText("<p>Zweiter Inhalt</p>")).toBeTruthy();
  });

  it("renders a message for an empty page", () => {
    render(
      <LocalContentPageViewer
        page={{
          id: "page:empty",
          title: "Leere Seite",
          blocks: [],
        }}
      />,
    );

    expect(screen.getByText("Leere Seite")).toBeTruthy();

    expect(
      screen.getByText(
        "Diese Inhaltsseite enthält noch keine Inhalte.",
      ),
    ).toBeTruthy();
  });

  it("renders a placeholder for image blocks", () => {
    render(
      <LocalContentPageViewer
        page={{
          id: "page:images",
          title: "Bilder",
          blocks: [
            {
              id: "block:image",
              type: "image",
              assetId: "asset:one",
              alt: "Beispielbild",
            },
          ],
        }}
      />,
    );

    expect(
      screen.getByText("Bildvorschau noch nicht verfügbar"),
    ).toBeTruthy();

    expect(screen.getByText("Beispielbild")).toBeTruthy();
  });

  it("handles missing pages safely", () => {
    render(<LocalContentPageViewer />);

    expect(
      screen.getByText(
        "Die lokale Inhaltsseite wurde nicht gefunden.",
      ),
    ).toBeTruthy();
  });
});