export interface BackendMenuPositionEntryV2 {
  menuId: number;
  parentId?: number | null;
  position: number;
}

/**
 * Validates one sibling group.
 *
 * Positions are one-based, unique and contiguous.
 * Identical positions under different parents are allowed.
 *
 * This function does not mutate the inventory.
 */
export function validateBackendMenuSiblingPositionsV2(
  items: readonly BackendMenuPositionEntryV2[],
  parentId: number | null,
): void {
  const siblings = items.filter(
    item => (item.parentId ?? null) === parentId,
  );

  for (const sibling of siblings) {
    if (
      !Number.isSafeInteger(sibling.position) ||
      sibling.position < 1
    ) {
      throw new Error("Invalid existing menu positions. Invalid position value.");
    }
  }

  const positions = siblings
    .map(item => item.position)
    .sort((a, b) => a - b);

  if (
    positions.some(
      (position, index) => position !== index + 1,
    )
  ) {
    throw new Error(
      "Invalid existing menu positions. " +
      "Positions must be unique and contiguous.",
    );
  }
}

/**
 * Validates all sibling groups in a complete inventory.
 *
 * Parent references, cycles and menu depth are handled
 * separately by the existing tree and menu policy.
 */
export function validateBackendMenuPositionsV2(
  items: readonly BackendMenuPositionEntryV2[],
): void {
  if (!Array.isArray(items)) {
    throw new Error("Invalid backend menu inventory");
  }

  const groups = new Map<
    number | null,
    BackendMenuPositionEntryV2[]
  >();

  const ids = new Set<number>();

  for (const item of items) {
    if (
      !item ||
      !Number.isSafeInteger(item.menuId) ||
      item.menuId <= 0 ||
      ids.has(item.menuId)
    ) {
      throw new Error("Invalid backend menu inventory");
    }

    ids.add(item.menuId);

    const parentId = item.parentId ?? null;

    if (
      parentId !== null &&
      (
        !Number.isSafeInteger(parentId) ||
        parentId <= 0 ||
        parentId === item.menuId
      )
    ) {
      throw new Error("Invalid parent menu ID");
    }

    const group = groups.get(parentId) ?? [];

    group.push(item);
    groups.set(parentId, group);
  }

  for (const [parentId, siblings] of groups) {
    validateBackendMenuSiblingPositionsV2(
      siblings,
      parentId,
    );
  }
}
