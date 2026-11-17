import React from "react";
import { useAppSelector } from "../src/template/state/store/useAppSelector";
import { render } from "@testing-library/react-native";
import { useNavigationState } from "@react-navigation/native";

import {
  RouteAwareLocalEditorPanel,
} from "../src/template/editor/components/RouteAwareLocalEditorPanel";

jest.mock("@react-navigation/native", () => ({
  useNavigationState: jest.fn(),
}));

jest.mock("react-native-unistyles", () => ({
  useUnistyles: () => ({ theme: { colors: { card: "white", border: "gray" } } }),
}));

jest.mock("../src/template/state/store/useAppSelector", () => ({
  useAppSelector: jest.fn(),
}));

jest.mock("../src/template/editor/adapters/updateBackendContentElementFromStore", () => ({
  selectBackendContentWriteContext: jest.fn(),
}));

jest.mock("../src/template/state/authorization/selectUiPreviewMode", () => ({
  selectCanEditInUiPreview: jest.fn(),
}));

jest.mock("../src/template/editor/screens/BackendMenuContentScreenV2", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    BackendMenuContentScreenV2: ({ menuId }: { menuId: number }) =>
      React.createElement(Text, null, `Backend-Editor-${menuId}`),
  };
});

jest.mock(
  "../src/template/editor/components/LocalContentEditorPanel",
  () => {
    const React = require("react");
    const { Text } = require("react-native");

    return {
      LocalContentEditorPanel: () =>
        React.createElement(Text, null, "Lokales Panel"),
    };
  },
);

const mockNavigationState = useNavigationState as jest.Mock;
const mockSelector = useAppSelector as unknown as jest.Mock;

function setRoute(
  name: string,
  params?: { backendMenuId?: number },
) {
  mockNavigationState.mockImplementation(
    selector =>
      selector({
        index: 0,
        routes: [{ name, params }],
      }),
  );
}

describe("RouteAwareLocalEditorPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSelector.mockReturnValue(true);
  });

  it("hides the local panel on a V2 backend editor route", () => {
    setRoute("3027", { backendMenuId: 10003 });

    const tree = render(<RouteAwareLocalEditorPanel />);
    expect(tree.getByText("Backend-Editor-10003")).toBeTruthy();
    const nodes = tree.toJSON();
    expect(Array.isArray(nodes)).toBe(true);
    expect((nodes as any[])[0]).toMatchObject({
      props: { style: { display: "none" } },
    });
  });

  it("keeps local panel available on other routes", () => {
    setRoute("10003");

    const tree = render(<RouteAwareLocalEditorPanel />);
    expect(tree.toJSON()).toMatchObject({
      props: {},
    });
  });

  it("does not mount backend editor without permission", () => {
    setRoute("3027", { backendMenuId: 10003 });
    mockSelector.mockReturnValue(false);
    const tree = render(<RouteAwareLocalEditorPanel />);
    expect(tree.queryByText("Backend-Editor-10003")).toBeNull();
  });

  it("does not hide the panel on local route 3027", () => {
    setRoute("3027", {});

    const tree = render(<RouteAwareLocalEditorPanel />);
    expect(tree.toJSON()).toMatchObject({
      props: {},
    });
  });
});