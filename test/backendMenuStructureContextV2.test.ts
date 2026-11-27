import type {
  MenuItem,
} from "../src/api/implementation/Dynamic-Content-Api-V2";

import {
  verifyBackendMenuStructureV2,
} from "../src/template/editor/adapters/backendMenuStructureContextV2";

import {
  moveBackendMenuV2,
} from "../src/template/editor/adapters/moveBackendMenuV2";

import {
  reorderBackendMenuV2,
} from "../src/template/editor/adapters/reorderBackendMenuV2";

function fixture(): MenuItem[] {
  return [
    {
      menuId: 1,
      isHeadMenu: true,
      position: 1,
      caption: "Products",
    },
    {
      menuId: 2,
      parentId: 1,
      isHeadMenu: false,
      position: 1,
      caption: "Software",
    },
    {
      menuId: 3,
      parentId: 1,
      isHeadMenu: false,
      position: 2,
      caption: "Dashboard",
    },
    {
      menuId: 4,
      parentId: 1,
      isHeadMenu: false,
      position: 3,
      caption: "Hardware",
    },
    {
      menuId: 5,
      parentId: 2,
      isHeadMenu: false,
      position: 1,
      caption: "Restricted documentation",
    },
  ];
}

function moved(): MenuItem[] {
  return fixture().map(item => {
    if (item.menuId === 3) {
      return { ...item, parentId: 2, position: 2 };
    }

    if (item.menuId === 4) {
      return { ...item, position: 2 };
    }

    return item;
  });
}

function setup() {
  const getMenus = jest.fn();

  const getAllMenus = jest.fn().mockResolvedValue({
    data: { menuList: fixture() },
  });

  const updateMenu = jest.fn().mockResolvedValue({
    data: {},
  });

  const context = {
    client: { getMenus, getAllMenus, updateMenu },
    server: "https://example.invalid",
    authGeneration: 1,
    isLoggedIn: true,
    canEdit: true,
    isSwitchingServer: false,
    isLoggingOut: false,
  };

  const move = () => moveBackendMenuV2({
    menuId: 3,
    targetParentId: 2,
    expectedParentId: 1,
    allowedParentIds: [2],
    language: "de",
    getContext: () => context,
  });

  const reorder = () => reorderBackendMenuV2({
    menuId: 4,
    targetPosition: 1,
    expectedParentId: 1,
    expectedSiblingIds: [2, 3, 4],
    language: "de",
    getContext: () => context,
  });

  return {
    getMenus,
    getAllMenus,
    updateMenu,
    move,
    reorder,
  };
}

describe("Backend structural menu verification V2", () => {
  it("accepts the complete planned sibling structure", () => {
    expect(() =>
      verifyBackendMenuStructureV2(
        moved(),
        moved(),
        [1, 2],
      ),
    ).not.toThrow();
  });

  it("rejects a gap in the original sibling group", () => {
    const actual = moved().map(item =>
      item.menuId === 4
        ? { ...item, position: 3 }
        : item,
    );

    expect(() =>
      verifyBackendMenuStructureV2(
        moved(),
        actual,
        [1, 2],
      ),
    ).toThrow();
  });

  it("rejects a missing target sibling", () => {
    expect(() =>
      verifyBackendMenuStructureV2(
        moved(),
        moved().filter(item => item.menuId !== 5),
        [1, 2],
      ),
    ).toThrow();
  });

  it("rejects swapped siblings even with contiguous positions", () => {
    const actual = moved().map(item => {
      if (item.menuId === 2) {
        return { ...item, position: 2 };
      }

      if (item.menuId === 4) {
        return { ...item, position: 1 };
      }

      return item;
    });

    expect(() =>
      verifyBackendMenuStructureV2(
        moved(),
        actual,
        [1, 2],
      ),
    ).toThrow("Saved sibling structure");
  });

  it("rejects a broken saved hierarchy", () => {
    const actual = moved().map(item =>
      item.menuId === 5
        ? { ...item, parentId: 999 }
        : item,
    );

    expect(() =>
      verifyBackendMenuStructureV2(
        moved(),
        actual,
        [1, 2],
      ),
    ).toThrow();
  });

  it("moves using the full inventory without filtered fallback", async () => {
    const env = setup();

    env.getAllMenus
      .mockResolvedValueOnce({
        data: { menuList: fixture() },
      })
      .mockResolvedValueOnce({
        data: { menuList: moved() },
      });

    await env.move();

    expect(env.getAllMenus).toHaveBeenCalledTimes(2);
    expect(env.getMenus).not.toHaveBeenCalled();
    expect(env.updateMenu).toHaveBeenCalledTimes(1);

    expect(env.updateMenu).toHaveBeenCalledWith(
      3,
      expect.objectContaining({
        parentId: 2,
        position: 2,
      }),
    );
  });

  it("blocks moves when the full inventory fails", async () => {
    const env = setup();

    env.getAllMenus.mockRejectedValueOnce(
      new Error("HTTP 503"),
    );

    await expect(env.move()).rejects.toThrow("HTTP 503");

    expect(env.getMenus).not.toHaveBeenCalled();
    expect(env.updateMenu).not.toHaveBeenCalled();
  });

  it("rejects a saved move with incorrect sibling positions", async () => {
    const env = setup();

    env.getAllMenus
      .mockResolvedValueOnce({
        data: { menuList: fixture() },
      })
      .mockResolvedValueOnce({
        data: {
          menuList: moved().map(item =>
            item.menuId === 4
              ? { ...item, position: 3 }
              : item,
          ),
        },
      });

    await expect(env.move()).rejects.toThrow(
      "Saved menu move could not be verified",
    );

    expect(env.updateMenu).toHaveBeenCalledTimes(1);
  });

  it("blocks reordering when the full inventory fails", async () => {
    const env = setup();

    env.getAllMenus.mockRejectedValueOnce(
      new Error("HTTP 503"),
    );

    await expect(env.reorder()).rejects.toThrow("HTTP 503");

    expect(env.getMenus).not.toHaveBeenCalled();
    expect(env.updateMenu).not.toHaveBeenCalled();
  });

  it("rejects reordering with an invalid saved hierarchy", async () => {
    const env = setup();

    const actual = fixture().map(item => {
      if (item.menuId === 2) {
        return { ...item, position: 2 };
      }

      if (item.menuId === 3) {
        return { ...item, position: 3 };
      }

      if (item.menuId === 4) {
        return { ...item, position: 1 };
      }

      if (item.menuId === 5) {
        return { ...item, parentId: 999 };
      }

      return item;
    });

    env.getAllMenus
      .mockResolvedValueOnce({
        data: { menuList: fixture() },
      })
      .mockResolvedValueOnce({
        data: { menuList: actual },
      });

    await expect(env.reorder()).rejects.toThrow(
      "Saved menu order could not be verified",
    );

    expect(env.updateMenu).toHaveBeenCalledTimes(1);
    expect(env.getMenus).not.toHaveBeenCalled();
  });
});
