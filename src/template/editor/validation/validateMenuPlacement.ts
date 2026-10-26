import type {
  EditorMenuEntry,
} from "../model/editorTypes";

import type {
  MenuPlacementPolicy,
} from "../model/menuPlacement";

export interface MenuPlacementError {
  code:
    | "CONTENT_PARENT_NOT_ALLOWED"
    | "CONTENT_PARENT_IS_PAGE";
  entryId: string;
  message: string;
}

/**
 * The trusted allowlist defines the roots of editable
 * content subtrees. Content folders inside these roots
 * can contain other content entries.
 *
 * Structural errors (missing parents and cycles) are
 * validated separately by validateMenuDraft.
 */
export function validateMenuPlacement(
  entries: readonly EditorMenuEntry[],
  policy: Readonly<MenuPlacementPolicy>,
): MenuPlacementError[] {
  const errors: MenuPlacementError[] = [];
  const byId = new Map(entries.map(entry => [entry.id, entry]));
  const allowedParents = new Set(
    policy.allowedContentParentIds,
  );

  for (const entry of entries) {
    if (entry.source !== "content") {
      continue;
    }

    const visited = new Set<string>([entry.id]);
    let parentId = entry.parentId;
    let allowed = false;
    let parentIsPage = false;

    while (parentId && !visited.has(parentId)) {
      visited.add(parentId);

      const parent = byId.get(parentId);

      if (!parent) {
        break;
      }

      // Trusted roots are explicitly authorized by
      // the Application configuration.
      if (
        allowedParents.has(parentId) &&
        (parent.source === "application" ||
          parent.source === "template")
      ) {
        allowed = true;
        break;
      }

      // Only content folders may extend an allowed root.
      if (parent.source !== "content") {
        break;
      }

      if (parent.contentPageId !== undefined) {
        parentIsPage = true;
        break;
      }

      parentId = parent.parentId;
    }

    if (parentIsPage) {
      errors.push({
        code: "CONTENT_PARENT_IS_PAGE",
        entryId: entry.id,
        message: `Content page cannot contain menus: ${entry.id}`,
      });
    } else if (!allowed) {
      errors.push({
        code: "CONTENT_PARENT_NOT_ALLOWED",
        entryId: entry.id,
        message: `Content menu parent is not allowed: ${entry.id}`,
      });
    }
  }

  return errors;
}