import type {
  MenuItem,
} from "@/api/implementation/Dynamic-Content-Api-V2";

import {
  planBackendMenuReorderV2,
} from "../src/template/editor/adapters/planBackendMenuReorderV2";

function menu(
  menuId: number,
  position: number,
  parentId?: number,
): MenuItem {
  return {
    menuId,
    position,
    parentId,
    isHeadMenu: parentId === undefined,
    caption: `Menu ${menuId}`,
  };
}

function inventory(): MenuItem[] {
  return [
    menu(1, 1),
    menu(2, 2),
    menu(10, 1, 1),
    menu(11, 2, 1),
    menu(12, 3, 1),
    menu(20, 1, 10),
  ];
}

function order(
  items: MenuItem[],
  parentId?: number,
): number[] {
  return items
    .filter(item => item.parentId === parentId)
    .sort((a, b) => a.position - b.position)
    .map(item => item.menuId);
}

describe("planBackendMenuReorderV2", () => {
  it("moves a menu to the first position", () => {
    const plan = planBackendMenuReorderV2({
      items: inventory(),
      menuId: 12,
      targetPosition: 1,
    });

    expect(plan.changed).toBe(true);
    expect(plan.updatedMenu.position).toBe(1);
    expect(order(plan.updatedInventory, 1))
      .toEqual([12, 10, 11]);
  });

  it("moves a menu to the last position", () => {
    const plan = planBackendMenuReorderV2({
      items: inventory(),
      menuId: 10,
      targetPosition: 3,
    });

    expect(order(plan.updatedInventory, 1))
      .toEqual([11, 12, 10]);
  });

  it("reorders root menus", () => {
    const plan = planBackendMenuReorderV2({
      items: inventory(),
      menuId: 2,
      targetPosition: 1,
    });

    expect(order(plan.updatedInventory))
      .toEqual([2, 1]);

    expect(plan.updatedMenu.parentId)
      .toBeUndefined();

    expect(plan.updatedMenu.isHeadMenu).toBe(true);
  });

  it("preserves child relationships", () => {
    const plan = planBackendMenuReorderV2({
      items: inventory(),
      menuId: 10,
      targetPosition: 3,
    });

    const child = plan.updatedInventory.find(
      item => item.menuId === 20,
    );

    expect(child?.parentId).toBe(10);
    expect(child?.position).toBe(1);
  });

  it("detects an unchanged position", () => {
    const plan = planBackendMenuReorderV2({
      items: inventory(),
      menuId: 11,
      targetPosition: 2,
    });

    expect(plan.changed).toBe(false);
  });

  it("does not mutate the original inventory", () => {
    const items = inventory();
    const before = JSON.stringify(items);

    planBackendMenuReorderV2({
      items,
      menuId: 12,
      targetPosition: 1,
    });

    expect(JSON.stringify(items)).toBe(before);
  });

  it.each([0, -1, 1.5, 4, NaN])(
    "rejects invalid position %s",
    targetPosition => {
      expect(() => planBackendMenuReorderV2({
        items: inventory(),
        menuId: 10,
        targetPosition,
      })).toThrow();
    },
  );

  it("rejects unknown menu IDs", () => {
    expect(() => planBackendMenuReorderV2({
      items: inventory(),
      menuId: 999,
      targetPosition: 1,
    })).toThrow();
  });

  it("rejects ambiguous sibling positions", () => {
    const items = inventory();

    items.find(item => item.menuId === 11)!
      .position = 1;

    expect(() => planBackendMenuReorderV2({
      items,
      menuId: 12,
      targetPosition: 1,
    })).toThrow();
  });
});
