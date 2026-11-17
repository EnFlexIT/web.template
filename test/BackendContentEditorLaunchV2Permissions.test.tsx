import React from "react";
import {
  fireEvent,
  render,
  screen,
} from "@testing-library/react-native";

import { useNavigation } from "@react-navigation/native";
import { useAppSelector } from
  "../src/template/state/store/useAppSelector";

import { selectCanEditInUiPreview } from
  "../src/template/state/authorization/selectUiPreviewMode";

import { selectBackendContentWriteContext } from
  "../src/template/editor/adapters/updateBackendContentElementFromStore";

import {
  BackendContentEditorLaunchV2,
} from "../src/template/editor/components/BackendContentEditorLaunchV2";

jest.mock("@react-navigation/native", () => ({
  useNavigation: jest.fn(),
}));

jest.mock(
  "../src/template/state/store/useAppSelector",
  () => ({
    useAppSelector: jest.fn(),
  }),
);

jest.mock(
  "../src/template/state/authorization/selectUiPreviewMode",
  () => ({
    selectCanEditInUiPreview: jest.fn(),
  }),
);

jest.mock(
  "../src/template/editor/adapters/updateBackendContentElementFromStore",
  () => ({
    selectBackendContentWriteContext: jest.fn(),
  }),
);

jest.mock(
  "../src/template/components/design-system/ui-elements/ActionButton",
  () => {
    const React = require("react");
    const { Pressable, Text } = require("react-native");

    return {
      ActionButton: (props: {
        label: string;
        onPress: () => void;
      }) =>
        React.createElement(
          Pressable,
          { onPress: props.onPress },
          React.createElement(Text, null, props.label),
        ),
    };
  },
);

const mockedNavigation = useNavigation as jest.Mock;
const mockedSelector = useAppSelector as unknown as jest.Mock;
const mockedPreview =
  selectCanEditInUiPreview as jest.Mock;
const mockedContext =
  selectBackendContentWriteContext as jest.Mock;

const navigate = jest.fn();

const validContext = {
  isLoggedIn: true,
  canEdit: true,
  isSwitchingServer: false,
  isLoggingOut: false,
  server: "https://example.invalid",
};

function renderWithStatus(status: string) {
  mockedSelector.mockImplementation(
    selector => selector({
      backendRoles: { status },
    }),
  );

  return render(
    <BackendContentEditorLaunchV2 menuId={42} />,
  );
}

function expectHidden() {
  expect(
    screen.queryByText("Backend-Inhalte bearbeiten"),
  ).toBeNull();

  expect(navigate).not.toHaveBeenCalled();
}

describe("BackendContentEditorLaunchV2 permissions", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockedNavigation.mockReturnValue({ navigate });
    mockedPreview.mockReturnValue(true);
    mockedContext.mockReturnValue({
      ...validContext,
    });
  });

  it("opens the current menu with verified permission", () => {
    renderWithStatus("ready");

    fireEvent.press(
      screen.getByText("Backend-Inhalte bearbeiten"),
    );

    expect(navigate).toHaveBeenCalledWith(
      "3027",
      { backendMenuId: 42 },
    );
  });

  it.each(["idle", "loading", "error"])(
    "hides the action while role status is %s",
    status => {
      renderWithStatus(status);
      expectHidden();
    },
  );

  it("hides the action after logout", () => {
    mockedContext.mockReturnValue({
      ...validContext,
      isLoggedIn: false,
    });

    renderWithStatus("ready");
    expectHidden();
  });

  it("hides the action during server switching", () => {
    mockedContext.mockReturnValue({
      ...validContext,
      isSwitchingServer: true,
    });

    renderWithStatus("ready");
    expectHidden();
  });

  it("hides the action during logout transition", () => {
    mockedContext.mockReturnValue({
      ...validContext,
      isLoggingOut: true,
    });

    renderWithStatus("ready");
    expectHidden();
  });

  it("hides the action without verified edit rights", () => {
    mockedContext.mockReturnValue({
      ...validContext,
      canEdit: false,
    });

    renderWithStatus("ready");
    expectHidden();
  });

  it("hides the action when preview is not editable", () => {
    mockedPreview.mockReturnValue(false);

    renderWithStatus("ready");
    expectHidden();
  });

  it("hides the action without server address", () => {
    mockedContext.mockReturnValue({
      ...validContext,
      server: "",
    });

    renderWithStatus("ready");
    expectHidden();
  });
});