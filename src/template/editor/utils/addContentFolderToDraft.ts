import type { EditorDraft } from "../model/editorTypes";
import type { MenuPlacementPolicy } from "../model/menuPlacement";
import type {
  ProtectedMenuEntry,
  TrustedMenuInventory,
} from "../model/menuProtection";
import { getAllowedContentParents } from "./getAllowedContentParents";

export type AddContentFolderResult =
  | {
      ok: true;
      draft: EditorDraft;
      entryId: string;
    }
  | {
      ok: false;
      reason:
        | "INVALID_TITLE"
        | "PARENT_NOT_ALLOWED"
        | "PARENT_NOT_FOUND"
        | "DUPLICATE_ID";
    };

/**
 * Adds a content folder without a content page.
 *
 * Local draft only. No backend or runtime changes.
 */
export function addContentFolderToDraft(
  draft: EditorDraft,
  policy: Readonly<MenuPlacementPolicy>,
  protectedEntries: readonly ProtectedMenuEntry[],
  inventory: Readonly<TrustedMenuInventory>,
  parentId: string,
  title: string,
  entryId: string,
): AddContentFolderResult {
  const caption = title.trim();

  if (!caption) {
    return { ok: false, reason: "INVALID_TITLE" };
  }

  if (!draft.entries.some(entry => entry.id === parentId)) {
    return { ok: false, reason: "PARENT_NOT_FOUND" };
  }

  const allowedParents = getAllowedContentParents(
    draft.entries,
    policy,
    protectedEntries,
    inventory,
  );

  if (!allowedParents.some(entry => entry.id === parentId)) {
    return { ok: false, reason: "PARENT_NOT_ALLOWED" };
  }

  if (
    !entryId.startsWith("content:") ||
    entryId.trim() !== entryId ||
    entryId === "content:" ||
    draft.entries.some(entry => entry.id === entryId) ||
    draft.pages.some(page => page.id === entryId)
  ) {
    return { ok: false, reason: "DUPLICATE_ID" };
  }

  const nextPosition =
    Math.max(
      0,
      ...draft.entries
        .filter(entry => entry.parentId === parentId)
        .map(entry => entry.position),
    ) + 1;

  return {
    ok: true,
    entryId,
    draft: {
      ...draft,
      entries: [
        ...draft.entries,
        {
          id: entryId,
          source: "content",
          parentId,
          caption,
          position: nextPosition,
        },
      ],
    },
  };
}