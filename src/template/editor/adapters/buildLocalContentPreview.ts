import type {
  EditorDraft,
  EditorMenuEntry,
} from "../model/editorTypes";

import type {
  ProtectedMenuEntry,
  TrustedMenuInventory,
} from "../model/menuProtection";

import type {
  MenuPlacementPolicy,
} from "../model/menuPlacement";

import {
  validateEditorDraft,
} from "../validation/validateEditorDraft";

export interface LocalContentPreviewNode {
  id: string;
  parentId: string;
  caption: string;
  position: number;
  contentPageId?: string;
  children: LocalContentPreviewNode[];
}

export type LocalContentPreviewResult =
  | {
      ok: true;
      roots: LocalContentPreviewNode[];
    }
  | {
      ok: false;
      reason: "INVALID_DRAFT";
    };

/**
 * Builds a detached preview of local content menus.
 *
 * Trusted static menus are attachment points,
 * not editable preview nodes.
 *
 * No Redux updates, backend calls or persistence.
 */
export function buildLocalContentPreview(
  draft: EditorDraft,
  protectedEntries: readonly ProtectedMenuEntry[],
  policy: Readonly<MenuPlacementPolicy>,
  inventory: Readonly<TrustedMenuInventory>,
): LocalContentPreviewResult {
  if (
    validateEditorDraft(
      draft,
      protectedEntries,
      policy,
      inventory,
    ).length > 0
  ) {
    return {
      ok: false,
      reason: "INVALID_DRAFT",
    };
  }

  const contentEntries = draft.entries.filter(
    entry => entry.source === "content",
  );

  const byId = new Map<string, EditorMenuEntry>(
    contentEntries.map(entry => [entry.id, entry]),
  );

  function buildNode(entry: EditorMenuEntry): LocalContentPreviewNode {
    const children = contentEntries
      .filter(child => child.parentId === entry.id)
      .sort((a, b) => a.position - b.position)
      .map(buildNode);

    return {
      id: entry.id,
      parentId: entry.parentId!,
      caption: entry.caption,
      position: entry.position,
      contentPageId: entry.contentPageId,
      children,
    };
  }

  const roots = contentEntries
    .filter(entry => !byId.has(entry.parentId ?? ""))
    .sort((a, b) => a.position - b.position)
    .map(buildNode);

  return {
    ok: true,
    roots,
  };
}