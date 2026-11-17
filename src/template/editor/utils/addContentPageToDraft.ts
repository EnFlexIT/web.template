import type {
  EditorDraft,
} from "../model/editorTypes";

import type {
  MenuPlacementPolicy,
} from "../model/menuPlacement";
import type {
  ProtectedMenuEntry,
  TrustedMenuInventory,
} from "../model/menuProtection";
import { getAllowedContentParents } from "./getAllowedContentParents";

export type AddContentPageResult =
  | {
      ok: true;
      draft: EditorDraft;
      entryId: string;
    }
  | {
      ok: false;
      reason:
        | "PARENT_NOT_ALLOWED"
        | "PARENT_NOT_FOUND"
        | "INVALID_TITLE"
        | "DUPLICATE_ID";
    };

export function addContentPageToDraft(
  draft: EditorDraft,
  policy: Readonly<MenuPlacementPolicy>,
  protectedEntries: readonly ProtectedMenuEntry[],
  inventory: Readonly<TrustedMenuInventory>,
  parentId: string,
  title: string,
  entryId: string,
  pageId: string,
): AddContentPageResult {
  if (!title.trim()) {
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
    !entryId.trim() ||
    !pageId.trim() ||
    draft.entries.some(entry => entry.id === entryId) ||
    draft.pages.some(page => page.id === pageId)
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
          caption: title.trim(),
          position: nextPosition,
          contentPageId: pageId,
        },
      ],
      pages: [
        ...draft.pages,
        {
          id: pageId,
          title: title.trim(),
          blocks: [],
        },
      ],
    },
  };
}
