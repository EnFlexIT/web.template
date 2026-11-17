import type {
  EditorContentPage,
  EditorDraft,
} from "../model/editorTypes";

export type UpdateContentPageResult =
  | {
      ok: true;
      draft: EditorDraft;
    }
  | {
      ok: false;
      reason: "not-found" | "conflict" | "unchanged";
    };

function samePage(
  first: EditorContentPage,
  second: EditorContentPage,
): boolean {
  return JSON.stringify(first) === JSON.stringify(second);
}

/**
 * Applies a content-page edit to an existing draft.
 *
 * Requires an unchanged original page to avoid silently
 * overwriting newer content.
 *
 * Does not access storage, change menus or call APIs.
 */
export function updateContentPageInDraft(
  currentDraft: EditorDraft,
  originalPage: EditorContentPage,
  updatedPage: EditorContentPage,
): UpdateContentPageResult {
  if (originalPage.id !== updatedPage.id) {
    return { ok: false, reason: "conflict" };
  }

  const currentPage = currentDraft.pages.find(
    page => page.id === originalPage.id,
  );

  if (!currentPage) {
    return { ok: false, reason: "not-found" };
  }

  if (!samePage(currentPage, originalPage)) {
    return { ok: false, reason: "conflict" };
  }

  if (samePage(originalPage, updatedPage)) {
    return { ok: false, reason: "unchanged" };
  }

  return {
    ok: true,
    draft: {
      ...currentDraft,
      pages: currentDraft.pages.map(page =>
        page.id === originalPage.id
          ? {
              ...updatedPage,
              blocks: updatedPage.blocks.map(block => ({ ...block })),
            }
          : page,
      ),
    },
  };
}