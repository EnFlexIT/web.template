import {
  buildBackendMenuTreeV2,
} from "../src/template/editor/adapters/buildBackendMenuTreeV2";

import type {
  MenuItem,
} from "../src/api/implementation/Dynamic-Content-Api-V2";

function menu(
  menuId: number,
  position: number,
  parentId?: number,
): MenuItem {
  return {
    menuId,
    position,
    parentId,
    caption: `Menu ${menuId}`,
    isHeadMenu: parentId === undefined,
  };
}

describe("buildBackendMenuTreeV2", () => {
  it("builds root menus", () => {
    const result = buildBackendMenuTreeV2([
      menu(10, 1),
      menu(20, 2),
    ]);

    expect(result.map(node => node.menuId)).toEqual([
      10,
      20,
    ]);

    expect(result[0].children).toEqual([]);
  });

  it("builds nested submenus", () => {
    const result = buildBackendMenuTreeV2([
      menu(10, 1),
      menu(20, 1, 10),
      menu(30, 1, 20),
    ]);

    expect(
      result[0].children[0].children[0].menuId,
    ).toBe(30);
  });

  it("sorts siblings by position and menuId", () => {
    const result = buildBackendMenuTreeV2([
      menu(30, 2),
      menu(20, 1),
      menu(10, 1),
      menu(50, 2, 20),
      menu(40, 1, 20),
    ]);

    expect(result.map(node => node.menuId)).toEqual([
      10,
      20,
      30,
    ]);

    expect(
      result[1].children.map(node => node.menuId),
    ).toEqual([40, 50]);
  });

  it("rejects missing parents", () => {
    expect(() =>
      buildBackendMenuTreeV2([
        menu(20, 1, 999),
      ]),
    ).toThrow(/Missing backend menu parent/);
  });

  it("rejects circular relationships", () => {
    expect(() =>
      buildBackendMenuTreeV2([
        menu(10, 1, 20),
        menu(20, 1, 10),
      ]),
    ).toThrow(/Circular backend menu hierarchy/);
  });

  it("rejects duplicate IDs", () => {
    expect(() =>
      buildBackendMenuTreeV2([
        menu(10, 1),
        menu(10, 2),
      ]),
    ).toThrow(/Invalid backend menu inventory/);
  });

  it("rejects self-parent relationships", () => {
    expect(() =>
      buildBackendMenuTreeV2([
        menu(10, 1, 10),
      ]),
    ).toThrow(/Invalid backend menu parent/);
  });

  it("preserves metadata without mutating input", () => {
    const original: MenuItem[] = [
      {
        ...menu(10, 1),
        pathId: "10",
        pathCaption: "Home",
        pathPosition: "1",
      },
    ];

    const snapshot = JSON.stringify(original);
    const result = buildBackendMenuTreeV2(original);

    expect(JSON.stringify(original)).toBe(snapshot);
    expect(result[0]).toMatchObject({
      menuId: 10,
      pathId: "10",
      pathCaption: "Home",
      pathPosition: "1",
    });
    expect(result[0]).not.toBe(original[0]);
  });

  it("returns an empty tree for an empty inventory", () => {
    expect(buildBackendMenuTreeV2([])).toEqual([]);
  });
});
