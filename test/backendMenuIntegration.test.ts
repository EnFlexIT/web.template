import {
  normalizeBackendMenus,
} from "@/template/state/navigation/adapters/normalizeBackendMenus";

import {
  filterValidDynamicMenuHierarchy,
} from "@/template/state/navigation/adapters/filterValidDynamicMenuHierarchy";

import type {
  MenuItem,
} from "@/template/state/navigation/menuSlice";

describe("backend menu integration", () => {
  const staticMenu: MenuItem[] = [
    {
      menuID: 3003,
      caption: "Settings",
      position: 1,
      Screen: () => null,
    },
  ];

  it("removes children of hidden dynamic parents", () => {
    const response = {
      menuList: [
        {
          menuId: 100,
          parentId: null,
          position: 1,
          caption: "Hidden Parent",
        },
        {
          menuId: 101,
          parentId: 100,
          position: 1,
          caption: "Child",
        },
        {
          menuId: 102,
          parentId: 3003,
          position: 2,
          caption: "Visible Child",
        },
      ],
    };

    const normalized = normalizeBackendMenus(response);

    // Simulates the existing application visibility filter.
    const visible = normalized.filter(
      item => item.menuID !== 100,
    );

    const result = filterValidDynamicMenuHierarchy(
      visible,
      staticMenu,
    );

    expect(result.map(item => item.menuID)).toEqual([102]);
  });

  it("does not override static menu IDs", () => {
    const response = {
      menuList: [
        {
          menuId: 3003,
          parentId: null,
          position: 1,
          caption: "Backend Replacement",
        },
        {
          menuId: 103,
          parentId: 3003,
          position: 2,
          caption: "Dynamic Child",
        },
      ],
    };

    const normalized = normalizeBackendMenus(response);

    const result = filterValidDynamicMenuHierarchy(
      normalized,
      staticMenu,
    );

    expect(result.map(item => item.menuID)).toEqual([103]);
    expect(staticMenu[0].caption).toBe("Settings");
  });

  it("rejects cyclic backend menu structures", () => {
    const normalized = normalizeBackendMenus({
      menuList: [
        {
          menuId: 200,
          parentId: 201,
          position: 1,
          caption: "A",
        },
        {
          menuId: 201,
          parentId: 200,
          position: 2,
          caption: "B",
        },
      ],
    });

    const result = filterValidDynamicMenuHierarchy(
      normalized,
      staticMenu,
    );

    expect(result).toEqual([]);
  });
});
