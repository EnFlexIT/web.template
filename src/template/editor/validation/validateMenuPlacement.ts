import type {
  EditorMenuEntry,
} from "../model/editorTypes";

import type {
  MenuPlacementPolicy,
} from "../model/menuPlacement";

export interface MenuPlacementError {
  code: "CONTENT_PARENT_NOT_ALLOWED";
  entryId: string;
  message: string;
}

/**
 * Validates content menu placement against an
 * Application-owned allowlist.
 *
 * Structural validation must run separately.
 */
export function validateMenuPlacement(
  entries: readonly EditorMenuEntry[],
  policy: Readonly<MenuPlacementPolicy>,
): MenuPlacementError[] {
  const errors: MenuPlacementError[] = [];
  const allowedParents = new Set(
    policy.allowedContentParentIds,
  );

  for (const entry of entries) {
    if (entry.source !== "content") {
      continue;
    }

    if (
      !entry.parentId ||
      !allowedParents.has(entry.parentId)
    ) {
      errors.push({
        code: "CONTENT_PARENT_NOT_ALLOWED",
        entryId: entry.id,
        message: `Content menu parent is not allowed: ${entry.id}`,
      });
    }
  }

  return errors;
}
