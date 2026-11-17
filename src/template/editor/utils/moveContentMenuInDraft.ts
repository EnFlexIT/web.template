import type { EditorDraft } from "../model/editorTypes";

export type MoveContentMenuResult =
  | { ok: true; draft: EditorDraft }
  | {
      ok: false;
      reason:
        | "MENU_NOT_FOUND"
        | "MENU_PROTECTED"
        | "NO_SIBLING"
        | "PROTECTED_SIBLING";
    };

/**
 * Moves an editable content menu by one position
 * within the same parent. No backend writes.
 *
 * Positions are exchanged rather than renumbered,
 * so protected menu positions remain unchanged.
 */
export function moveContentMenuInDraft(
  draft: EditorDraft,
  entryId: string,
  direction: "up" | "down",
): MoveContentMenuResult {
  const entry = draft.entries.find(item => item.id === entryId);

  if (!entry) {
    return { ok: false, reason: "MENU_NOT_FOUND" };
  }

  if (entry.source !== "content") {
    return { ok: false, reason: "MENU_PROTECTED" };
  }

  const siblings = draft.entries
    .filter(item => item.parentId === entry.parentId)
    .sort((a, b) =>
      a.position - b.position || a.id.localeCompare(b.id),
    );

  const index = siblings.findIndex(item => item.id === entryId);
  const targetIndex = index + (direction === "up" ? -1 : 1);
  const target = siblings[targetIndex];

  if (!target) {
    return { ok: false, reason: "NO_SIBLING" };
  }

  if (target.source !== "content") {
    return { ok: false, reason: "PROTECTED_SIBLING" };
  }

  // Do not renumber around protected static siblings.
  if (siblings.some(item => item.source !== "content")) {
    return { ok: false, reason: "PROTECTED_SIBLING" };
  }

  const reordered = [...siblings];

  [reordered[index], reordered[targetIndex]] = [
    reordered[targetIndex],
    reordered[index],
  ];

  const positionsById = new Map(
    reordered.map((item, position) => [
      item.id,
      position + 1,
    ]),
  );

  return {
    ok: true,
    draft: {
      ...draft,
      entries: draft.entries.map(item => {
        const position = positionsById.get(item.id);

        return position === undefined
          ? item
          : { ...item, position };
      }),
    },
  };
}