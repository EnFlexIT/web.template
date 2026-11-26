import type {
  MenuItem,
} from "../src/api/implementation/Dynamic-Content-Api-V2";

import {
  createBackendMenuV2,
  type BackendMenuCreateContext,
} from "../src/template/editor/adapters/createBackendMenuV2";

function menu(
  menuId: number,
  parentId: number | null = null,
): MenuItem {
  return {
    menuId,
    ...(parentId === null ? {} : { parentId }),
    isHeadMenu: parentId === null,
    position: 1,
    caption: `Menu ${menuId}`,
  };
}

function setup(items: MenuItem[]) {
  const getMenus = jest.fn().mockResolvedValue({
    data: { menuList: items },
  });

  const createMenu = jest.fn().mockResolvedValue({
    data: { menuId: 99 },
  });

  const context: BackendMenuCreateContext = {
    client: { getMenus, createMenu },
    server: "https://example.invalid",
    authGeneration: 1,
    isLoggedIn: true,
    canEdit: true,
    isSwitchingServer: false,
    isLoggingOut: false,
  };

  const create = (parentId: number) =>
    createBackendMenuV2({
      caption: "New menu",
      parentId,
      language: "en",
      allowedRoles: ["Vermieter"],
      getContext: () => context,
    });

  return { getMenus, createMenu, create };
}

describe("createBackendMenuDepthV2", () => {
  it("blocks level five before POST", async () => {
    const { create, createMenu } = setup([
      menu(1),
      menu(2, 1),
      menu(3, 2),
      menu(4, 3),
    ]);

    await expect(create(4))
      .rejects.toThrow("create.maxDepthReached");

    expect(createMenu).not.toHaveBeenCalled();
  });

  it.each([1, 3])(
    "allows creation under an empty level %s menu",
    async depth => {
      const items = Array.from(
        { length: depth },
        (_, index) => menu(
          index + 1,
          index === 0 ? null : index,
        ),
      );

      const { create, createMenu, getMenus } =
        setup(items);

      getMenus.mockResolvedValueOnce({
        data: { menuList: items },
      });

      getMenus.mockResolvedValueOnce({
        data: {
          menuList: [
            ...items,
            {
              ...menu(99, depth),
              caption: "New menu",
            },
          ],
        },
      });

      await expect(create(depth)).resolves.toBe(99);

      expect(createMenu).toHaveBeenCalledTimes(1);

      expect(createMenu).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            parentId: depth,
            position: 1,
            isHeadMenu: false,
          }),
        }),
      );
    },
  );
});
