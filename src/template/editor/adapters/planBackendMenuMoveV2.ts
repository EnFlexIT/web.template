import {
  validateBackendMenuSiblingPositionsV2,
} from "./backendMenuPositionValidatorV2";

import type {
  MenuItem,
} from "@/api/implementation/Dynamic-Content-Api-V2";

import {
  buildBackendMenuTreeV2,
} from "./buildBackendMenuTreeV2";

import {
  buildBackendMenuPolicyV2,
  canMoveBackendMenuToParentV2,
} from "./backendMenuPolicyV2";

export interface PlanBackendMenuMoveParams {
  items: readonly MenuItem[];
  menuId: number;
  targetParentId: number;
  allowedParentIds: readonly number[];
}

export interface BackendMenuMovePlan {
  updatedMenu: MenuItem;
  updatedInventory: MenuItem[];
}

export function planBackendMenuMoveV2({
  items,
  menuId,
  targetParentId,
  allowedParentIds,
}: PlanBackendMenuMoveParams): BackendMenuMovePlan {
  if (
    !Number.isSafeInteger(menuId) ||
    menuId <= 0 ||
    !Number.isSafeInteger(targetParentId) ||
    targetParentId <= 0
  ) {
    throw new Error("Invalid backend menu move IDs");
  }

  // Validate hierarchy and calculate subtree dimensions.
  const policy = buildBackendMenuPolicyV2(items);

  const source = items.find(item => item.menuId === menuId);
  const target = items.find(item => item.menuId === targetParentId);

  if (!source || !target) {
    throw new Error("Backend menu or target not found");
  }

  if (!allowedParentIds.includes(targetParentId)) {
    throw new Error("Backend menu target is not allowed");
  }

  if (menuId === targetParentId) {
    throw new Error("Menu cannot be moved into itself");
  }

  if (source.parentId === targetParentId) {
    throw new Error("Menu already belongs to this parent");
  }

  const byId = new Map(items.map(item => [item.menuId, item]));
  const visited = new Set<number>();

  let parentId: number | undefined = targetParentId;

  while (parentId !== undefined && parentId !== null) {
    if (parentId === menuId) {
      throw new Error("Menu cannot be moved into its descendant");
    }

    if (visited.has(parentId)) {
      throw new Error("Circular backend menu hierarchy");
    }

    visited.add(parentId);
    parentId = byId.get(parentId)?.parentId;
  }

  if (!canMoveBackendMenuToParentV2(
    policy,
    menuId,
    targetParentId,
  )) {
    throw new Error("menuErrors.movePolicyDenied");
  }

  const sourceParentId = source.parentId ?? null;

  validateBackendMenuSiblingPositionsV2(
    items,
    sourceParentId,
  );

  validateBackendMenuSiblingPositionsV2(
    items,
    targetParentId,
  );

  const siblings = items.filter(
    item => item.parentId === targetParentId,
  );

  const lastPosition = siblings.reduce(
    (max, item) => Math.max(max, item.position),
    0,
  );

  if (!Number.isSafeInteger(lastPosition + 1)) {
    throw new Error("Invalid target menu position");
  }

  const updatedMenu: MenuItem = {
    ...source,
    parentId: targetParentId,
    position: lastPosition + 1,
  };

  const updatedInventory = items.map(item => {
    if (item.menuId === menuId) {
      return { ...updatedMenu };
    }

    if (
      (item.parentId ?? null) === sourceParentId &&
      item.position > source.position
    ) {
      return {
        ...item,
        position: item.position - 1,
      };
    }

    return { ...item };
  });

  validateBackendMenuSiblingPositionsV2(
    updatedInventory,
    sourceParentId,
  );

  validateBackendMenuSiblingPositionsV2(
    updatedInventory,
    targetParentId,
  );

  // Reject any cycle or broken hierarchy introduced by the move.
  buildBackendMenuTreeV2(updatedInventory);

  return {
    updatedMenu,
    updatedInventory,
  };
}