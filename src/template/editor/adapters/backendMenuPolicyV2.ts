import type {
  MenuItem,
} from "@/api/implementation/Dynamic-Content-Api-V2";

import {
  buildBackendMenuTreeV2,
  type BackendMenuTreeNodeV2,
} from "./buildBackendMenuTreeV2";

export const MAX_BACKEND_MENU_DEPTH = 4;

export interface BackendMenuPolicyEntry {
  menuId: number;
  parentId: number | null;
  depth: number;
  subtreeHeight: number;
}

export function buildBackendMenuPolicyV2(
  items: readonly MenuItem[],
): ReadonlyMap<number, BackendMenuPolicyEntry> {
  const roots = buildBackendMenuTreeV2(items);

  const entries = new Map<
    number,
    BackendMenuPolicyEntry
  >();

  function visit(
    node: BackendMenuTreeNodeV2,
    depth: number,
  ): number {
    const parentId = node.parentId ?? null;

    if (node.isHeadMenu !== (parentId === null)) {
      throw new Error("Invalid backend head menu flag");
    }

    let subtreeHeight = 1;

    for (const child of node.children) {
      subtreeHeight = Math.max(
        subtreeHeight,
        1 + visit(child, depth + 1),
      );
    }

    entries.set(node.menuId, {
      menuId: node.menuId,
      parentId,
      depth,
      subtreeHeight,
    });

    return subtreeHeight;
  }

  for (const root of roots) {
    visit(root, 1);
  }

  return entries;
}

export function canCreateBackendSubmenuV2(
  policy: ReadonlyMap<number, BackendMenuPolicyEntry>,
  parentId: number,
): boolean {
  const parent = policy.get(parentId);

  return (
    parent !== undefined &&
    parent.depth < MAX_BACKEND_MENU_DEPTH
  );
}

export function canMoveBackendMenuToParentV2(
  policy: ReadonlyMap<number, BackendMenuPolicyEntry>,
  menuId: number,
  targetParentId: number,
): boolean {
  const source = policy.get(menuId);
  const target = policy.get(targetParentId);

  if (
    !source ||
    !target ||
    source.parentId === null ||
    source.menuId === target.menuId ||
    source.parentId === target.menuId
  ) {
    return false;
  }

  // Reject moves into the source's own subtree.
  let current: BackendMenuPolicyEntry | undefined =
    target;

  const visited = new Set<number>();

  while (current) {
    if (
      current.menuId === source.menuId ||
      visited.has(current.menuId)
    ) {
      return false;
    }

    visited.add(current.menuId);

    if (current.parentId === null) {
      break;
    }

    current = policy.get(current.parentId);

    if (!current) {
      return false;
    }
  }

  return (
    target.depth + source.subtreeHeight
    <= MAX_BACKEND_MENU_DEPTH
  );
}
