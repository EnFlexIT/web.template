import {
  createBackendMenuV2,
  type BackendMenuCreateContext,
  type BackendMenuCreateClient,
} from "../src/template/editor/adapters/createBackendMenuV2";

import type {
  CreateMenuRequest,
  MenuList,
} from "../src/api/implementation/Dynamic-Content-Api-V2";

describe("createBackendMenuV2", () => {
  const menus: NonNullable<MenuList["menuList"]> = [
    {
      menuId: 10001,
      isHeadMenu: true,
      position: 1,
      caption: "Home",
    },
    {
      menuId: 10002,
      isHeadMenu: true,
      position: 2,
      caption: "Produkte",
    },
    {
      menuId: 10021,
      parentId: 10002,
      isHeadMenu: false,
      position: 1,
      caption: "Software",
    },
    {
      menuId: 10022,
      parentId: 10002,
      isHeadMenu: false,
      position: 2,
      caption: "Hardware",
    },
  ];

  let context: BackendMenuCreateContext;

  let getAllMenus: jest.Mock;
  let createMenu: jest.Mock;

  function params(
    overrides: Partial<{
      caption: string;
      parentId: number | null;
      language: string;
      allowedRoles: string[];
    }> = {},
  ) {
    return {
      caption: "Neues Menü",
      parentId: null as number | null,
      language: "de",
      allowedRoles: [] as string[],
      getContext: () => context,
      ...overrides,
    };
  }

  beforeEach(() => {
    getAllMenus = jest.fn(async () => ({
      data: {
        menuList: menus,
      },
    }));

    createMenu = jest.fn(async (request: CreateMenuRequest) => {
      getAllMenus.mockResolvedValueOnce({
        data: {
          menuList: [
            ...menus,
            {
              ...request.content,
              menuId: 20001,
            },
          ],
        },
      });

      return {
        data: {
          menuId: 20001,
        },
      };
    });

    const client: BackendMenuCreateClient = {
      getAllMenus,
      createMenu,
    };

    context = {
      client,
      server: "http://localhost:8080",
      authGeneration: 1,
      isLoggedIn: true,
      canEdit: true,
      isSwitchingServer: false,
      isLoggingOut: false,
    };
  });

  it("creates a head menu", async () => {
    const id = await createBackendMenuV2(params());

    expect(id).toBe(20001);

    expect(createMenu).toHaveBeenCalledTimes(1);

    expect(createMenu).toHaveBeenCalledWith({
      allowedRoles: [],
      content: {
        menuId: 0,
        isHeadMenu: true,
        position: 3,
        caption: "Neues Menü",
      },
    } satisfies CreateMenuRequest);
  });

  it("creates a submenu under the selected parent", async () => {
    const id = await createBackendMenuV2(
      params({
        parentId: 10002,
        caption: "  Test-Untermenü  ",
      }),
    );

    expect(id).toBe(20001);

    expect(createMenu).toHaveBeenCalledWith({
      allowedRoles: [],
      content: {
        menuId: 0,
        parentId: 10002,
        isHeadMenu: false,
        position: 3,
        caption: "Test-Untermenü",
      },
    } satisfies CreateMenuRequest);
  });

  it("passes explicit access roles", async () => {
    await createBackendMenuV2(
      params({
        allowedRoles: ["TEAM_TEST"],
      }),
    );

    const request = createMenu.mock.calls[0][0] as CreateMenuRequest;

    expect(request.allowedRoles).toEqual(["TEAM_TEST"]);
  });

  it("verifies persisted menu using a second inventory request", async () => {
    await expect(
      createBackendMenuV2(params()),
    ).resolves.toBe(20001);

    expect(getAllMenus).toHaveBeenCalledTimes(2);
    expect(createMenu).toHaveBeenCalledTimes(1);
  });

  it("creates a nested submenu under Software", async () => {
    await expect(
      createBackendMenuV2(
        params({
          parentId: 10021,
          caption: "Documentation",
        }),
      ),
    ).resolves.toBe(20001);

    expect(createMenu).toHaveBeenCalledWith({
      allowedRoles: [],
      content: {
        menuId: 0,
        parentId: 10021,
        isHeadMenu: false,
        position: 1,
        caption: "Documentation",
      },
    });
  });

  it("blocks creation when sibling positions are duplicated", async () => {
    getAllMenus.mockResolvedValueOnce({
      data: {
        menuList: menus.map(item =>
          item.menuId === 10022
            ? { ...item, position: 1 }
            : item,
        ),
      },
    });

    await expect(
      createBackendMenuV2(
        params({ parentId: 10002 }),
      ),
    ).rejects.toThrow("Invalid existing menu positions");

    expect(createMenu).not.toHaveBeenCalled();
  });

  it("blocks creation when sibling positions contain gaps", async () => {
    getAllMenus.mockResolvedValueOnce({
      data: {
        menuList: menus.map(item =>
          item.menuId === 10022
            ? { ...item, position: 3 }
            : item,
        ),
      },
    });

    await expect(
      createBackendMenuV2(
        params({ parentId: 10002 }),
      ),
    ).rejects.toThrow("Invalid existing menu positions");

    expect(createMenu).not.toHaveBeenCalled();
  });

  it("rejects a returned ID that already exists", async () => {
    createMenu.mockResolvedValueOnce({
      data: { menuId: 10001 },
    });

    await expect(
      createBackendMenuV2(params()),
    ).rejects.toThrow("existing menu ID");

    expect(createMenu).toHaveBeenCalledTimes(1);
  });

  it("rejects creation that was not persisted", async () => {
    createMenu.mockResolvedValueOnce({
      data: { menuId: 20001 },
    });

    await expect(
      createBackendMenuV2(params()),
    ).rejects.toThrow("Created menu could not be verified");

    expect(createMenu).toHaveBeenCalledTimes(1);
    expect(getAllMenus).toHaveBeenCalledTimes(2);
  });

  it("rejects creation under an incorrect parent", async () => {
    createMenu.mockImplementationOnce(async () => {
      getAllMenus.mockResolvedValueOnce({
        data: {
          menuList: [
            ...menus,
            {
              menuId: 20001,
              parentId: 10021,
              isHeadMenu: false,
              position: 1,
              caption: "Documentation",
            },
          ],
        },
      });

      return {
        data: { menuId: 20001 },
      };
    });

    await expect(
      createBackendMenuV2(
        params({
          parentId: 10002,
          caption: "Documentation",
        }),
      ),
    ).rejects.toThrow(
      "Parent ID: expected 10002, actual 10021",
    );

    expect(createMenu).toHaveBeenCalledTimes(1);
  });

  it("rejects captions longer than 120 characters", async () => {
    await expect(
      createBackendMenuV2(
        params({ caption: "a".repeat(121) }),
      ),
    ).rejects.toThrow("Backend menu caption is too long");

    expect(createMenu).not.toHaveBeenCalled();
  });

  it("rejects a session change during creation verification", async () => {
    createMenu.mockImplementationOnce(async () => {
      getAllMenus.mockImplementationOnce(async () => {
        context.authGeneration += 1;

        return {
          data: { menuList: menus },
        };
      });

      return {
        data: { menuId: 20001 },
      };
    });

    await expect(
      createBackendMenuV2(params()),
    ).rejects.toThrow(
      "Menu creation verification returned for a stale session",
    );

    expect(createMenu).toHaveBeenCalledTimes(1);
  });

  it("rejects an empty caption", async () => {
    await expect(
      createBackendMenuV2(
        params({
          caption: "   ",
        }),
      ),
    ).rejects.toThrow("Backend menu caption is required");

    expect(createMenu).not.toHaveBeenCalled();
  });

  it("rejects an invalid parent ID", async () => {
    await expect(
      createBackendMenuV2(
        params({
          parentId: -5,
        }),
      ),
    ).rejects.toThrow("Invalid parent menu ID");

    expect(createMenu).not.toHaveBeenCalled();
  });

  it("rejects an unknown parent", async () => {
    await expect(
      createBackendMenuV2(
        params({
          parentId: 99999,
        }),
      ),
    ).rejects.toThrow("Parent menu not found");

    expect(createMenu).not.toHaveBeenCalled();
  });

  it("rejects missing edit permission", async () => {
    context.canEdit = false;

    await expect(
      createBackendMenuV2(params()),
    ).rejects.toThrow("Backend menu creation is not authorized");

    expect(getAllMenus).not.toHaveBeenCalled();
    expect(createMenu).not.toHaveBeenCalled();
  });

  it("rejects a session change while loading", async () => {
    getAllMenus.mockImplementationOnce(async () => {
      context.authGeneration += 1;

      return {
        data: {
          menuList: menus,
        },
      };
    });

    await expect(
      createBackendMenuV2(params()),
    ).rejects.toThrow(
      "Backend menu inventory belongs to a stale session",
    );

    expect(createMenu).not.toHaveBeenCalled();
  });

  it("rejects an invalid returned menu ID", async () => {
    createMenu.mockResolvedValueOnce({
      data: {
        menuId: 0,
      },
    });

    await expect(
      createBackendMenuV2(params()),
    ).rejects.toThrow(
      "Backend did not return a valid menu ID",
    );
  });

  it("rejects duplicate menu IDs in the inventory", async () => {
    getAllMenus.mockResolvedValueOnce({
      data: {
        menuList: [...menus, menus[0]],
      },
    });

    await expect(
      createBackendMenuV2(params()),
    ).rejects.toThrow("Invalid backend menu inventory");

    expect(createMenu).not.toHaveBeenCalled();
  });
});


describe("Create with complete editor inventory", () => {
  function setupInventory() {
    const existing = [
      {
        menuId: 10001,
        isHeadMenu: true,
        position: 1,
        caption: "Visible root",
        pathId: "10001",
        pathCaption: "Visible root",
        pathPosition: "01",
      },
      {
        menuId: 10002,
        isHeadMenu: true,
        position: 2,
        caption: "Restricted root",
        pathId: "10002",
        pathCaption: "Restricted root",
        pathPosition: "02",
      },
    ];

    const getMenus = jest.fn().mockResolvedValue({
      data: { menuList: [existing[0]] },
    });

    const getAllMenus = jest.fn().mockResolvedValue({
      data: { menuList: existing },
    });

    const createMenu = jest.fn().mockResolvedValue({
      data: { menuId: 20001 },
    });

    const client = {
      getMenus,
      getAllMenus,
      createMenu,
    };

    const context: BackendMenuCreateContext = {
      client,
      server: "https://example.invalid",
      authGeneration: 1,
      isLoggedIn: true,
      canEdit: true,
      isSwitchingServer: false,
      isLoggingOut: false,
    };

    const create = () => createBackendMenuV2({
      caption: "New root",
      parentId: null,
      language: "de",
      allowedRoles: ["Vermieter"],
      getContext: () => context,
    });

    return {
      existing,
      getMenus,
      getAllMenus,
      createMenu,
      create,
    };
  }

  it("includes hidden siblings when calculating the position", async () => {
    const env = setupInventory();

    env.getAllMenus.mockResolvedValueOnce({
      data: { menuList: env.existing },
    });

    env.getAllMenus.mockResolvedValueOnce({
      data: {
        menuList: [
          ...env.existing,
          {
            menuId: 20001,
            isHeadMenu: true,
            position: 3,
            caption: "New root",
          },
        ],
      },
    });

    await expect(env.create()).resolves.toBe(20001);

    expect(env.createMenu).toHaveBeenCalledTimes(1);

    expect(env.createMenu).toHaveBeenCalledWith(
      expect.objectContaining({
        allowedRoles: ["Vermieter"],
        content: expect.objectContaining({
          position: 3,
          isHeadMenu: true,
          caption: "New root",
        }),
      }),
    );

    expect(env.getAllMenus).toHaveBeenCalledTimes(2);
    expect(env.getAllMenus).toHaveBeenNthCalledWith(1, "de");
    expect(env.getAllMenus).toHaveBeenNthCalledWith(2, "de");
    expect(env.getMenus).not.toHaveBeenCalled();
  });

  it("blocks creation when the full inventory is unavailable", async () => {
    const env = setupInventory();

    env.getAllMenus.mockRejectedValueOnce(
      new Error("HTTP 503"),
    );

    await expect(env.create()).rejects.toThrow("HTTP 503");

    expect(env.createMenu).not.toHaveBeenCalled();
    expect(env.getMenus).not.toHaveBeenCalled();
  });

  it("does not retry creation after verification failure", async () => {
    const env = setupInventory();

    env.getAllMenus.mockResolvedValueOnce({
      data: { menuList: env.existing },
    });

    env.getAllMenus.mockRejectedValueOnce(
      new Error("Verification unavailable"),
    );

    await expect(env.create()).rejects.toThrow(
      "Verification unavailable",
    );

    expect(env.createMenu).toHaveBeenCalledTimes(1);
    expect(env.getAllMenus).toHaveBeenCalledTimes(2);
    expect(env.getMenus).not.toHaveBeenCalled();
  });

  it("blocks creation when hidden siblings have duplicate positions", async () => {
    const env = setupInventory();

    env.getAllMenus.mockResolvedValueOnce({
      data: {
        menuList: [
          env.existing[0],
          {
            ...env.existing[1],
            position: 1,
          },
        ],
      },
    });

    await expect(env.create()).rejects.toThrow(
      "Invalid existing menu positions",
    );

    expect(env.createMenu).not.toHaveBeenCalled();
    expect(env.getMenus).not.toHaveBeenCalled();
  });
});
