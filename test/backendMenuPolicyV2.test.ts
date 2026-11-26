import type {
  MenuItem,
} from "../src/api/implementation/Dynamic-Content-Api-V2";

import {
  MAX_BACKEND_MENU_DEPTH,
  buildBackendMenuPolicyV2,
  canCreateBackendSubmenuV2,
  canMoveBackendMenuToParentV2,
} from "../src/template/editor/adapters/backendMenuPolicyV2";

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

describe("backendMenuPolicyV2", () => {
  it("defines four menu levels", () => {
    expect(MAX_BACKEND_MENU_DEPTH).toBe(4);
  });

  it("counts root menus as level one", () => {
    const policy = buildBackendMenuPolicyV2(items);

    expect(policy.get(1)?.depth).toBe(1);
    expect(policy.get(4)?.depth).toBe(4);
  });

  it("calculates the entire subtree height", () => {
    const policy = buildBackendMenuPolicyV2(items);

    expect(policy.get(1)?.subtreeHeight).toBe(4);
    expect(policy.get(2)?.subtreeHeight).toBe(3);
    expect(policy.get(5)?.subtreeHeight).toBe(1);
  });

  it("allows creation under levels one to three", () => {
    const policy = buildBackendMenuPolicyV2(items);

    for (const id of [1, 2, 3]) {
      expect(
        canCreateBackendSubmenuV2(policy, id),
      ).toBe(true);
    }
  });

  it("allows creation under an empty menu", () => {
    const policy = buildBackendMenuPolicyV2(items);

    expect(
      canCreateBackendSubmenuV2(policy, 5),
    ).toBe(true);
  });

  it("blocks creation under level four", () => {
    const policy = buildBackendMenuPolicyV2(items);

    expect(
      canCreateBackendSubmenuV2(policy, 4),
    ).toBe(false);
  });

  it("blocks unknown parents", () => {
    const policy = buildBackendMenuPolicyV2(items);

    expect(
      canCreateBackendSubmenuV2(policy, 999),
    ).toBe(false);

    expect(
      canMoveBackendMenuToParentV2(policy, 5, 999),
    ).toBe(false);
  });

  it("allows moving into an empty target menu", () => {
    const policy = buildBackendMenuPolicyV2(items);

    expect(
      canMoveBackendMenuToParentV2(policy, 4, 5),
    ).toBe(true);
  });

  it("allows a move ending exactly at depth four", () => {
    const policy = buildBackendMenuPolicyV2(items);

    expect(
      canMoveBackendMenuToParentV2(policy, 5, 8),
    ).toBe(true);
  });

  it("blocks moves exceeding maximum depth", () => {
    const policy = buildBackendMenuPolicyV2(items);

    expect(
      canMoveBackendMenuToParentV2(policy, 5, 4),
    ).toBe(false);
  });

  it("checks all descendants during a move", () => {
    const policy = buildBackendMenuPolicyV2(items);

    expect(
      canMoveBackendMenuToParentV2(policy, 2, 7),
    ).toBe(false);

    expect(
      canMoveBackendMenuToParentV2(policy, 2, 6),
    ).toBe(true);
  });

  it("blocks moving into its own subtree", () => {
    const policy = buildBackendMenuPolicyV2(items);

    expect(
      canMoveBackendMenuToParentV2(policy, 2, 3),
    ).toBe(false);
  });

  it("blocks moving a menu into itself", () => {
    const policy = buildBackendMenuPolicyV2(items);

    expect(
      canMoveBackendMenuToParentV2(policy, 5, 5),
    ).toBe(false);
  });

  it("leaves same-parent reordering separate", () => {
    const policy = buildBackendMenuPolicyV2(items);

    expect(
      canMoveBackendMenuToParentV2(policy, 5, 1),
    ).toBe(false);
  });

  it("preserves the existing head-menu move restriction", () => {
    const policy = buildBackendMenuPolicyV2(items);

    expect(
      canMoveBackendMenuToParentV2(policy, 1, 6),
    ).toBe(false);
  });

  it("rejects inconsistent head-menu flags", () => {
    expect(() =>
      buildBackendMenuPolicyV2([
        { ...menu(1), isHeadMenu: false },
      ]),
    ).toThrow();
  });

  it("rejects missing parents", () => {
    expect(() =>
      buildBackendMenuPolicyV2([
        menu(1, 999),
      ]),
    ).toThrow();
  });

  it("rejects circular hierarchies", () => {
    expect(() =>
      buildBackendMenuPolicyV2([
        menu(1, 2),
        menu(2, 1),
      ]),
    ).toThrow();
  });

  it("rejects duplicate menu IDs", () => {
    expect(() =>
      buildBackendMenuPolicyV2([
        menu(1),
        menu(1),
      ]),
    ).toThrow();
  });

  it("does not mutate the original inventory", () => {
    const before = JSON.stringify(items);

    buildBackendMenuPolicyV2(items);

    expect(JSON.stringify(items)).toBe(before);
  });
});
