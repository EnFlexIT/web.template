import {
  renameBackendMenuV2,
  type BackendMenuRenameContext,
} from "../src/template/editor/adapters/renameBackendMenuV2";

const originalMenu = {
  menuId: 10003,
  parentId: 10001,
  isHeadMenu: false,
  position: 2,
  caption: "Alter Name",
  pathId: "/10001/10003",
  pathCaption: "/Produkte/Alter Name",
  pathPosition: "/1/2",
};

function setup() {
  const getMenus = jest.fn().mockResolvedValue({
    data: {
      menuList: [{ ...originalMenu }],
    },
  });

  const updateMenu = jest.fn().mockResolvedValue({
    data: {},
  });

  const client = { getMenus, updateMenu };

  const context: BackendMenuRenameContext = {
    client,
    server: "http://localhost:8080",
    authGeneration: 1,
    isLoggedIn: true,
    canEdit: true,
    isSwitchingServer: false,
    isLoggingOut: false,
  };

  return {
    getMenus,
    updateMenu,
    context,
    getContext: () => context,
  };
}

describe("renameBackendMenuV2", () => {
  it("renames a menu without changing its other fields", async () => {
    const state = setup();

    await renameBackendMenuV2({
      menuId: 10003,
      caption: "Neuer Name",
      language: "de",
      getContext: state.getContext,
    });

    expect(state.getMenus).toHaveBeenCalledWith("de");
    expect(state.updateMenu).toHaveBeenCalledTimes(1);

    expect(state.updateMenu).toHaveBeenCalledWith(
      10003,
      {
        ...originalMenu,
        caption: "Neuer Name",
      },
    );
  });

  it("does not write when the caption is unchanged", async () => {
    const state = setup();

    await renameBackendMenuV2({
      menuId: 10003,
      caption: "Alter Name",
      language: "de",
      getContext: state.getContext,
    });

    expect(state.updateMenu).not.toHaveBeenCalled();
  });

  it("rejects an invalid menu ID", async () => {
    const state = setup();

    await expect(
      renameBackendMenuV2({
        menuId: -1,
        caption: "Neuer Name",
        language: "de",
        getContext: state.getContext,
      }),
    ).rejects.toThrow("Invalid backend menu ID");

    expect(state.getMenus).not.toHaveBeenCalled();
    expect(state.updateMenu).not.toHaveBeenCalled();
  });

  it("rejects missing edit permission", async () => {
    const state = setup();
    state.context.canEdit = false;

    await expect(
      renameBackendMenuV2({
        menuId: 10003,
        caption: "Neuer Name",
        language: "de",
        getContext: state.getContext,
      }),
    ).rejects.toThrow("not authorized");

    expect(state.getMenus).not.toHaveBeenCalled();
    expect(state.updateMenu).not.toHaveBeenCalled();
  });

  it("rejects an unknown menu ID", async () => {
    const state = setup();

    await expect(
      renameBackendMenuV2({
        menuId: 99999,
        caption: "Neuer Name",
        language: "de",
        getContext: state.getContext,
      }),
    ).rejects.toThrow("not uniquely found");

    expect(state.updateMenu).not.toHaveBeenCalled();
  });

  it("rejects a session change during inventory loading", async () => {
    const state = setup();

    state.getMenus.mockImplementation(async () => {
      state.context.authGeneration = 2;

      return {
        data: {
          menuList: [{ ...originalMenu }],
        },
      };
    });

    await expect(
      renameBackendMenuV2({
        menuId: 10003,
        caption: "Neuer Name",
        language: "de",
        getContext: state.getContext,
      }),
    ).rejects.toThrow("stale session");

    expect(state.updateMenu).not.toHaveBeenCalled();
  });

  it("rejects an empty caption", async () => {
    const state = setup();

    await expect(
      renameBackendMenuV2({
        menuId: 10003,
        caption: "   ",
        language: "de",
        getContext: state.getContext,
      }),
    ).rejects.toThrow("caption is required");

    expect(state.updateMenu).not.toHaveBeenCalled();
  });

  it("rejects duplicate menu IDs in the response", async () => {
    const state = setup();

    state.getMenus.mockResolvedValue({
      data: {
        menuList: [
          { ...originalMenu },
          { ...originalMenu },
        ],
      },
    });

    await expect(
      renameBackendMenuV2({
        menuId: 10003,
        caption: "Neuer Name",
        language: "de",
        getContext: state.getContext,
      }),
    ).rejects.toThrow("not uniquely found");

    expect(state.updateMenu).not.toHaveBeenCalled();
  });

  it("rejects a session change after the update", async () => {
    const state = setup();

    state.updateMenu.mockImplementation(async () => {
      state.context.isLoggedIn = false;
      return { data: {} };
    });

    await expect(
      renameBackendMenuV2({
        menuId: 10003,
        caption: "Neuer Name",
        language: "de",
        getContext: state.getContext,
      }),
    ).rejects.toThrow("stale session");

    expect(state.updateMenu).toHaveBeenCalledTimes(1);
  });
});