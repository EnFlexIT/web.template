import type {
  EditorDraft,
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

import {
  isStoredContentEntry,
  isStoredContentPage,
} from "./storedDraftGuards";

/**
 * Restores validated local content entries and pages.
 *
 * Static navigation always comes from the current
 * trusted runtime snapshot.
 */
export function restoreLocalEditorDraft(
  stored: unknown,
  currentDraft: EditorDraft,
  protectedEntries: readonly ProtectedMenuEntry[],
  placementPolicy: Readonly<MenuPlacementPolicy>,
  inventory: Readonly<TrustedMenuInventory>,
): EditorDraft | null {
  if (
    stored === null ||
    typeof stored !== "object" ||
    Array.isArray(stored)
  ) {
    return null;
  }

  const data = stored as Record<string, unknown>;

  if (
    data.schemaVersion !== 1 ||
    data.applicationId !== currentDraft.applicationId ||
    !Array.isArray(data.entries) ||
    !Array.isArray(data.pages)
  ) {
    return null;
  }

  // Ignore stored static-menu values, but require
  // every stored entry to be an object.
  if (
    !data.entries.every(
      entry =>
        entry !== null &&
        typeof entry === "object" &&
        !Array.isArray(entry),
    )
  ) {
    return null;
  }

  const contentEntries = data.entries.filter(
    entry =>
      (entry as Record<string, unknown>).source === "content",
  );

  if (
    !contentEntries.every(isStoredContentEntry) ||
    !data.pages.every(isStoredContentPage)
  ) {
    return null;
  }

  const candidate: EditorDraft = {
    schemaVersion: 1,
    applicationId: currentDraft.applicationId,
    entries: [
      ...currentDraft.entries.map(entry => ({ ...entry })),
      ...contentEntries.map(entry => ({ ...entry })),
    ],
    pages: data.pages.map(page => ({
      ...page,
      blocks: page.blocks.map(block => ({ ...block })),
    })),
  };

  const errors = validateEditorDraft(
    candidate,
    protectedEntries,
    placementPolicy,
    inventory,
  );

  return errors.length === 0 ? candidate : null;
}
