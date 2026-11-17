import {
  filterValidDynamicMenuHierarchy,
} from "@/template/state/navigation/adapters/filterValidDynamicMenuHierarchy";

import type {
  MenuItem,
} from "@/template/state/navigation/menuSlice";

function dynamicItem(
  menuID: number,
  parentID?: number,
): MenuItem {
  return {
    menuID,
    parentID,
    position: 1,
    caption: `Menu ${menuID}`,
    Screen: undefined,
  };
}

function staticItem(
  menuID: number,
): MenuItem {
  return {
    menuID,
    position: 1,
    caption: `Static ${menuID}`,
    Screen: () => null,
  };
}

describe("filterValidDynamicMenuHierarchy", () => {
  it("allows dynamic root menus", () => {
    const items = [dynamicItem(100)];

    expect(
      filterValidDynamicMenuHierarchy(items, []),
    ).toEqual(items);
  });

  it("allows valid dynamic parent chains", () => {
    const items = [
      dynamicItem(100),
      dynamicItem(101, 100),
      dynamicItem(102, 101),
    ];

    expect(
      filterValidDynamicMenuHierarchy(items, []),
    ).toEqual(items);
  });

  it("allows dynamic children of static menus", () => {
    const items = [dynamicItem(101, 3003)];
    const staticMenus = [staticItem(3003)];

    expect(
      filterValidDynamicMenuHierarchy(items, staticMenus),
    ).toEqual(items);
  });

  it("rejects missing parents and their descendants", () => {
    const items = [
      dynamicItem(100, 999),
      dynamicItem(101, 100),
      dynamicItem(102),
    ];

    expect(
      filterValidDynamicMenuHierarchy(items, []),
    ).toEqual([dynamicItem(102)]);
  });

  it("rejects cyclic relationships and descendants", () => {
    const items = [
      dynamicItem(100, 101),
      dynamicItem(101, 100),
      dynamicItem(102, 100),
      dynamicItem(103),
    ];

    expect(
      filterValidDynamicMenuHierarchy(items, []),
    ).toEqual([dynamicItem(103)]);
  });

  it("prevents dynamic entries from overriding static IDs", () => {
    const items = [
      dynamicItem(3003),
      dynamicItem(101, 3003),
    ];

    const staticMenus = [staticItem(3003)];

    expect(
      filterValidDynamicMenuHierarchy(items, staticMenus),
    ).toEqual([dynamicItem(101, 3003)]);
  });
});
