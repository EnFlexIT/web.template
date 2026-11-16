import React from "react";
import {
  fireEvent,
  render,
  screen,
} from "@testing-library/react-native";

import { useAppSelector } from
  "../src/template/state/store/useAppSelector";

import { useAppDispatch } from
  "../src/template/state/store/useAppDispatch";

import { BackendRoleSwitcher } from
  "../src/template/components/layout/BackendRoleSwitcher";

import { setBackendPreviewRole } from
  "../src/template/state/authorization/backendRolesSlice";

jest.mock(
  "../src/template/state/store/useAppSelector",
  () => ({
    useAppSelector: jest.fn(),
  }),
);

jest.mock(
  "../src/template/state/store/useAppDispatch",
  () => ({
    useAppDispatch: jest.fn(),
  }),
);

jest.mock("@design-system", () => {
  const React = require("react");
  const { Pressable, Text } = require("react-native");

  return {
    Dropdown: (props: {
      value: string;
      options: Record<string, string>;
      onChange: (value: string) => void;
    }) =>
      React.createElement(
        Pressable,
        {
          onPress: () => props.onChange("EDITOR"),
        },
        React.createElement(
          Text,
          null,
          "Aktive Rolle: " + props.value,
        ),
      ),
  };
});

const mockSelector = useAppSelector as unknown as jest.Mock;
const mockDispatchHook = useAppDispatch as unknown as jest.Mock;

const dispatch = jest.fn();

function renderSwitcher(
  roles: string[],
  mode: string,
  status: string,
  pendingRole: string | null,
) {
  mockSelector
    .mockReturnValueOnce(roles)
    .mockReturnValueOnce(mode)
    .mockReturnValueOnce(status)
    .mockReturnValueOnce(pendingRole);

  return render(<BackendRoleSwitcher />);
}

describe("BackendRoleSwitcher JWT stability", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockDispatchHook.mockReturnValue(dispatch);
  });

  it("shows validation instead of USER during JWT refresh", () => {
    renderSwitcher([], "USER", "idle", "EDITOR");

    expect(
      screen.getByText("Rollen werden geprueft..."),
    ).toBeTruthy();

    expect(
      screen.queryByText("Aktive Rolle: USER"),
    ).toBeNull();
  });

  it("keeps the dropdown unavailable while roles load", () => {
    renderSwitcher([], "USER", "loading", "ADMIN");

    expect(
      screen.getByText("Rollen werden geprueft..."),
    ).toBeTruthy();

    expect(
      screen.queryByText("Aktive Rolle: USER"),
    ).toBeNull();
  });

  it("shows the confirmed previous role", () => {
    renderSwitcher(
      ["USER", "EDITOR", "ADMIN"],
      "EDITOR",
      "ready",
      null,
    );

    expect(
      screen.getByText("Aktive Rolle: EDITOR"),
    ).toBeTruthy();
  });

  it("does not expose the dropdown if role verification fails", () => {
    renderSwitcher([], "USER", "error", "EDITOR");

    expect(
      screen.getByText("Rollen nicht verfuegbar"),
    ).toBeTruthy();

    expect(
      screen.queryByText("Aktive Rolle: USER"),
    ).toBeNull();
  });

  it("allows a confirmed role selection", () => {
    renderSwitcher(
      ["USER", "EDITOR", "ADMIN"],
      "USER",
      "ready",
      null,
    );

    fireEvent.press(
      screen.getByText("Aktive Rolle: USER"),
    );

    expect(dispatch).toHaveBeenCalledWith(
      setBackendPreviewRole("EDITOR"),
    );
  });
});