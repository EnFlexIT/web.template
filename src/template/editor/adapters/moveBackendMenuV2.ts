import {
  verifyBackendMenuStructureV2,
  type BackendMenuStructureContextV2,
} from "./backendMenuStructureContextV2";

import {
  planBackendMenuMoveV2,
} from "./planBackendMenuMoveV2";

import {
  buildBackendMenuTreeV2,
} from "./buildBackendMenuTreeV2";

import type {
  MenuItem,
} from "@/api/implementation/Dynamic-Content-Api-V2";

export interface MoveBackendMenuParams {
  menuId: number;
  targetParentId: number;
  expectedParentId?: number | null;
  allowedParentIds: readonly number[];
  language: string;
  getContext: () => BackendMenuStructureContextV2;
}

function isWritable(
  context: BackendMenuStructureContextV2,
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
  before: BackendMenuStructureContextV2,
  after: BackendMenuStructureContextV2,
): boolean {
  return (
    before.client === after.client &&
    before.server === after.server &&
    before.authGeneration === after.authGeneration &&
    isWritable(after)
  );
}

function findDuplicatePositions(
  items: readonly MenuItem[],
  parentIds: readonly (number | null)[],
): string[] {
  const positions = new Map<string, number[]>();

  for (const item of items) {
    const parentId = item.parentId ?? null;

    if (!parentIds.includes(parentId)) {
      continue;
    }

    const key =
      `Parent ${parentId ?? "root"}, position ${item.position}`;

    const ids = positions.get(key) ?? [];
    ids.push(item.menuId);
    positions.set(key, ids);
  }

  return Array.from(positions.entries())
    .filter(([, ids]) => ids.length > 1)
    .map(([key, ids]) =>
      `${key}: menus ${ids.join(", ")}`,
    );
}

export async function moveBackendMenuV2({
  menuId,
  targetParentId,
  expectedParentId,
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

  const response = await before.client.getAllMenus(language);

  if (!isSameSession(before, getContext())) {
    throw new Error("Backend menu inventory belongs to a stale session");
  }

  const items = response.data?.menuList;

  if (!Array.isArray(items)) {
    throw new Error("Invalid backend menu inventory");
  }

  const source = items.find(
    item => item.menuId === menuId,
  );

  if (!source) {
    throw new Error("Backend menu not found");
  }

  if (
    expectedParentId !== undefined &&
    (source.parentId ?? null) !== expectedParentId
  ) {
    throw new Error(
      "Menu parent changed. Reload before moving.",
    );
  }

  const affectedParents = [
    source.parentId ?? null,
    targetParentId,
  ];

  const duplicatesBefore = findDuplicatePositions(
    items,
    affectedParents,
  );

  if (duplicatesBefore.length > 0) {
    throw new Error(
      "Duplicate menu positions detected. Move blocked. " +
      duplicatesBefore.join("; "),
    );
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

  const verification =
    await before.client.getAllMenus(language);

  if (!isSameSession(before, getContext())) {
    throw new Error(
      "Menu verification returned for a stale session",
    );
  }

  const savedItems = verification.data?.menuList;

  if (!Array.isArray(savedItems)) {
    throw new Error(
      "Unable to verify saved menu move",
    );
  }

  const savedMenu = savedItems.find(
    item => item.menuId === menuId,
  );

  const problems: string[] = [];

  if (!savedMenu) {
    problems.push(`Menu ${menuId} missing after update`);
  } else {
    const actualParentId = savedMenu.parentId ?? null;

    if (actualParentId !== targetParentId) {
      problems.push(
        `Parent ID: expected ${targetParentId}, ` +
        `actual ${actualParentId ?? "root"}`,
      );
    }

    if (savedMenu.position !== plan.updatedMenu.position) {
      problems.push(
        `Position: expected ${plan.updatedMenu.position}, ` +
        `actual ${savedMenu.position}`,
      );
    }
  }

  const duplicatesAfter = findDuplicatePositions(
    savedItems,
    [
      ...affectedParents,
      savedMenu?.parentId ?? null,
    ],
  );

  if (duplicatesAfter.length > 0) {
    problems.push(
      "Duplicate menu positions: " +
      duplicatesAfter.join("; "),
    );
  }

  try {
    buildBackendMenuTreeV2(savedItems);
  } catch {
    problems.push("Invalid saved menu hierarchy");
  }

  try {
    verifyBackendMenuStructureV2(
      plan.updatedInventory,
      savedItems,
      affectedParents,
    );
  } catch {
    problems.push("Invalid saved sibling structure");
  }

  if (problems.length > 0) {
    throw new Error(
      "Saved menu move could not be verified. " +
      `Menu ID: ${menuId}. ` +
      problems.join(". ") +
      ". Reload before retrying.",
    );
  }
}