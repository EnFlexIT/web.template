import { configureStore } from "@reduxjs/toolkit";

import {
  configureNavigationRuntime,
  resetNavigationRuntime,
} from "../src/template/navigation/navigationRuntime";

import type {
  ApplicationConfig,
} from "../src/template/application/ApplicationConfig";

import menuReducer, {
  initializeMenu,
} from "../src/template/state/navigation/menuSlice";

type TestApi = {
  isLoggedIn: boolean;
  isPointingToServer: boolean;
  isSwitchingServer: boolean;
  isLoggingOut: boolean;
  ip: string;
  jwt: string | null;
  authenticationMethod: "jwt";
  dynamic_content_api: {
    defaultApi: {
      menuGet: jest.Mock;
    };
  };
};

function deferredResponse() {
  let resolve!: (value: unknown) => void;

  const promise = new Promise<unknown>((done) => {
    resolve = done;
  });

  return { promise, resolve };
}

describe("initializeMenu session consistency", () => {
  beforeEach(() => {
    configureNavigationRuntime({
      menu: {
        items: [],
        defaultMenuID: undefined,
        isEnabled: () => true,
      },
      tabs: {
        items: [],
      },
      editor: {},
    } as unknown as ApplicationConfig<any>["navigation"]);
  });

  afterEach(() => {
    resetNavigationRuntime();
  });
  it("discards a successful response from an obsolete JWT session", async () => {
    const pending = deferredResponse();

    const menuGet = jest.fn().mockReturnValue(pending.promise);

    const initialApi: TestApi = {
      isLoggedIn: true,
      isPointingToServer: true,
      isSwitchingServer: false,
      isLoggingOut: false,
      ip: "https://server-a.invalid",
      jwt: "jwt-session-a",
      authenticationMethod: "jwt",
      dynamic_content_api: {
        defaultApi: {
          menuGet,
        },
      },
    };

    const store = configureStore({
      reducer: {
        api: (
          state: TestApi = initialApi,
          action: { type: string },
        ): TestApi => {
          if (action.type === "test/replaceJwtSession") {
            return {
              ...state,
              jwt: "jwt-session-b",
            };
          }

          return state;
        },

        language: (
          state = { language: "de" },
        ) => state,

        backendRoles: (
          state = {
            status: "ready",
            roles: ["Vermieter"],
            selectedPreviewRole: "Vermieter",
            requestId: "roles-request-a",
          },
        ) => state,

        groupRoles: (
          state = {
            status: "ready",
            roles: ["Vermieter"],
            selectedGroupRole: "Vermieter",
            requestId: null,
            error: null,
          },
        ) => state,
        menu: menuReducer,
      },

      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: false,
        }),
    });

    const request = store.dispatch(
      initializeMenu() as any,
    );

    // First verify that the test really reached the HTTP call.
    expect(menuGet).toHaveBeenCalledWith(
      "de",
      {
        params: {
          forRole: "Vermieter",
        },
      },
    );

    // Change the session while the HTTP response is pending.
    store.dispatch({ type: "test/replaceJwtSession" });

    pending.resolve({
      data: {
        menuList: [
          {
            menuId: 701,
            parentId: null,
            position: 1,
            caption: "Old session menu",
          },
        ],
      },
    });

    const result = await request;

    expect(
      initializeMenu.fulfilled.match(result),
    ).toBe(true);

    if (!initializeMenu.fulfilled.match(result)) {
      throw new Error("Expected fulfilled request");
    }

    expect(result.payload.dynamicMenu).toEqual([]);

    // No old-session dynamic entries may be stored.
    expect(
      store.getState().menu.rawMenu.some(
        (entry) => entry.menuID === 701,
      ),
    ).toBe(false);
  });
});