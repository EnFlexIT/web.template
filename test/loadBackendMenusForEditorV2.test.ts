import {
  loadBackendMenusForEditorV2,
} from "../src/template/editor/adapters/loadBackendMenusForEditorV2";

import type {
  TemplateRootState,
} from "../src/template/state/store/templateStoreTypes";

const menus = [
  {
    menuId: 10,
    isHeadMenu: true,
    position: 1,
    caption: "Home",
  },
  {
    menuId: 20,
    parentId: 10,
    isHeadMenu: false,
    position: 1,
    caption: "Untermenü",
  },
];

function stateWith(
  getMenus: jest.Mock,
  overrides: Record<string, unknown> = {},
): TemplateRootState {
  return {
    language: { language: "de" },
    api: {
      isLoggedIn: true,
      isLoggingOut: false,
      isSwitchingServer: false,
      ip: "https://test.invalid",
      authGeneration: 1,
      dynamic_content_api_v2: {
        defaultApi: { getMenus },
      },
      ...overrides,
    },
  } as unknown as TemplateRootState;
}

describe("loadBackendMenusForEditorV2", () => {
  it("loads backend menus without changing their identifiers", async () => {
    const getMenus = jest.fn().mockResolvedValue({
      data: { menuList: menus },
    });

    const state = stateWith(getMenus);

    const result = await loadBackendMenusForEditorV2({
      getState: () => state,
    });

    expect(getMenus).toHaveBeenCalledTimes(1);
    expect(getMenus).toHaveBeenCalledWith("de");
    expect(result).toEqual(menus);
    expect(result).not.toBe(menus);
  });

  it("rejects an inactive session before reading", async () => {
    const getMenus = jest.fn();

    const state = stateWith(getMenus, {
      isLoggedIn: false,
    });

    await expect(
      loadBackendMenusForEditorV2({
        getState: () => state,
      }),
    ).rejects.toThrow(/not authorized/);

    expect(getMenus).not.toHaveBeenCalled();
  });

  it("rejects a session change during loading", async () => {
    let finish!: (value: unknown) => void;

    const getMenus = jest.fn().mockImplementation(
      () => new Promise(resolve => {
        finish = resolve;
      }),
    );

    let state = stateWith(getMenus);

    const operation = loadBackendMenusForEditorV2({
      getState: () => state,
    });

    state = stateWith(getMenus, {
      authGeneration: 2,
    });

    finish({ data: { menuList: menus } });

    await expect(operation).rejects.toThrow(/stale session/);
  });

  it("rejects duplicate menu IDs", async () => {
    const getMenus = jest.fn().mockResolvedValue({
      data: {
        menuList: [menus[0], menus[0]],
      },
    });

    const state = stateWith(getMenus);

    await expect(
      loadBackendMenusForEditorV2({
        getState: () => state,
      }),
    ).rejects.toThrow(/Invalid backend menu inventory/);
  });
});
