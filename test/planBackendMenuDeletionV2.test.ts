import {
  planBackendMenuDeletionV2,
  type BackendMenuDeletionItem,
} from "../src/template/editor/adapters/planBackendMenuDeletionV2";

describe("planBackendMenuDeletionV2", () => {
  const menus: BackendMenuDeletionItem[] = [
    { menuId: 10001, parentId: null, caption: "Home" },
    { menuId: 10002, parentId: null, caption: "Produkte" },
    { menuId: 10021, parentId: 10002, caption: "Software" },
    { menuId: 10211, parentId: 10021, caption: "DynSiteAPI Docs" },
    { menuId: 10022, parentId: 10002, caption: "Hardware" },
    { menuId: 10003, parentId: 10002, caption: "Dashboard" },
  ];

  it("plans deletion of a single menu", () => {
    const result = planBackendMenuDeletionV2(menus, 10001);

    expect(result).toEqual({
      menuId: 10001,
      caption: "Home",
      affectedMenuIds: [10001],
      descendantCount: 0,
      totalCount: 1,
    });
  });

  it("includes all direct and indirect submenus", () => {
    const result = planBackendMenuDeletionV2(menus, 10002);

    expect(result.descendantCount).toBe(4);
    expect(result.totalCount).toBe(5);

    expect(result.affectedMenuIds).toEqual([
      10211,
      10021,
      10022,
      10003,
      10002,
    ]);
  });

  it("handles multiple hierarchy levels", () => {
    const result = planBackendMenuDeletionV2(menus, 10021);

    expect(result.affectedMenuIds).toEqual([
      10211,
      10021,
    ]);

    expect(result.totalCount).toBe(2);
  });

  it("rejects an invalid menu ID", () => {
    expect(() =>
      planBackendMenuDeletionV2(menus, -1),
    ).toThrow("Invalid menu ID");
  });

  it("rejects a missing menu", () => {
    expect(() =>
      planBackendMenuDeletionV2(menus, 99999),
    ).toThrow("Menu not found");
  });

  it("rejects duplicate menu IDs", () => {
    const duplicates = [
      ...menus,
      { menuId: 10001, parentId: null, caption: "Duplicate" },
    ];

    expect(() =>
      planBackendMenuDeletionV2(duplicates, 10001),
    ).toThrow("Duplicate menu ID");
  });

  it("rejects cyclic menu structures", () => {
    const cyclic = [
      { menuId: 1, parentId: 2, caption: "A" },
      { menuId: 2, parentId: 1, caption: "B" },
    ];

    expect(() =>
      planBackendMenuDeletionV2(cyclic, 1),
    ).toThrow("Cyclic menu structure");
  });

  it("rejects an orphan outside the selected subtree", () => {
    expect(() =>
      planBackendMenuDeletionV2([
        ...menus,
        {
          menuId: 999,
          parentId: 888,
          caption: "Orphan",
        },
      ], 10001),
    ).toThrow("Missing parent menu");
  });

  it("rejects invalid parent IDs", () => {
    expect(() =>
      planBackendMenuDeletionV2([
        ...menus,
        {
          menuId: 999,
          parentId: 0,
          caption: "Invalid parent",
        },
      ], 10001),
    ).toThrow("Invalid parent menu ID");
  });

  it("rejects a cycle outside the selected subtree", () => {
    expect(() =>
      planBackendMenuDeletionV2([
        ...menus,
        { menuId: 901, parentId: 902, caption: "A" },
        { menuId: 902, parentId: 901, caption: "B" },
      ], 10001),
    ).toThrow("Cyclic menu structure");
  });

  it("rejects self-referencing menus", () => {
    expect(() =>
      planBackendMenuDeletionV2([
        ...menus,
        { menuId: 901, parentId: 901, caption: "Self" },
      ], 10001),
    ).toThrow("Cyclic menu structure");
  });

  it("rejects missing inventory", () => {
    expect(() =>
      planBackendMenuDeletionV2(
        null as unknown as BackendMenuDeletionItem[],
        10001,
      ),
    ).toThrow("Invalid menu inventory");
  });

  it("rejects malformed menu entries", () => {
    expect(() =>
      planBackendMenuDeletionV2([
        ...menus,
        null as unknown as BackendMenuDeletionItem,
      ], 10001),
    ).toThrow("Invalid menu structure");
  });

  it("rejects blank menu captions", () => {
    expect(() =>
      planBackendMenuDeletionV2([
        ...menus,
        { menuId: 999, parentId: null, caption: " " },
      ], 10001),
    ).toThrow("Invalid menu structure");
  });

  it("never includes unrelated roots in a deletion plan", () => {
    const result = planBackendMenuDeletionV2(menus, 10002);

    expect(result.affectedMenuIds).not.toContain(10001);
    expect(new Set(result.affectedMenuIds).size)
      .toBe(result.totalCount);
  });

  it("does not modify the original menu data", () => {
    const original = JSON.stringify(menus);

    planBackendMenuDeletionV2(menus, 10002);

    expect(JSON.stringify(menus)).toBe(original);
  });
});