import React from "react";
import {
  fireEvent,
  render,
  screen,
} from "@testing-library/react-native";

import { useNavigation } from "@react-navigation/native";
import { useAppSelector } from
  "../src/template/state/store/useAppSelector";

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
const navigate = jest.fn();

describe("BackendContentEditorLaunchV2", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedNavigation.mockReturnValue({ navigate });
  });

  it("passes the current menu ID to route 3027", () => {
    mockedSelector.mockReturnValue(true);

    render(<BackendContentEditorLaunchV2 menuId={123} />);

    fireEvent.press(
      screen.getByText("Backend-Inhalte bearbeiten"),
    );

    expect(navigate).toHaveBeenCalledWith("3027", {
      backendMenuId: 123,
    });
  });

  it("does not display the button without permission", () => {
    mockedSelector.mockReturnValue(false);

    render(<BackendContentEditorLaunchV2 menuId={123} />);

    expect(
      screen.queryByText("Backend-Inhalte bearbeiten"),
    ).toBeNull();
  });

  it.each([0, -1, 1.5, Number.NaN])(
    "rejects invalid menu IDs",
    menuId => {
      mockedSelector.mockReturnValue(true);

      render(<BackendContentEditorLaunchV2 menuId={menuId} />);

      expect(
        screen.queryByText("Backend-Inhalte bearbeiten"),
      ).toBeNull();
    },
  );
});