import type {
  UpdateContentAssignmentRequest,
} from "@/api/implementation/Dynamic-Content-Api-V2";

import type {
  BackendEditorBlockV2,
} from "./mapBackendContentToEditorV2";

export type ReorderDirection = "up" | "down";

export function sortBackendContentV2(
  blocks: readonly BackendEditorBlockV2[],
): BackendEditorBlockV2[] {
  const ids = new Set<number>();
  const positions = new Set<number>();

  for (const block of blocks) {
    if (
      !Number.isSafeInteger(block.backendContentId) ||
      block.backendContentId <= 0 ||
      !Number.isSafeInteger(block.position) ||
      block.position < 0 ||
      ids.has(block.backendContentId) ||
      positions.has(block.position)
    ) {
      throw new Error("Ambiguous backend content order");
    }

    ids.add(block.backendContentId);
    positions.add(block.position);
  }

  return [...blocks].sort(
    (a, b) => a.position - b.position,
  );
}

export function planBackendContentReorderV2(
  blocks: readonly BackendEditorBlockV2[],
  menuId: number,
  elementId: number,
  direction: ReorderDirection,
): UpdateContentAssignmentRequest | null {
  if (
    !Number.isSafeInteger(menuId) ||
    menuId <= 0 ||
    !Number.isSafeInteger(elementId) ||
    elementId <= 0
  ) {
    throw new Error("Invalid menu or content ID");
  }

  if (direction !== "up" && direction !== "down") {
    throw new Error("Invalid reorder direction");
  }

  const ordered = sortBackendContentV2(blocks);
  const index = ordered.findIndex(
    block => block.backendContentId === elementId,
  );

  if (index < 0) {
    throw new Error("Content element not found in menu");
  }

  const targetIndex =
    direction === "up" ? index - 1 : index + 1;

  if (targetIndex < 0 || targetIndex >= ordered.length) {
    return null;
  }

  return {
    elementId,
    sourceMenuId: menuId,
    targetMenuId: menuId,
    position: targetIndex + 1,
  };
}