import type { EditorDraft } from "../model/editorTypes";
import type { MenuPlacementPolicy } from "../model/menuPlacement";
import type {
  ProtectedMenuEntry,
  TrustedMenuInventory,
} from "../model/menuProtection";

import { getAllowedContentParents } from "./getAllowedContentParents";
import { validateEditorDraft } from "../validation/validateEditorDraft";

export type MoveContentMenuToParentResult =
  | { ok: true; draft: EditorDraft }
  | {
      ok: false;
      reason:
        | "MENU_NOT_FOUND"
        | "MENU_PROTECTED"
        | "PARENT_NOT_FOUND"
        | "PARENT_NOT_ALLOWED"
        | "CYCLIC_PARENT"
        | "INVALID_DRAFT";
    };

export function moveContentMenuToParent(
  draft: EditorDraft,
  policy: Readonly<MenuPlacementPolicy>,
  protectedEntries: readonly ProtectedMenuEntry[],
  inventory: Readonly<TrustedMenuInventory>,
  entryId: string,
  newParentId: string,
): MoveContentMenuToParentResult {
  const entry = draft.entries.find(item => item.id === entryId);

  if (!entry) {
    return { ok: false, reason: "MENU_NOT_FOUND" };
  }

  if (entry.source !== "content") {
    return { ok: false, reason: "MENU_PROTECTED" };
  }

  if (!draft.entries.some(item => item.id === newParentId)) {
    return { ok: false, reason: "PARENT_NOT_FOUND" };
  }

  if (entryId === newParentId) {
    return { ok: false, reason: "CYCLIC_PARENT" };
  }

  const allowedParents = getAllowedContentParents(
    draft.entries,
    policy,
    protectedEntries,
    inventory,
  );

  if (!allowedParents.some(item => item.id === newParentId)) {
    return { ok: false, reason: "PARENT_NOT_ALLOWED" };
  }

  // Never move a folder into one of its descendants.
  const byId = new Map(draft.entries.map(item => [item.id, item]));
  const visited = new Set<string>();
  let currentId: string | undefined = newParentId;

  while (currentId && !visited.has(currentId)) {
    if (currentId === entryId) {
      return { ok: false, reason: "CYCLIC_PARENT" };
    }

    visited.add(currentId);
    currentId = byId.get(currentId)?.parentId;
  }

  // Reparenting within the same parent is not needed.
  if (entry.parentId === newParentId) {
    return { ok: true, draft };
  }

  const siblingPositions = draft.entries
    .filter(item => item.parentId === newParentId)
    .map(item => item.position);

  const maxPosition = Math.max(0, ...siblingPositions);

  if (!Number.isSafeInteger(maxPosition) ||
      maxPosition >= Number.MAX_SAFE_INTEGER) {
    return { ok: false, reason: "INVALID_DRAFT" };
  }

  const updatedDraft: EditorDraft = {
    ...draft,
    entries: draft.entries.map(item =>
      item.id === entryId
        ? {
            ...item,
            parentId: newParentId,
            position: maxPosition + 1,
          }
        : item,
    ),
  };

  const errors = validateEditorDraft(
    updatedDraft,
    protectedEntries,
    policy,
    inventory,
  );

  if (errors.length > 0) {
    return { ok: false, reason: "INVALID_DRAFT" };
  }

  return { ok: true, draft: updatedDraft };
}