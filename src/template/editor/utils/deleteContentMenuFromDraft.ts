import type {
  EditorDraft,
} from "../model/editorTypes";

export type DeleteContentMenuResult =
  | {
      ok: true;
      draft: EditorDraft;
    }
  | {
      ok: false;
      reason:
        | "MENU_NOT_FOUND"
        | "MENU_PROTECTED"
        | "HAS_CHILDREN"
        | "SHARED_CONTENT_PAGE";
    };

/**
 * Deletes an editable content menu and its uniquely owned page
 * from a local draft. Never modifies backend navigation.
 */
export function deleteContentMenuFromDraft(
  draft: EditorDraft,
  entryId: string,
): DeleteContentMenuResult {
  const entry = draft.entries.find(
    item => item.id === entryId,
  );

  if (!entry) {
    return { ok: false, reason: "MENU_NOT_FOUND" };
  }

  if (entry.source !== "content") {
    return { ok: false, reason: "MENU_PROTECTED" };
  }

  if (draft.entries.some(item => item.parentId === entryId)) {
    return { ok: false, reason: "HAS_CHILDREN" };
  }

  if (
    entry.contentPageId &&
    draft.entries.some(
      item =>
        item.id !== entryId &&
        item.contentPageId === entry.contentPageId,
    )
  ) {
    return { ok: false, reason: "SHARED_CONTENT_PAGE" };
  }

  return {
    ok: true,
    draft: {
      ...draft,
      entries: draft.entries.filter(
        item => item.id !== entryId,
      ),
      pages: entry.contentPageId
        ? draft.pages.filter(
            page => page.id !== entry.contentPageId,
          )
        : draft.pages,
    },
  };
}