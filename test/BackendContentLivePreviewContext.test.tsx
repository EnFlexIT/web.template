import React from "react";
import { Pressable, Text } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { useAppSelector } from "../src/template/state/store/useAppSelector";
import {
  BackendContentLivePreviewProvider,
  useBackendLiveContent,
} from "../src/template/editor/context/BackendContentLivePreviewContext";

jest.mock("../src/template/state/store/useAppSelector", () => ({
  useAppSelector: jest.fn(),
}));
const mockSelector = useAppSelector as unknown as jest.Mock;
let api = {
  ip: "https://test.invalid",
  authGeneration: 1,
  isLoggedIn: true,
  isLoggingOut: false,
  isSwitchingServer: false,
};

function Writer() {
  const { setLiveBlockHtml, setLiveNewHtml } = useBackendLiveContent();
  return (
    <>
      <Pressable onPress={() => setLiveNewHtml(10003, "<p>Neu!</p>")}>
        <Text>Neuen Entwurf tippen</Text>
      </Pressable>
      <Pressable onPress={() => setLiveBlockHtml(10003, 12, "<p>Geändert!</p>")}>
        <Text>Bestehenden Inhalt tippen</Text>
      </Pressable>
      <Pressable onPress={() => setLiveNewHtml(10003, null)}>
        <Text>Entwurf verwerfen</Text>
      </Pressable>
    </>
  );
}

function Viewer() {
  const { getLiveBlockHtml, getLiveNewHtml } = useBackendLiveContent();
  return (
    <>
      <Text testID="new-preview">{getLiveNewHtml(10003) ?? "leer"}</Text>
      <Text testID="text-preview">{getLiveBlockHtml(10003, 12) ?? "original"}</Text>
      <Text testID="other-menu">{getLiveNewHtml(10004) ?? "leer"}</Text>
    </>
  );
}

function content() {
  return (
    <BackendContentLivePreviewProvider>
      <Writer />
      <Viewer />
    </BackendContentLivePreviewProvider>
  );
}

describe("Backend live content preview", () => {
  beforeEach(() => {
    api = {
      ip: "https://test.invalid",
      authGeneration: 1,
      isLoggedIn: true,
      isLoggingOut: false,
      isSwitchingServer: false,
    };
    mockSelector.mockImplementation(selector => selector({ api }));
  });

  it("shows unsaved new and edited HTML immediately in a sibling viewer", () => {
    render(content());
    fireEvent.press(screen.getByText("Neuen Entwurf tippen"));
    expect(screen.getByTestId("new-preview").props.children).toBe("<p>Neu!</p>");
    expect(screen.getByTestId("other-menu").props.children).toBe("leer");
    fireEvent.press(screen.getByText("Bestehenden Inhalt tippen"));
    expect(screen.getByTestId("text-preview").props.children).toBe("<p>Geändert!</p>");
    fireEvent.press(screen.getByText("Entwurf verwerfen"));
    expect(screen.getByTestId("new-preview").props.children).toBe("leer");
    expect(screen.getByTestId("text-preview").props.children).toBe("<p>Geändert!</p>");
  });

  it("does not expose drafts after logout or server change", () => {
    const tree = render(content());
    fireEvent.press(screen.getByText("Neuen Entwurf tippen"));
    expect(screen.getByTestId("new-preview").props.children).toBe("<p>Neu!</p>");
    api = { ...api, ip: "https://other.invalid" };
    tree.rerender(content());
    expect(screen.getByTestId("new-preview").props.children).toBe("leer");
    api = { ...api, isLoggedIn: false };
    tree.rerender(content());
    expect(screen.getByTestId("new-preview").props.children).toBe("leer");
  });
});
