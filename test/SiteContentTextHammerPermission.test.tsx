import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { SiteContentText } from "../src/template/components/dynamic-content/content/SiteContentText";

jest.mock("@tiptap/starter-kit", () => ({
  __esModule: true,
  default: {},
}));

jest.mock("@tiptap/react", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return {
    useEditor: () => ({
      commands: { setContent: jest.fn() },
    }),
    EditorContent: () => React.createElement(Text, null, "Textinhalt"),
  };
});

jest.mock("react-native-unistyles", () => ({
  useUnistyles: () => ({
    theme: { colors: { text: "#111111" } },
  }),
}));

jest.mock("lucide-react", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return {
    Hammer: () => React.createElement(Text, null, "Hammer"),
  };
});

const editableContent = {
  editable: true,
  text: "<p>Testinhalt</p>",
} as any;

describe("SiteContentText: Hammer nur fuer berechtigte EDITOR", () => {
  it("zeigt USER auch bei editable-Inhalt keinen Hammer", () => {
    const openEditor = jest.fn();

    render(
      <SiteContentText
        content={editableContent}
        canEdit={false}
        setChangerVisible={openEditor}
      />,
    );

    expect(screen.getByText("Textinhalt")).toBeTruthy();

    fireEvent.press(screen.getByText("Textinhalt"));

    expect(screen.queryByText("Hammer")).toBeNull();
    expect(openEditor).not.toHaveBeenCalled();
  });

  it("zeigt bei EDITOR nach einem Klick den Hammer", () => {
    const openEditor = jest.fn();

    render(
      <SiteContentText
        content={editableContent}
        canEdit={true}
        setChangerVisible={openEditor}
      />,
    );

    fireEvent.press(screen.getByText("Textinhalt"));

    expect(screen.getByText("Hammer")).toBeTruthy();

    fireEvent.press(screen.getByText("Hammer"));

    expect(openEditor).toHaveBeenCalledWith(true);
  });

  it("zeigt bei nicht bearbeitbarem Inhalt keinen Hammer", () => {
    const openEditor = jest.fn();

    render(
      <SiteContentText
        content={{ ...editableContent, editable: false }}
        canEdit={true}
        setChangerVisible={openEditor}
      />,
    );

    fireEvent.press(screen.getByText("Textinhalt"));

    expect(screen.queryByText("Hammer")).toBeNull();
    expect(openEditor).not.toHaveBeenCalled();
  });
});