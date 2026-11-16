import type {
  UpdateContentAssignmentRequest,
} from "@/api/implementation/Dynamic-Content-Api-V2";

/**
 * Calculates the backend operations needed to transform one
 * content order into another.
 *
 * This function never performs API requests.
 */
export function planBackendContentOrderSaveV2(
  menuId: number,
  currentIds: readonly number[],
  desiredIds: readonly number[],
): UpdateContentAssignmentRequest[] {
  if (!Number.isSafeInteger(menuId) || menuId <= 0) {
    throw new Error("Invalid backend menu ID");
  }

  const validIds = (ids: readonly number[]): boolean =>
    Array.isArray(ids) &&
    ids.every(id => Number.isSafeInteger(id) && id > 0) &&
    new Set(ids).size === ids.length;

  if (!validIds(currentIds) || !validIds(desiredIds)) {
    throw new Error("Invalid or duplicate content IDs");
  }

  if (
    currentIds.length !== desiredIds.length ||
    !currentIds.every(id => desiredIds.includes(id))
  ) {
    throw new Error("Backend content inventory changed");
  }

  const working = [...currentIds];
  const operations: UpdateContentAssignmentRequest[] = [];

  for (let targetIndex = 0; targetIndex < desiredIds.length; targetIndex++) {
    const desiredId = desiredIds[targetIndex];

    if (working[targetIndex] === desiredId) {
      continue;
    }

    const sourceIndex = working.indexOf(desiredId);

    if (sourceIndex < 0) {
      throw new Error("Content ID disappeared during reorder planning");
    }

    operations.push({
      elementId: desiredId,
      sourceMenuId: menuId,
      targetMenuId: menuId,
      position: targetIndex + 1,
    });

    working.splice(sourceIndex, 1);
    working.splice(targetIndex, 0, desiredId);
  }

  if (working.some((id, index) => id !== desiredIds[index])) {
    throw new Error("Backend reorder planning failed");
  }

  return operations;
}