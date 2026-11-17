import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { BackendNewTextDraftV2 } from "../src/template/editor/components/BackendNewTextDraftV2";

jest.mock("../src/template/state/store/useAppSelector", () => ({
  useAppSelector: jest.fn(),
}));

jest.mock("../src/template/editor/utils/sanitizeContentHtml", () => ({
  sanitizeContentHtml: (html: string) => html,
}));

jest.mock("../src/template/editor/components/ContentTextBlockEditor", () => {
  const React = require("react");
  const { Pressable, Text } = require("react-native");
  return {
    ContentTextBlockEditor: ({ onChange, blockId, html }: any) =>
      React.createElement(Pressable, {
        onPress: () => onChange(blockId, "<p>Mein Entwurf</p>"),
      }, React.createElement(Text, null, `TipTap: ${html}`)),
  };
});

jest.mock("../src/template/components/design-system/ui-elements/ActionButton", () => {
  const React = require("react");
  const { Pressable, Text } = require("react-native");
  return { ActionButton: ({ label, onPress }: any) =>
    React.createElement(Pressable, { onPress }, React.createElement(Text, null, label)),
  };
});

jest.mock("../src/template/components/design-system/themed/ThemedText", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return { ThemedText: ({ children }: any) => React.createElement(Text, null, children) };
});

describe("BackendNewTextDraftV2 Tiptap reuse", () => {
  it("uses the existing rich text editor instead of a raw HTML text input", () => {
    render(<BackendNewTextDraftV2 menuId={10003} position={1} getState={() => ({} as any)} onSaved={async () => {}} />);
    fireEvent.press(screen.getByText("Neuen Textinhalt hinzufuegen"));
    expect(screen.getByText("TipTap: <p></p>")).toBeTruthy();
    expect(screen.queryByText("Vorschau anzeigen")).toBeNull();
    expect(screen.queryByText("Im Backend speichern")).toBeNull();
  });
  it("does not use a separate preview button", () => {
    render(<BackendNewTextDraftV2 menuId={10003} position={1} getState={() => ({} as any)} onSaved={async () => {}} />);
    fireEvent.press(screen.getByText("Neuen Textinhalt hinzufuegen"));
    expect(screen.queryByText("Vorschau anzeigen")).toBeNull();
  });
  it("updates the local draft and supports discard without an API call", () => {
    render(<BackendNewTextDraftV2 menuId={10003} position={1} getState={() => ({} as any)} onSaved={async () => {}} />);
    fireEvent.press(screen.getByText("Neuen Textinhalt hinzufuegen"));
    fireEvent.press(screen.getByText("TipTap: <p></p>"));
    expect(screen.getByText("TipTap: <p>Mein Entwurf</p>")).toBeTruthy();
    fireEvent.press(screen.getByText("Entwurf verwerfen"));
    fireEvent.press(screen.getByText("Neuen Textinhalt hinzufuegen"));
    expect(screen.getByText("TipTap: <p></p>")).toBeTruthy();
  });
});
