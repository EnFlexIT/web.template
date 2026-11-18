export interface BackendMenuDeletionItem {
  menuId: number;
  parentId?: number | null;
  caption: string;
}

export interface BackendMenuDeletionPlan {
  menuId: number;
  caption: string;
  affectedMenuIds: number[];
  descendantCount: number;
  totalCount: number;
}

/**
 * Creates a read-only preview of a menu hierarchy deletion.
 *
 * No API calls or database changes are performed.
 */
export function planBackendMenuDeletionV2(
  menus: readonly BackendMenuDeletionItem[],
  menuId: number,
): BackendMenuDeletionPlan {
  if (!Number.isSafeInteger(menuId) || menuId <= 0) {
    throw new Error("Invalid menu ID");
  }

  const byId = new Map<number, BackendMenuDeletionItem>();

  for (const menu of menus) {
    if (!Number.isSafeInteger(menu.menuId) || menu.menuId <= 0) {
      throw new Error("Invalid menu structure");
    }

    if (byId.has(menu.menuId)) {
      throw new Error("Duplicate menu ID");
    }

    byId.set(menu.menuId, menu);
  }

  const selected = byId.get(menuId);

  if (!selected) {
    throw new Error("Menu not found");
  }

  const children = new Map<number, number[]>();

  for (const menu of menus) {
    if (menu.parentId == null) continue;

    const siblings = children.get(menu.parentId) ?? [];
    siblings.push(menu.menuId);
    children.set(menu.parentId, siblings);
  }

  const visited = new Set<number>();
  const active = new Set<number>();
  const affectedMenuIds: number[] = [];

  function visit(id: number): void {
    if (active.has(id)) {
      throw new Error("Cyclic menu structure");
    }

    if (visited.has(id)) {
      throw new Error("Invalid menu hierarchy");
    }

    active.add(id);

    for (const childId of children.get(id) ?? []) {
      visit(childId);
    }

    active.delete(id);
    visited.add(id);
    affectedMenuIds.push(id);
  }

  visit(menuId);

  return {
    menuId,
    caption: selected.caption,
    affectedMenuIds,
    descendantCount: affectedMenuIds.length - 1,
    totalCount: affectedMenuIds.length,
  };
}