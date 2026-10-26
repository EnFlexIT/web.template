import type { EditorDraft, EditorContentPage } from "../model/editorTypes";
import type {
  ProtectedMenuEntry,
  TrustedMenuInventory,
} from "../model/menuProtection";
import type { MenuPlacementPolicy } from "../model/menuPlacement";

import { loadLocalEditorDraft } from "../storage/localEditorDraftStorage";
import { restoreLocalEditorDraft } from "../storage/restoreLocalEditorDraft";
import {
  buildLocalContentPreview,
  type LocalContentPreviewNode,
} from "./buildLocalContentPreview";

export type LoadLocalContentPreviewResult =
  | {
      status: "ready";
      roots: LocalContentPreviewNode[];
      pages: EditorContentPage[];
    }
  | { status: "empty"; roots: [] }
  | { status: "invalid"; roots: [] }
  | { status: "error"; roots: [] };

/**
 * Reads a regular local editor draft for preview purposes.
 *
 * Never writes to storage, Redux or the backend.
 */
export async function loadLocalContentPreview(
  currentDraft: EditorDraft,
  protectedEntries: readonly ProtectedMenuEntry[],
  policy: Readonly<MenuPlacementPolicy>,
  inventory: Readonly<TrustedMenuInventory>,
): Promise<LoadLocalContentPreviewResult> {
  try {
    const stored = await loadLocalEditorDraft(
      currentDraft.applicationId,
      "regular",
    );

    if (stored === null) {
      return { status: "empty", roots: [] };
    }

    const restored = restoreLocalEditorDraft(
      stored,
      currentDraft,
      protectedEntries,
      policy,
      inventory,
    );

    if (restored === null) {
      return { status: "invalid", roots: [] };
    }

    const preview = buildLocalContentPreview(
      restored,
      protectedEntries,
      policy,
      inventory,
    );

    if (!preview.ok) {
      return { status: "invalid", roots: [] };
    }

    return {
      status: "ready",
      roots: preview.roots,
      pages: restored.pages.map(page => ({
        ...page,
        blocks: page.blocks.map(block => ({ ...block })),
      })),
    };
  } catch {
    return { status: "error", roots: [] };
  }
}