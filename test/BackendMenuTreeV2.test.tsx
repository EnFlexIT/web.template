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
import { useNavigation } from "@react-navigation/native";
import { useStore } from "react-redux";
import { useAppSelector } from "../src/template/state/store/useAppSelector";
import { BackendMenuTreeV2 } from "../src/template/editor/components/BackendMenuTreeV2";

const de = require("../assets/locales/de/Editor.json");
const en = require("../assets/locales/en/Editor.json");

jest.mock("@react-navigation/native", () => ({
  useNavigation: jest.fn(),
}));

jest.mock("react-redux", () => ({
  useStore: jest.fn(),
}));

jest.mock(
  "../src/template/state/store/useAppSelector",
  () => ({ useAppSelector: jest.fn() }),
);

jest.mock("react-native-unistyles", () => ({
  useUnistyles: () => ({
    theme: {
      colors: {
        border: "#ccc",
        card: "#fff",
        highlight: "#00f",
      },
    },
  }),
}));

jest.mock(
  "../src/template/components/design-system/themed/ThemedText",
  () => ({
    ThemedText: require("react-native").Text,
  }),
);

jest.mock(
  "../src/template/components/design-system/ui-elements/ActionButton",
  () => {
    const React = require("react");
    const { Pressable, Text } = require("react-native");

    return {
      ActionButton: ({
        label,
        disabled,
        onPress,
      }: {
        label: string;
        disabled?: boolean;
        onPress: () => void;
      }) =>
        React.createElement(
          Pressable,
          { disabled, onPress },
          React.createElement(Text, null, label),
        ),
    };
  },
);

const navigate = jest.fn();
const getAllMenus = jest.fn();
const getMenus = jest.fn();

const menus = [
  {
    menuId: 10,
    isHeadMenu: true,
    position: 1,
    caption: "Private root",
  },
  {
    menuId: 20,
    parentId: 10,
    isHeadMenu: false,
    position: 1,
    caption: "Private child",
  },
];

let state: any;

const store = {
  getState: () => state,
};

function response(items = menus) {
  return { data: { menuList: items } };
}

function deferred() {
  let resolve!: (value: any) => void;

  const promise = new Promise<any>(done => {
    resolve = done;
  });

  return { promise, resolve };
}

async function mount(selectionDisabled = false) {
  const instance = i18next.createInstance();

  await instance.use(initReactI18next).init({
    lng: "de",
    fallbackLng: false,
    ns: ["Editor"],
    defaultNS: "Editor",
    resources: {
      de: { Editor: de },
      en: { Editor: en },
    },
    interpolation: { escapeValue: false },
  });

  const element = () => (
    <I18nextProvider i18n={instance}>
      <BackendMenuTreeV2
        selectedMenuId={10}
        selectionDisabled={selectionDisabled}
      />
    </I18nextProvider>
  );

  const view = render(element());

  return {
    instance,
    redraw: () => view.rerender(element()),
  };
}

beforeEach(() => {
  jest.clearAllMocks();

  getAllMenus.mockReset();
  getAllMenus.mockResolvedValue(response());

  state = {
    language: { language: "de" },
    backendRoles: {
      status: "ready",
      roles: ["EDITOR"],
    },
    api: {
      ip: "https://example.invalid",
      authGeneration: 1,
      isLoggedIn: true,
      isLoggingOut: false,
      isSwitchingServer: false,
      dynamic_content_api_v2: {
        defaultApi: { getAllMenus, getMenus },
      },
    },
  };

  (useStore as unknown as jest.Mock)
    .mockReturnValue(store);

  (useNavigation as jest.Mock)
    .mockReturnValue({ navigate });

  (useAppSelector as unknown as jest.Mock)
    .mockImplementation(selector => selector(state));
});

describe("BackendMenuTreeV2", () => {
  it("loads the full inventory, not filtered navigation", async () => {
    await mount();

    await screen.findByText("Private child");

    expect(getAllMenus).toHaveBeenCalledTimes(1);
    expect(getAllMenus).toHaveBeenCalledWith("de");
    expect(getMenus).not.toHaveBeenCalled();
  });

  it.each(["USER", "ADMIN"])(
    "does not request inventory for %s without EDITOR",
    async role => {
      state.backendRoles.roles = [role];

      await mount();

      expect(getAllMenus).not.toHaveBeenCalled();
      expect(screen.queryByText("Private root")).toBeNull();
    },
  );

  it("hides already loaded menus after role loss", async () => {
    const view = await mount();

    await screen.findByText("Private child");

    state.backendRoles = {
      status: "ready",
      roles: ["USER"],
    };

    view.redraw();

    expect(screen.queryByText("Private child")).toBeNull();
    expect(screen.queryByText("Private root")).toBeNull();
  });

  it("hides already loaded menus during logout", async () => {
    const view = await mount();

    await screen.findByText("Private child");

    state.api = { ...state.api, isLoggingOut: true };

    view.redraw();

    expect(screen.queryByText("Private child")).toBeNull();
  });

  it("ignores a pending response after permission loss", async () => {
    const pending = deferred();

    getAllMenus.mockReturnValueOnce(pending.promise);

    const view = await mount();

    await waitFor(() => {
      expect(getAllMenus).toHaveBeenCalledTimes(1);
    });

    state.backendRoles = {
      status: "ready",
      roles: [],
    };

    view.redraw();

    await act(async () => {
      pending.resolve(response());
      await pending.promise;
    });

    expect(screen.queryByText("Private child")).toBeNull();
  });

  it("reloads on language change and removes old captions", async () => {
    const view = await mount();

    await screen.findByText("Private child");

    const pending = deferred();

    getAllMenus.mockReturnValueOnce(pending.promise);

    state.language = { language: "en" };

    await act(async () => {
      await view.instance.changeLanguage("en");
      view.redraw();
    });

    expect(screen.queryByText("Private child")).toBeNull();
    expect(screen.getByText(en.backendTree.title)).toBeTruthy();
    expect(getAllMenus).toHaveBeenLastCalledWith("en");

    await act(async () => {
      pending.resolve(response([
        { ...menus[0], caption: "English root" },
        { ...menus[1], caption: "English child" },
      ]));
      await pending.promise;
    });

    await screen.findByText("English child");
  });

  it("blocks menu selection in read-only integration mode", async () => {
    await mount(true);

    await screen.findByText("Private child");

    const button = screen.getByLabelText("Private child");

    expect(button.props.accessibilityState.disabled).toBe(true);

    fireEvent.press(button);

    expect(navigate).not.toHaveBeenCalled();
  });

  it("rejects selection after an authentication generation change", async () => {
    await mount();

    await screen.findByText("Private child");

    state.api = {
      ...state.api,
      authGeneration: 2,
    };

    // No redraw: exercise the event-time session guard.
    fireEvent.press(
      screen.getByLabelText("Private child"),
    );

    expect(navigate).not.toHaveBeenCalled();
  });

  it("shows a translated error without fallback", async () => {
    getAllMenus.mockRejectedValueOnce(
      new Error("HTTP 503"),
    );

    const view = await mount();

    await screen.findByText(de.backendTree.loadError);

    await act(async () => {
      await view.instance.changeLanguage("en");
    });

    expect(
      screen.getByText(en.backendTree.loadError),
    ).toBeTruthy();

    expect(getMenus).not.toHaveBeenCalled();
  });
});
