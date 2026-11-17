import type {
  EditorDraft,
} from "../model/editorTypes";

export type RenameContentMenuResult =
  | {
      ok: true;
      draft: EditorDraft;
    }
  | {
      ok: false;
      reason:
        | "MENU_NOT_FOUND"
        | "MENU_PROTECTED"
        | "INVALID_TITLE";
    };

/**
 * Renames an editable content menu in a local draft.
 *
 * Does not rename the associated content page,
 * change navigation, or write to the backend.
 */
export function renameContentMenuInDraft(
  draft: EditorDraft,
  entryId: string,
  title: string,
): RenameContentMenuResult {
  const entry = draft.entries.find(
    item => item.id === entryId,
  );

  if (!entry) {
    return {
      ok: false,
      reason: "MENU_NOT_FOUND",
    };
  }

  if (entry.source !== "content") {
    return {
      ok: false,
      reason: "MENU_PROTECTED",
    };
  }

  const caption = title.trim();

  if (!caption) {
    return {
      ok: false,
      reason: "INVALID_TITLE",
    };
  }

  return {
    ok: true,
    draft: {
      ...draft,
      entries: draft.entries.map(item =>
        item.id === entryId
          ? { ...item, caption }
          : item,
      ),
    },
  };
}