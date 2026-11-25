import type {
  BackendMenuRenameContext,
} from "./renameBackendMenuV2";

import {
  planBackendMenuReorderV2,
} from "./planBackendMenuReorderV2";

export interface ReorderBackendMenuParams {
  menuId: number;
  targetPosition: number;
  expectedParentId: number | null;
  expectedSiblingIds: readonly number[];
  language: string;
  getContext: () => BackendMenuRenameContext;
}

function isWritable(
  context: BackendMenuRenameContext,
): boolean {
  return (
    context.isLoggedIn &&
    context.canEdit &&
    !context.isSwitchingServer &&
    !context.isLoggingOut &&
    typeof context.server === "string" &&
    context.server.trim().length > 0 &&
    Number.isSafeInteger(context.authGeneration)
  );
}

function isSameSession(
  before: BackendMenuRenameContext,
  after: BackendMenuRenameContext,
): boolean {
  return (
    before.client === after.client &&
    before.server === after.server &&
    before.authGeneration === after.authGeneration &&
    isWritable(after)
  );
}

export async function reorderBackendMenuV2({
  menuId,
  targetPosition,
  expectedParentId,
  expectedSiblingIds,
  language,
  getContext,
}: ReorderBackendMenuParams): Promise<boolean> {
  if (typeof language !== "string" || !language.trim()) {
    throw new Error("Backend menu language is required");
  }

  const before = { ...getContext() };

  if (!isWritable(before)) {
    throw new Error("Backend menu reordering is not authorized");
  }

  const response = await before.client.getMenus(language);

  if (!isSameSession(before, getContext())) {
    throw new Error("Backend menu inventory belongs to a stale session");
  }

  const items = response.data?.menuList;

  if (!Array.isArray(items)) {
    throw new Error("Invalid backend menu inventory");
  }

  const source = items.find(item => item.menuId === menuId);

  if (!source) {
    throw new Error("Backend menu not found");
  }

  if ((source.parentId ?? null) !== expectedParentId) {
    throw new Error("Menu parent changed. Reload before reordering.");
  }

  const siblingIds = items
    .filter(item =>
      (item.parentId ?? null) === expectedParentId,
    )
    .sort((a, b) => a.position - b.position)
    .map(item => item.menuId);

  if (
    siblingIds.length !== expectedSiblingIds.length ||
    siblingIds.some((id, index) =>
      id !== expectedSiblingIds[index],
    )
  ) {
    throw new Error("Menu order changed. Reload before reordering.");
  }

  const plan = planBackendMenuReorderV2({
    items,
    menuId,
    targetPosition,
  });

  if (!plan.changed) {
    return false;
  }

  if (!isSameSession(before, getContext())) {
    throw new Error("Backend menu session changed before update");
  }

  await before.client.updateMenu(
    menuId,
    plan.updatedMenu,
  );

  if (!isSameSession(before, getContext())) {
    throw new Error("Backend menu update returned for a stale session");
  }

  const verification = await before.client.getMenus(language);

  if (!isSameSession(before, getContext())) {
    throw new Error("Menu verification returned for a stale session");
  }

  const savedItems = verification.data?.menuList;

  if (!Array.isArray(savedItems)) {
    throw new Error("Unable to verify saved menu order");
  }

  const expected = plan.updatedInventory
    .filter(item =>
      (item.parentId ?? null) === expectedParentId,
    )
    .sort((a, b) => a.position - b.position);

  const actual = savedItems
    .filter(item =>
      (item.parentId ?? null) === expectedParentId,
    )
    .sort((a, b) => a.position - b.position);

  if (
    actual.length !== expected.length ||
    actual.some((item, index) =>
      item.menuId !== expected[index].menuId ||
      item.position !== expected[index].position,
    )
  ) {
    throw new Error(
      "Saved menu order could not be verified. Reload before retrying.",
    );
  }

  return true;
}
