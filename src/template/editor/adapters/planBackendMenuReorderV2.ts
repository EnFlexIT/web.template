import {
  validateBackendMenuSiblingPositionsV2,
} from "./backendMenuPositionValidatorV2";

import type {
  MenuItem,
} from "@/api/implementation/Dynamic-Content-Api-V2";

import {
  buildBackendMenuTreeV2,
} from "./buildBackendMenuTreeV2";

export interface PlanBackendMenuReorderParams {
  items: readonly MenuItem[];
  menuId: number;
  targetPosition: number;
}

export interface BackendMenuReorderPlan {
  updatedMenu: MenuItem;
  updatedInventory: MenuItem[];
  changed: boolean;
}

export function planBackendMenuReorderV2({
  items,
  menuId,
  targetPosition,
}: PlanBackendMenuReorderParams): BackendMenuReorderPlan {
  if (!Number.isSafeInteger(menuId) || menuId <= 0) {
    throw new Error("Invalid backend menu ID");
  }

  if (!Number.isSafeInteger(targetPosition) || targetPosition < 1) {
    throw new Error("Invalid target menu position");
  }

  buildBackendMenuTreeV2(items);

  const source = items.find(item => item.menuId === menuId);

  if (!source) {
    throw new Error("Backend menu not found");
  }

  const parentId = source.parentId ?? null;

  const siblings = items
    .filter(item => (item.parentId ?? null) === parentId)
    .sort((a, b) => a.position - b.position);

  if (targetPosition > siblings.length) {
    throw new Error("Target menu position is out of range");
  }

  validateBackendMenuSiblingPositionsV2(items, parentId);

  const changed = source.position !== targetPosition;

  if (!changed) {
    return {
      updatedMenu: { ...source },
      updatedInventory: items.map(item => ({ ...item })),
      changed: false,
    };
  }

  const ordered = siblings.filter(item => item.menuId !== menuId);

  ordered.splice(targetPosition - 1, 0, source);

  const positions = new Map(
    ordered.map((item, index) => [
      item.menuId,
      index + 1,
    ]),
  );

  const updatedInventory = items.map(item => ({
    ...item,
    position: positions.get(item.menuId) ?? item.position,
  }));

  validateBackendMenuSiblingPositionsV2(
    updatedInventory,
    parentId,
  );

  buildBackendMenuTreeV2(updatedInventory);

  return {
    updatedMenu: {
      ...source,
      position: targetPosition,
    },
    updatedInventory,
    changed: true,
  };
}
