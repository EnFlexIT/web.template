import type {
  MenuItem,
} from "@/api/implementation/Dynamic-Content-Api-V2";

import type {
  BackendMenuStructureContextV2,
} from "../src/template/editor/adapters/backendMenuStructureContextV2";

import {
  reorderBackendMenuV2,
} from "../src/template/editor/adapters/reorderBackendMenuV2";

function setup() {
  const items: MenuItem[] = [
    {
      menuId: 1,
      caption: "Parent",
      isHeadMenu: true,
      position: 1,
    },
    ...[10, 11, 12].map((menuId, index) => ({
      menuId,
      caption: `Menu ${menuId}`,
      parentId: 1,
      isHeadMenu: false,
      position: index + 1,
    })),
  ];

  const getAllMenus = jest.fn().mockResolvedValue({
    data: { menuList: items },
  });

  const updateMenu = jest.fn().mockResolvedValue({});

  const context = {
    client: { getAllMenus, updateMenu },
    isLoggedIn: true,
    canEdit: true,
    isSwitchingServer: false,
    isLoggingOut: false,
    server: "test-server",
    authGeneration: 1,
  } as unknown as BackendMenuStructureContextV2;

  const params = {
    menuId: 12,
    targetPosition: 1,
    expectedParentId: 1,
    expectedSiblingIds: [10, 11, 12],
    language: "en",
    getContext: () => context,
  };

  return { items, getAllMenus, updateMenu, context, params };
}

describe("reorderBackendMenuV2", () => {
  it("uses one update and verifies the saved order", async () => {
    const s = setup();

    s.getAllMenus.mockResolvedValueOnce({
      data: { menuList: s.items },
    }).mockResolvedValueOnce({
      data: {
        menuList: s.items.map(item => ({
          ...item,
          position:
            item.menuId === 12 ? 1 :
            item.menuId === 10 ? 2 :
            item.menuId === 11 ? 3 :
            item.position,
        })),
      },
    });

    await expect(reorderBackendMenuV2(s.params))
      .resolves.toBe(true);

    expect(s.updateMenu).toHaveBeenCalledTimes(1);

    expect(s.updateMenu).toHaveBeenCalledWith(
      12,
      expect.objectContaining({
        parentId: 1,
        position: 1,
        isHeadMenu: false,
      }),
    );

    expect(s.getAllMenus).toHaveBeenCalledTimes(2);
  });

  it("does not write unchanged positions", async () => {
    const s = setup();

    await expect(reorderBackendMenuV2({
      ...s.params,
      targetPosition: 3,
    })).resolves.toBe(false);

    expect(s.updateMenu).not.toHaveBeenCalled();
  });

  it("rejects missing permission", async () => {
    const s = setup();

    await expect(reorderBackendMenuV2({
      ...s.params,
      getContext: () => ({
        ...s.context,
        canEdit: false,
      }),
    })).rejects.toThrow();

    expect(s.updateMenu).not.toHaveBeenCalled();
  });

  it("rejects changed parents", async () => {
    const s = setup();

    await expect(reorderBackendMenuV2({
      ...s.params,
      expectedParentId: null,
    })).rejects.toThrow();

    expect(s.updateMenu).not.toHaveBeenCalled();
  });

  it("rejects stale sibling order", async () => {
    const s = setup();

    await expect(reorderBackendMenuV2({
      ...s.params,
      expectedSiblingIds: [11, 10, 12],
    })).rejects.toThrow();

    expect(s.updateMenu).not.toHaveBeenCalled();
  });

  it("rejects session changes during loading", async () => {
    const s = setup();

    let generation = 1;

    s.getAllMenus.mockImplementation(async () => {
      generation = 2;
      return { data: { menuList: s.items } };
    });

    await expect(reorderBackendMenuV2({
      ...s.params,
      getContext: () => ({
        ...s.context,
        authGeneration: generation,
      }),
    })).rejects.toThrow();

    expect(s.updateMenu).not.toHaveBeenCalled();
  });

  it("propagates API update failures", async () => {
    const s = setup();

    s.updateMenu.mockRejectedValue(
      new Error("API failed"),
    );

    await expect(reorderBackendMenuV2(s.params))
      .rejects.toThrow("API failed");
  });

  it("rejects an unverified saved order", async () => {
    const s = setup();

    await expect(reorderBackendMenuV2(s.params))
      .rejects.toThrow("could not be verified");

    expect(s.updateMenu).toHaveBeenCalledTimes(1);
  });
});
