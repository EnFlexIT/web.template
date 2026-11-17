import type {
  EditorMenuEntry,
} from "../model/editorTypes";

export interface MenuTreeRow {
  entry: EditorMenuEntry;
  depth: number;
}

/**
 * Creates a parent-first, depth-first menu presentation.
 *
 * Invalid parent references and cycles must be
 * rejected by validateEditorDraft before acceptance.
 * This function also avoids infinite traversal.
 */
export function buildMenuTreeRows(
  entries: readonly EditorMenuEntry[],
): MenuTreeRow[] {
  const byId = new Map(entries.map(entry => [entry.id, entry]));
  const children = new Map<string | undefined, EditorMenuEntry[]>();

  for (const entry of entries) {
    const parentId =
      entry.parentId && byId.has(entry.parentId)
        ? entry.parentId
        : undefined;

    const siblings = children.get(parentId) ?? [];
    siblings.push(entry);
    children.set(parentId, siblings);
  }

  for (const siblings of children.values()) {
    siblings.sort(
      (a, b) =>
        a.position - b.position ||
        a.id.localeCompare(b.id),
    );
  }

  const result: MenuTreeRow[] = [];
  const visited = new Set<string>();

  function visit(entry: EditorMenuEntry, depth: number) {
    if (visited.has(entry.id)) {
      return;
    }

    visited.add(entry.id);
    result.push({ entry, depth });

    for (const child of children.get(entry.id) ?? []) {
      visit(child, depth + 1);
    }
  }

  for (const root of children.get(undefined) ?? []) {
    visit(root, 0);
  }

  // Invalid or cyclic groups remain visible for diagnosis.
  for (const entry of entries) {
    if (!visited.has(entry.id)) {
      visit(entry, 0);
    }
  }

  return result;
}
