import type {
  MenuItem,
} from "../src/api/implementation/Dynamic-Content-Api-V2";

import {
  planBackendMenuMoveV2,
} from "../src/template/editor/adapters/planBackendMenuMoveV2";

import {
  planBackendMenuReorderV2,
} from "../src/template/editor/adapters/planBackendMenuReorderV2";

import {
  validateBackendMenuPositionsV2,
} from "../src/template/editor/adapters/backendMenuPositionValidatorV2";

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
      caption: "Documentation",
    },
  ];
}

function move(items: MenuItem[]) {
  return planBackendMenuMoveV2({
    items,
    menuId: 3,
    targetParentId: 2,
    allowedParentIds: [2],
  });
}

describe("Backend menu position planning V2", () => {
  it("closes the source sibling gap after moving", () => {
    const result = move(fixture());

    expect(
      result.updatedInventory.find(
        item => item.menuId === 4,
      )?.position,
    ).toBe(2);

    expect(result.updatedMenu.parentId).toBe(2);
    expect(result.updatedMenu.position).toBe(2);

    expect(() =>
      validateBackendMenuPositionsV2(
        result.updatedInventory,
      ),
    ).not.toThrow();
  });

  it("does not mutate the original inventory", () => {
    const items = fixture();
    const original = items.map(item => ({ ...item }));

    move(items);

    expect(items).toEqual(original);
  });

  it("rejects duplicate source sibling positions", () => {
    const items = fixture();

    items.find(item => item.menuId === 4)!.position = 2;

    expect(() => move(items)).toThrow(
      "Invalid existing menu positions",
    );
  });

  it("rejects gaps in target sibling positions", () => {
    const items = fixture();

    items.find(item => item.menuId === 5)!.position = 2;

    expect(() => move(items)).toThrow(
      "Invalid existing menu positions",
    );
  });

  it("produces contiguous positions after reordering", () => {
    const result = planBackendMenuReorderV2({
      items: fixture(),
      menuId: 4,
      targetPosition: 1,
    });

    expect(result.changed).toBe(true);

    const siblings = result.updatedInventory
      .filter(item => item.parentId === 1)
      .sort((a, b) => a.position - b.position);

    expect(
      siblings.map(item => item.menuId),
    ).toEqual([4, 2, 3]);

    expect(
      siblings.map(item => item.position),
    ).toEqual([1, 2, 3]);

    expect(() =>
      validateBackendMenuPositionsV2(
        result.updatedInventory,
      ),
    ).not.toThrow();
  });

  it("rejects duplicate positions before reordering", () => {
    const items = fixture();

    items.find(item => item.menuId === 4)!.position = 2;

    expect(() =>
      planBackendMenuReorderV2({
        items,
        menuId: 4,
        targetPosition: 1,
      }),
    ).toThrow("Invalid existing menu positions");
  });
});
