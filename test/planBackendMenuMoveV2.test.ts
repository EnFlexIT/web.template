import {
  planBackendMenuMoveV2,
} from "../src/template/editor/adapters/planBackendMenuMoveV2";

const menus = [
  {
    menuId: 1,
    isHeadMenu: true,
    position: 1,
    caption: "Produkte",
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
    caption: "Hardware",
  },
  {
    menuId: 4,
    parentId: 2,
    isHeadMenu: false,
    position: 1,
    caption: "DynSiteAPI Docs",
    pathId: "1/2/4",
  },
  {
    menuId: 5,
    parentId: 3,
    isHeadMenu: false,
    position: 1,
    caption: "Hardware Infos",
  },
];

describe("planBackendMenuMoveV2", () => {
  it("moves a menu to an allowed parent", () => {
    const result = planBackendMenuMoveV2({
      items: menus,
      menuId: 4,
      targetParentId: 3,
      allowedParentIds: [1, 2, 3],
    });

    expect(result.updatedMenu).toEqual({
      ...menus[3],
      parentId: 3,
      position: 2,
    });

    expect(
      result.updatedInventory.find(item => item.menuId === 4),
    ).toEqual(result.updatedMenu);
  });

  it("preserves the original inventory", () => {
    const snapshot = JSON.stringify(menus);

    planBackendMenuMoveV2({
      items: menus,
      menuId: 4,
      targetParentId: 3,
      allowedParentIds: [1, 2, 3],
    });

    expect(JSON.stringify(menus)).toBe(snapshot);
  });

  it("rejects moving a menu into itself", () => {
    expect(() =>
      planBackendMenuMoveV2({
        items: menus,
        menuId: 2,
        targetParentId: 2,
        allowedParentIds: [2],
      }),
    ).toThrow("itself");
  });

  it("rejects moving into a descendant", () => {
    expect(() =>
      planBackendMenuMoveV2({
        items: menus,
        menuId: 1,
        targetParentId: 2,
        allowedParentIds: [2],
      }),
    ).toThrow("descendant");
  });

  it("rejects a target that is not allowed", () => {
    expect(() =>
      planBackendMenuMoveV2({
        items: menus,
        menuId: 4,
        targetParentId: 3,
        allowedParentIds: [1, 2],
      }),
    ).toThrow("not allowed");
  });

  it("rejects an unknown target", () => {
    expect(() =>
      planBackendMenuMoveV2({
        items: menus,
        menuId: 4,
        targetParentId: 999,
        allowedParentIds: [999],
      }),
    ).toThrow("not found");
  });

  it("rejects moving to the current parent", () => {
    expect(() =>
      planBackendMenuMoveV2({
        items: menus,
        menuId: 4,
        targetParentId: 2,
        allowedParentIds: [2],
      }),
    ).toThrow("already belongs");
  });
});