import {
  selectVerifiedBackendRoles,
} from "../src/template/state/authorization/selectVerifiedBackendRoles";

jest.mock(
  "../src/template/state/authorization/selectVerifiedBackendRoles",
  () => ({
    selectVerifiedBackendRoles: jest.fn(),
  }),
);

const verifiedRolesMock =
  selectVerifiedBackendRoles as jest.Mock;

beforeEach(() => {
  verifiedRolesMock.mockReset();
  verifiedRolesMock.mockReturnValue(["EDITOR"]);
});

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
  getAllMenus: jest.Mock,
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
        defaultApi: { getAllMenus },
      },
      ...overrides,
    },
  } as unknown as TemplateRootState;
}

describe("loadBackendMenusForEditorV2", () => {
  it("loads backend menus without changing their identifiers", async () => {
    const getAllMenus = jest.fn().mockResolvedValue({
      data: { menuList: menus },
    });

    const state = stateWith(getAllMenus);

    const result = await loadBackendMenusForEditorV2({
      getState: () => state,
    });

    expect(getAllMenus).toHaveBeenCalledTimes(1);
    expect(getAllMenus).toHaveBeenCalledWith("de");
    expect(result).toEqual(menus);
    expect(result).not.toBe(menus);
  });

  it("rejects an inactive session before reading", async () => {
    const getAllMenus = jest.fn();

    const state = stateWith(getAllMenus, {
      isLoggedIn: false,
    });

    await expect(
      loadBackendMenusForEditorV2({
        getState: () => state,
      }),
    ).rejects.toThrow(/not authorized/);

    expect(getAllMenus).not.toHaveBeenCalled();
  });

  it("rejects a session change during loading", async () => {
    let finish!: (value: unknown) => void;

    const getAllMenus = jest.fn().mockImplementation(
      () => new Promise(resolve => {
        finish = resolve;
      }),
    );

    let state = stateWith(getAllMenus);

    const operation = loadBackendMenusForEditorV2({
      getState: () => state,
    });

    state = stateWith(getAllMenus, {
      authGeneration: 2,
    });

    finish({ data: { menuList: menus } });

    await expect(operation).rejects.toThrow(/stale session/);
  });

  it("rejects duplicate menu IDs", async () => {
    const getAllMenus = jest.fn().mockResolvedValue({
      data: {
        menuList: [menus[0], menus[0]],
      },
    });

    const state = stateWith(getAllMenus);

    await expect(
      loadBackendMenusForEditorV2({
        getState: () => state,
      }),
    ).rejects.toThrow(/Invalid backend menu inventory/);
  });
});


describe("complete editor inventory security", () => {
  const response = () => ({
    data: { menuList: menus },
  });

  it.each([
    { roles: [] },
    { roles: ["USER"] },
    { roles: ["ADMIN"] },
  ])("denies non-editor backend roles: $roles", async ({ roles }) => {

    verifiedRolesMock.mockReturnValue(roles);

    const getAllMenus = jest.fn();

    const state = stateWith(getAllMenus);

    await expect(
      loadBackendMenusForEditorV2({
        getState: () => state,
      }),
    ).rejects.toThrow(/not authorized/);

    expect(getAllMenus).not.toHaveBeenCalled();
  });

  it("does not fall back to filtered menus", async () => {
    const getMenus = jest.fn();

    const state = stateWith(jest.fn(), {
      dynamic_content_api_v2: {
        defaultApi: { getMenus },
      },
    });

    await expect(
      loadBackendMenusForEditorV2({
        getState: () => state,
      }),
    ).rejects.toThrow(/unavailable/);

    expect(getMenus).not.toHaveBeenCalled();
  });

  it("does not fall back after a failed request", async () => {
    const getAllMenus = jest.fn().mockRejectedValue(
      new Error("HTTP 503"),
    );

    const getMenus = jest.fn();

    const state = stateWith(getAllMenus, {
      dynamic_content_api_v2: {
        defaultApi: { getAllMenus, getMenus },
      },
    });

    await expect(
      loadBackendMenusForEditorV2({
        getState: () => state,
      }),
    ).rejects.toThrow("HTTP 503");

    expect(getAllMenus).toHaveBeenCalledTimes(1);
    expect(getMenus).not.toHaveBeenCalled();
  });

  it("rejects a revoked editor role during loading", async () => {
    const getAllMenus = jest.fn().mockImplementation(
      async () => {
        verifiedRolesMock.mockReturnValue(["USER"]);
        return response();
      },
    );

    const state = stateWith(getAllMenus);

    await expect(
      loadBackendMenusForEditorV2({
        getState: () => state,
      }),
    ).rejects.toThrow(/stale session/);
  });

  it("rejects a language change during loading", async () => {
    const getAllMenus = jest.fn().mockImplementation(
      async () => {
        state = {
          ...state,
          language: {
            ...state.language,
            language: "en",
          },
        };

        return response();
      },
    );

    let state = stateWith(getAllMenus);

    await expect(
      loadBackendMenusForEditorV2({
        getState: () => state,
      }),
    ).rejects.toThrow(/stale session/);
  });

  it("rejects an incomplete parent hierarchy", async () => {
    const getAllMenus = jest.fn().mockResolvedValue({
      data: { menuList: [menus[1]] },
    });

    const state = stateWith(getAllMenus);

    await expect(
      loadBackendMenusForEditorV2({
        getState: () => state,
      }),
    ).rejects.toThrow(/parent/i);
  });

  it("rejects a null inventory entry", async () => {
    const getAllMenus = jest.fn().mockResolvedValue({
      data: { menuList: [null] },
    });

    const state = stateWith(getAllMenus);

    await expect(
      loadBackendMenusForEditorV2({
        getState: () => state,
      }),
    ).rejects.toThrow(/Invalid backend menu inventory/);
  });

  it("accepts a valid empty inventory", async () => {
    const getAllMenus = jest.fn().mockResolvedValue({
      data: { menuList: [] },
    });

    const state = stateWith(getAllMenus);

    await expect(
      loadBackendMenusForEditorV2({
        getState: () => state,
      }),
    ).resolves.toEqual([]);
  });
});
