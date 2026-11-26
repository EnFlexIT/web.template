import { act as contentI18nAct } from "@testing-library/react-native";
import { createInstance as createContentTestI18n } from "i18next";
import { initReactI18next as contentTestReactI18n } from "react-i18next";
import deContentEditor from "../assets/locales/de/Editor.json";
import enContentEditor from "../assets/locales/en/Editor.json";

const contentTestI18n = createContentTestI18n();

beforeAll(async () => {
  await contentTestI18n.use(contentTestReactI18n).init({
    lng: "de",
    fallbackLng: false,
    defaultNS: "Editor",
    ns: ["Editor"],
    resources: {
      de: { Editor: deContentEditor },
      en: { Editor: enContentEditor },
    },
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
});

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
  it("preserves an edited draft across DE and EN language changes", async () => {
    render(
      <BackendNewTextDraftV2
        menuId={10003}
        position={1}
        getState={() => ({} as any)}
        onSaved={async () => {}}
      />
    );

    fireEvent.press(screen.getByText("Neuen Textinhalt hinzufügen"));
    fireEvent.press(screen.getByText("TipTap: <p></p>"));

    expect(screen.getByText("TipTap: <p>Mein Entwurf</p>")).toBeTruthy();
    expect(screen.getByText("Entwurf verwerfen")).toBeTruthy();

    try {
      await contentI18nAct(async () => {
        await contentTestI18n.changeLanguage("en");
      });

      expect(screen.getByText("Discard draft")).toBeTruthy();
      expect(screen.getByText("Save online")).toBeTruthy();
      expect(screen.getByText("TipTap: <p>Mein Entwurf</p>")).toBeTruthy();
      expect(screen.queryByText("Entwurf verwerfen")).toBeNull();
    } finally {
      await contentI18nAct(async () => {
        await contentTestI18n.changeLanguage("de");
      });
    }

    expect(screen.getByText("Entwurf verwerfen")).toBeTruthy();
    expect(screen.getByText("Online speichern")).toBeTruthy();
    expect(screen.getByText("TipTap: <p>Mein Entwurf</p>")).toBeTruthy();
  });

  it("uses the existing rich text editor instead of a raw HTML text input", () => {
    render(<BackendNewTextDraftV2 menuId={10003} position={1} getState={() => ({} as any)} onSaved={async () => {}} />);
    fireEvent.press(screen.getByText("Neuen Textinhalt hinzufügen"));
    expect(screen.getByText("TipTap: <p></p>")).toBeTruthy();
    expect(screen.queryByText("Vorschau anzeigen")).toBeNull();
    expect(screen.queryByText("Im Backend speichern")).toBeNull();
  });
  it("does not use a separate preview button", () => {
    render(<BackendNewTextDraftV2 menuId={10003} position={1} getState={() => ({} as any)} onSaved={async () => {}} />);
    fireEvent.press(screen.getByText("Neuen Textinhalt hinzufügen"));
    expect(screen.queryByText("Vorschau anzeigen")).toBeNull();
  });
  it("updates the local draft and supports discard without an API call", () => {
    render(<BackendNewTextDraftV2 menuId={10003} position={1} getState={() => ({} as any)} onSaved={async () => {}} />);
    fireEvent.press(screen.getByText("Neuen Textinhalt hinzufügen"));
    fireEvent.press(screen.getByText("TipTap: <p></p>"));
    expect(screen.getByText("TipTap: <p>Mein Entwurf</p>")).toBeTruthy();
    fireEvent.press(screen.getByText("Entwurf verwerfen"));
    fireEvent.press(screen.getByText("Neuen Textinhalt hinzufügen"));
    expect(screen.getByText("TipTap: <p></p>")).toBeTruthy();
  });
});
