import type { EditorDraft } from "../model/editorTypes";

export type SetContentMenuVisibilityResult =
  | { ok: true; draft: EditorDraft }
  | { ok: false; reason: "NOT_FOUND" | "NOT_CONTENT" };

export function setContentMenuVisibility(
  draft: EditorDraft,
  entryId: string,
  hidden: boolean,
): SetContentMenuVisibilityResult {
  const entry = draft.entries.find(item => item.id === entryId);

  if (!entry) {
    return { ok: false, reason: "NOT_FOUND" };
  }

  if (entry.source !== "content") {
    return { ok: false, reason: "NOT_CONTENT" };
  }

  return {
    ok: true,
    draft: {
      ...draft,
      entries: draft.entries.map(item =>
        item.id === entryId
          ? { ...item, hidden }
          : item,
      ),
    },
  };
}