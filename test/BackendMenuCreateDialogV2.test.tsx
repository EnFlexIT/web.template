import React from "react";

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";

import {
  BackendMenuCreateDialogV2,
} from "../src/template/editor/components/BackendMenuCreateDialogV2";

jest.mock(
  "../src/template/components/design-system/ui-elements/BaseModal",
  () => ({
    BaseModal: ({
      visible,
      children,
    }: {
      visible: boolean;
      children: React.ReactNode;
    }) => visible ? children : null,
  }),
);

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (
      key: string,
      options?: { defaultValue?: string },
    ) => options?.defaultValue ?? key,
  }),
}));

describe("BackendMenuCreateDialogV2", () => {
  const onClose = jest.fn();

  const onSubmit = jest.fn(
    async (
      _caption: string,
      _roles: readonly string[],
    ) => {},
  );

  function mount(
    overrides: Partial<
      React.ComponentProps<
        typeof BackendMenuCreateDialogV2
      >
    > = {},
  ) {
    return render(
      <BackendMenuCreateDialogV2
        visible
        parentId={10021}
        parentCaption="Software"
        availableRoles={["TEAM_TEST"]}
        onClose={onClose}
        onSubmit={onSubmit}
        {...overrides}
      />,
    );
  }

  function enterValidValues() {
    fireEvent.changeText(
      screen.getByTestId("create-menu-caption"),
      "  Documentation  ",
    );

    fireEvent.press(
      screen.getByTestId("create-role-TEAM_TEST"),
    );
  }

  function confirm() {
    fireEvent.press(
      screen.getByTestId("create-menu-confirm"),
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("submits an explicitly public menu", async () => {
    mount({ availableRoles: [] });

    fireEvent.changeText(
      screen.getByTestId("create-menu-caption"),
      "Public documentation",
    );

    fireEvent.press(
      screen.getByTestId("create-access-public"),
    );

    expect(
      screen.getByTestId("create-public-warning"),
    ).toBeTruthy();

    confirm();

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        "Public documentation",
        [],
        "public",
      );

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it("clears role selection when switching access mode", () => {
    mount();
    enterValidValues();

    fireEvent.press(
      screen.getByTestId("create-access-public"),
    );

    fireEvent.press(
      screen.getByTestId("create-access-restricted"),
    );

    expect(
      screen.getByTestId("create-role-TEAM_TEST")
        .props.accessibilityState.checked,
    ).toBe(false);

    confirm();

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("keeps public submission disabled without a handler", () => {
    mount({ onSubmit: undefined });

    fireEvent.changeText(
      screen.getByTestId("create-menu-caption"),
      "Public documentation",
    );

    fireEvent.press(
      screen.getByTestId("create-access-public"),
    );

    expect(
      screen.getByTestId("create-menu-submit-unavailable"),
    ).toBeTruthy();

    expect(
      screen.getByTestId("create-menu-confirm")
        .props.accessibilityState.disabled,
    ).toBe(true);

    confirm();

    expect(onClose).not.toHaveBeenCalled();
  });

  it("blocks an empty form", () => {
    mount();
    confirm();

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("requires explicit access roles", () => {
    mount();

    fireEvent.changeText(
      screen.getByTestId("create-menu-caption"),
      "Documentation",
    );

    confirm();

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("blocks creation without a submit handler", () => {
    mount({ onSubmit: undefined });
    enterValidValues();
    confirm();

    expect(onClose).not.toHaveBeenCalled();
  });

  it("blocks creation while loading the parent", () => {
    mount({ loading: true });
    confirm();

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("blocks creation after a parent loading error", () => {
    mount({ parentError: "Parent unavailable" });
    enterValidValues();
    confirm();

    expect(onSubmit).not.toHaveBeenCalled();
    expect(
      screen.getByText("Parent unavailable"),
    ).toBeTruthy();
  });

  it("blocks invalid parent IDs", () => {
    mount({ parentId: -1 });
    enterValidValues();
    confirm();

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits the trimmed caption and selected roles", async () => {
    mount();
    enterValidValues();
    confirm();

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        "Documentation",
        ["TEAM_TEST"],
      );

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it("prevents duplicate submissions and closing while busy", async () => {
    let complete!: () => void;

    onSubmit.mockImplementationOnce(
      () => new Promise<void>(resolve => {
        complete = resolve;
      }),
    );

    mount();
    enterValidValues();

    confirm();
    confirm();

    fireEvent.press(
      screen.getByTestId("create-menu-cancel"),
    );

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();

    await act(async () => {
      complete();
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("blocks retry after an uncertain creation failure", async () => {
    onSubmit.mockRejectedValueOnce(
      new Error("Created menu could not be verified"),
    );

    mount();
    enterValidValues();
    confirm();

    await waitFor(() => {
      expect(
        screen.getByText(
          "create.verificationFailed",
        ),
      ).toBeTruthy();
    });

    confirm();

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("blocks roles removed before submission", () => {
    const view = mount();

    enterValidValues();

    view.rerender(
      <BackendMenuCreateDialogV2
        visible
        parentId={10021}
        parentCaption="Software"
        availableRoles={["OTHER_TEAM"]}
        onClose={onClose}
        onSubmit={onSubmit}
      />,
    );

    confirm();

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
