import type {
  EditorDraft,
} from "../model/editorTypes";

export type TextBlockChangeResult =
  | {
      ok: true;
      draft: EditorDraft;
    }
  | {
      ok: false;
      reason:
        | "PAGE_NOT_FOUND"
        | "DUPLICATE_BLOCK_ID"
        | "BLOCK_NOT_FOUND"
        | "INVALID_BLOCK_ID";
    };

export function addTextBlockToDraft(
  draft: EditorDraft,
  pageId: string,
  blockId: string,
): TextBlockChangeResult {
  const page = draft.pages.find(
    item => item.id === pageId,
  );

  if (!page) {
    return { ok: false, reason: "PAGE_NOT_FOUND" };
  }

  if (!blockId.trim()) {
    return { ok: false, reason: "INVALID_BLOCK_ID" };
  }

  if (
    draft.pages.some(item =>
      item.blocks.some(block => block.id === blockId),
    )
  ) {
    return { ok: false, reason: "DUPLICATE_BLOCK_ID" };
  }

  return {
    ok: true,
    draft: {
      ...draft,
      pages: draft.pages.map(item =>
        item.id === pageId
          ? {
              ...item,
              blocks: [
                ...item.blocks,
                {
                  id: blockId,
                  type: "text" as const,
                  html: "<p></p>",
                },
              ],
            }
          : item,
      ),
    },
  };
}

export function updateTextBlockInDraft(
  draft: EditorDraft,
  pageId: string,
  blockId: string,
  html: string,
): TextBlockChangeResult {
  const page = draft.pages.find(
    item => item.id === pageId,
  );

  if (!page) {
    return { ok: false, reason: "PAGE_NOT_FOUND" };
  }

  if (
    !page.blocks.some(
      block => block.id === blockId && block.type === "text",
    )
  ) {
    return { ok: false, reason: "BLOCK_NOT_FOUND" };
  }

  return {
    ok: true,
    draft: {
      ...draft,
      pages: draft.pages.map(item =>
        item.id === pageId
          ? {
              ...item,
              blocks: item.blocks.map(block =>
                block.id === blockId && block.type === "text"
                  ? { ...block, html }
                  : block,
              ),
            }
          : item,
      ),
    },
  };
}
