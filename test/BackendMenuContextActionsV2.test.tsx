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
  BackendMenuContextActionsV2,
} from "../src/template/editor/components/BackendMenuContextActionsV2";

jest.mock("@react-navigation/native", () => ({
  useNavigation: jest.fn(),
}));

jest.mock(
  "../src/template/state/store/useAppSelector",
  () => ({ useAppSelector: jest.fn() }),
);

jest.mock(
  "../src/template/state/authorization/selectUiPreviewMode",
  () => ({ selectCanEditInUiPreview: jest.fn() }),
);

jest.mock(
  "../src/template/editor/adapters/updateBackendContentElementFromStore",
  () => ({ selectBackendContentWriteContext: jest.fn() }),
);

jest.mock(
  "../src/template/components/design-system/ui-elements/Dropdown",
  () => {
    const React = require("react");
    const { Pressable, Text } = require("react-native");

    return {
      Dropdown: (props: {
        onChange: (value: string) => void;
      }) =>
        React.createElement(
          Pressable,
          { onPress: () => props.onChange("open") },
          React.createElement(Text, null, "Backend-Menueaktionen"),
        ),
    };
  },
);

const mockNavigation = useNavigation as jest.Mock;
const mockSelector = useAppSelector as unknown as jest.Mock;
const mockPreview = selectCanEditInUiPreview as jest.Mock;
const mockContext = selectBackendContentWriteContext as jest.Mock;
const navigate = jest.fn();

const validContext = {
  isLoggedIn: true,
  canEdit: true,
  isSwitchingServer: false,
  isLoggingOut: false,
  server: "https://example.invalid",
};

function mount(status = "ready", menuId = 42) {
  mockSelector.mockImplementation(
    selector => selector({ backendRoles: { status } }),
  );

  return render(<BackendMenuContextActionsV2 menuId={menuId} />);
}

describe("BackendMenuContextActionsV2", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigation.mockReturnValue({ navigate });
    mockPreview.mockReturnValue(true);
    mockContext.mockReturnValue({ ...validContext });
  });

  it("opens the V2 editor for the selected menu", () => {
    mount();

    fireEvent.press(screen.getByText("Backend-Menueaktionen"));

    expect(navigate).toHaveBeenCalledWith("3027", {
      backendMenuId: 42,
    });
  });

  it.each(["idle", "loading", "error"])(
    "hides actions for role status %s",
    status => {
      mount(status);
      expect(screen.queryByText("Backend-Menueaktionen")).toBeNull();
    },
  );

  it("hides actions without edit permission", () => {
    mockContext.mockReturnValue({ ...validContext, canEdit: false });
    mount();
    expect(screen.queryByText("Backend-Menueaktionen")).toBeNull();
  });

  it("hides actions during a server switch", () => {
    mockContext.mockReturnValue({
      ...validContext,
      isSwitchingServer: true,
    });
    mount();
    expect(screen.queryByText("Backend-Menueaktionen")).toBeNull();
  });

  it("hides actions after logout", () => {
    mockContext.mockReturnValue({
      ...validContext,
      isLoggedIn: false,
    });
    mount();
    expect(screen.queryByText("Backend-Menueaktionen")).toBeNull();
  });

  it("hides actions for read-only preview", () => {
    mockPreview.mockReturnValue(false);
    mount();
    expect(screen.queryByText("Backend-Menueaktionen")).toBeNull();
  });

  it.each([0, -1, 1.5, Number.NaN])(
    "rejects invalid menu IDs",
    menuId => {
      mount("ready", menuId);
      expect(screen.queryByText("Backend-Menueaktionen")).toBeNull();
    },
  );
});