import {
  moveBackendMenuV2,
} from "../src/template/editor/adapters/moveBackendMenuV2";

import type {
  BackendMenuRenameContext,
} from "../src/template/editor/adapters/renameBackendMenuV2";

const menus = [
  {
    menuId: 1,
    isHeadMenu: true,
    position: 0,
    caption: "Produkte",
  },
  {
    menuId: 2,
    parentId: 1,
    isHeadMenu: false,
    position: 0,
    caption: "Software",
  },
  {
    menuId: 3,
    parentId: 1,
    isHeadMenu: false,
    position: 1,
    caption: "Hardware",
  },
  {
    menuId: 4,
    parentId: 2,
    isHeadMenu: false,
    position: 0,
    caption: "Dokumentation",
  },
];

function setup() {
  const getMenus = jest.fn().mockResolvedValue({
    data: {
      menuList: menus.map(item => ({ ...item })),
    },
  });

  const updateMenu = jest.fn().mockResolvedValue({
    data: {},
  });

  const context: BackendMenuRenameContext = {
    client: { getMenus, updateMenu },
    server: "http://localhost:8080",
    authGeneration: 1,
    isLoggedIn: true,
    canEdit: true,
    isSwitchingServer: false,
    isLoggingOut: false,
  };

  const params = {
    menuId: 4,
    targetParentId: 3,
    allowedParentIds: [1, 2, 3],
    language: "de",
    getContext: () => context,
  };

  return { context, getMenus, updateMenu, params };
}

describe("moveBackendMenuV2", () => {
  it("moves a menu using the V2 API", async () => {
    const state = setup();

    await moveBackendMenuV2(state.params);

    expect(state.getMenus).toHaveBeenCalledWith("de");

    expect(state.updateMenu).toHaveBeenCalledTimes(1);
    expect(state.updateMenu).toHaveBeenCalledWith(
      4,
      {
        ...menus[3],
        parentId: 3,
        position: 1,
      },
    );
  });

  it("rejects missing permission", async () => {
    const state = setup();
    state.context.canEdit = false;

    await expect(
      moveBackendMenuV2(state.params),
    ).rejects.toThrow("not authorized");

    expect(state.getMenus).not.toHaveBeenCalled();
    expect(state.updateMenu).not.toHaveBeenCalled();
  });

  it("rejects an unauthorized target", async () => {
    const state = setup();

    await expect(
      moveBackendMenuV2({
        ...state.params,
        allowedParentIds: [1, 2],
      }),
    ).rejects.toThrow("not allowed");

    expect(state.updateMenu).not.toHaveBeenCalled();
  });

  it("rejects a session change during loading", async () => {
    const state = setup();

    state.getMenus.mockImplementation(async () => {
      state.context.authGeneration = 2;

      return {
        data: {
          menuList: menus,
        },
      };
    });

    await expect(
      moveBackendMenuV2(state.params),
    ).rejects.toThrow("stale session");

    expect(state.updateMenu).not.toHaveBeenCalled();
  });

  it("rejects a session change after updating", async () => {
    const state = setup();

    state.updateMenu.mockImplementation(async () => {
      state.context.isLoggedIn = false;
      return { data: {} };
    });

    await expect(
      moveBackendMenuV2(state.params),
    ).rejects.toThrow("stale session");

    expect(state.updateMenu).toHaveBeenCalledTimes(1);
  });

  it("rejects an invalid backend inventory", async () => {
    const state = setup();

    state.getMenus.mockResolvedValue({
      data: {
        menuList: null,
      },
    });

    await expect(
      moveBackendMenuV2(state.params),
    ).rejects.toThrow("Invalid backend menu inventory");

    expect(state.updateMenu).not.toHaveBeenCalled();
  });
});