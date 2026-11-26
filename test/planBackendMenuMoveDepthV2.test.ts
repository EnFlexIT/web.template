import type {
  MenuItem,
} from "../src/api/implementation/Dynamic-Content-Api-V2";

import {
  planBackendMenuMoveV2,
} from "../src/template/editor/adapters/planBackendMenuMoveV2";

function menu(
  menuId: number,
  parentId: number | null = null,
  position = 1,
): MenuItem {
  return {
    menuId,
    ...(parentId === null ? {} : { parentId }),
    isHeadMenu: parentId === null,
    position,
    caption: `Menu ${menuId}`,
  };
}

const items = [
  menu(1),
  menu(2, 1),
  menu(3, 2),
  menu(4, 3),
  menu(5, 1, 2),
  menu(6, null, 2),
  menu(7, 6),
  menu(8, 7),
];

function move(menuId: number, targetParentId: number) {
  return planBackendMenuMoveV2({
    items,
    menuId,
    targetParentId,
    allowedParentIds: items.map(item => item.menuId),
  });
}

describe("planBackendMenuMoveDepthV2", () => {
  it("allows an empty menu as target", () => {
    const result = move(4, 5);

    expect(result.updatedMenu.parentId).toBe(5);
    expect(result.updatedMenu.position).toBe(1);
  });

  it("allows moves ending exactly at level four", () => {
    expect(move(5, 8).updatedMenu.parentId).toBe(8);
  });

  it("rejects a move resulting in level five", () => {
    expect(() => move(5, 4))
      .toThrow("menuErrors.movePolicyDenied");
  });

  it("checks the complete source subtree", () => {
    expect(() => move(2, 7))
      .toThrow("menuErrors.movePolicyDenied");
  });

  it("allows a subtree fitting within four levels", () => {
    expect(move(2, 6).updatedMenu.parentId).toBe(6);
  });

  it("rejects a move into a descendant", () => {
    expect(() => move(2, 3)).toThrow();
  });

  it("rejects moving a menu into itself", () => {
    expect(() => move(5, 5)).toThrow();
  });

  it("rejects moving a main menu", () => {
    expect(() => move(1, 6))
      .toThrow("menuErrors.movePolicyDenied");
  });

  it("preserves explicit target restrictions", () => {
    expect(() =>
      planBackendMenuMoveV2({
        items,
        menuId: 4,
        targetParentId: 5,
        allowedParentIds: [6],
      }),
    ).toThrow();
  });

  it("does not mutate the original inventory", () => {
    const before = JSON.stringify(items);

    move(4, 5);

    expect(JSON.stringify(items)).toBe(before);
  });
});
