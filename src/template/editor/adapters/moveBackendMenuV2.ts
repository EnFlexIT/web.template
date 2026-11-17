import type {
  BackendMenuRenameContext,
} from "./renameBackendMenuV2";

import {
  planBackendMenuMoveV2,
} from "./planBackendMenuMoveV2";

export interface MoveBackendMenuParams {
  menuId: number;
  targetParentId: number;
  allowedParentIds: readonly number[];
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

export async function moveBackendMenuV2({
  menuId,
  targetParentId,
  allowedParentIds,
  language,
  getContext,
}: MoveBackendMenuParams): Promise<void> {
  if (typeof language !== "string" || !language.trim()) {
    throw new Error("Backend menu language is required");
  }

  const before = { ...getContext() };

  if (!isWritable(before)) {
    throw new Error("Backend menu moving is not authorized");
  }

  const response = await before.client.getMenus(language);

  if (!isSameSession(before, getContext())) {
    throw new Error("Backend menu inventory belongs to a stale session");
  }

  const items = response.data?.menuList;

  if (!Array.isArray(items)) {
    throw new Error("Invalid backend menu inventory");
  }

  const plan = planBackendMenuMoveV2({
    items,
    menuId,
    targetParentId,
    allowedParentIds,
  });

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
}