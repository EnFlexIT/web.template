import React from "react";
import i18next from "i18next";

import {
  I18nextProvider,
  initReactI18next,
} from "react-i18next";

import {
  act,
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react-native";

import {
  BackendMenuCreateDialogV2,
} from "../src/template/editor/components/BackendMenuCreateDialogV2";

const de = require("../assets/locales/de/Editor.json");
const en = require("../assets/locales/en/Editor.json");

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

async function mount(
  onSubmit = jest.fn(async () => {}),
) {
  const instance = i18next.createInstance();

  await instance.use(initReactI18next).init({
    lng: "de",
    fallbackLng: false,
    supportedLngs: ["de", "en"],
    ns: ["Editor"],
    defaultNS: "Editor",
    resources: {
      de: { Editor: de },
      en: { Editor: en },
    },
    interpolation: {
      escapeValue: false,
    },
  });

  render(
    <I18nextProvider i18n={instance}>
      <BackendMenuCreateDialogV2
        visible
        parentId={10021}
        parentCaption="Software"
        availableRoles={["Vermieter"]}
        onClose={jest.fn()}
        onSubmit={onSubmit}
      />
    </I18nextProvider>,
  );

  return instance;
}

function enterValues() {
  fireEvent.changeText(
    screen.getByTestId("create-menu-caption"),
    "Documentation",
  );

  fireEvent.press(
    screen.getByTestId("create-role-Vermieter"),
  );
}

describe("Create dialog language switching", () => {
  it("switches DE and EN without losing form values", async () => {
    const instance = await mount();

    expect(screen.getByText(de.create.title)).toBeTruthy();

    expect(
      screen.getByText(de.create.selectRole),
    ).toBeTruthy();

    enterValues();

    await act(async () => {
      await instance.changeLanguage("en");
    });

    expect(screen.getByText(en.create.title)).toBeTruthy();

    expect(
      screen.getByText(en.create.appendPosition),
    ).toBeTruthy();

    expect(
      screen.getByText(en.create.accessRoles),
    ).toBeTruthy();

    expect(
      screen.getByTestId("create-menu-caption").props.value,
    ).toBe("Documentation");

    expect(
      screen.getByTestId("create-role-Vermieter")
        .props.accessibilityState.checked,
    ).toBe(true);

    await act(async () => {
      await instance.changeLanguage("de");
    });

    expect(screen.getByText(de.create.title)).toBeTruthy();
    expect(screen.getByText(de.create.confirm)).toBeTruthy();
  });

  it("translates existing errors without allowing duplicate creation", async () => {
    const onSubmit = jest.fn(async () => {
      throw new Error("create.verificationFailed");
    });

    const instance = await mount(onSubmit);

    enterValues();

    fireEvent.press(
      screen.getByTestId("create-menu-confirm"),
    );

    await waitFor(() => {
      expect(
        screen.getByText(de.create.verificationFailed),
      ).toBeTruthy();
    });

    await act(async () => {
      await instance.changeLanguage("en");
    });

    expect(
      screen.getByText(en.create.verificationFailed),
    ).toBeTruthy();

    expect(
      screen.getByText(en.create.retryWarning),
    ).toBeTruthy();

    expect(
      screen.queryByText(de.create.verificationFailed),
    ).toBeNull();

    fireEvent.press(
      screen.getByTestId("create-menu-confirm"),
    );

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
