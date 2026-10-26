import type {
  EditorContentPage,
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
  loadLocalEditorDraft,
  saveLocalEditorDraft,
} from "./localEditorDraftStorage";

import {
  restoreLocalEditorDraft,
} from "./restoreLocalEditorDraft";

import {
  enqueueLocalEditorDraftOperation,
} from "./localEditorDraftWriteQueue";

import {
  notifyLocalEditorDraftSaved,
} from "./localEditorDraftEvents";

import {
  updateContentPageInDraft,
} from "../utils/updateContentPageInDraft";

import {
  validateEditorDraft,
} from "../validation/validateEditorDraft";

export type SaveLocalContentPageResult =
  | { status: "saved" }
  | { status: "unchanged" }
  | { status: "not-found" }
  | { status: "conflict" }
  | { status: "invalid" }
  | { status: "no-draft" }
  | { status: "forbidden" };

/**
 * Updates one existing page in the regular local draft.
 *
 * All operations are serialized within the same JS runtime.
 * A conflicting change to the same page is rejected.
 *
 * This is development-only draft persistence.
 * No backend writes or publishing.
 *
 * Cross-tab concurrency is not guaranteed by this function.
 */
export async function saveLocalContentPage(
  currentDraft: EditorDraft,
  protectedEntries: readonly ProtectedMenuEntry[],
  placementPolicy: Readonly<MenuPlacementPolicy>,
  inventory: Readonly<TrustedMenuInventory>,
  originalPage: EditorContentPage,
  updatedPage: EditorContentPage,
  canWrite: () => boolean,
): Promise<SaveLocalContentPageResult> {
  return enqueueLocalEditorDraftOperation(
    currentDraft.applicationId,
    "regular",
    async () => {
      const stored = await loadLocalEditorDraft(
        currentDraft.applicationId,
        "regular",
      );

      if (stored === null) {
        return { status: "no-draft" };
      }

      const restored = restoreLocalEditorDraft(
        stored,
        currentDraft,
        protectedEntries,
        placementPolicy,
        inventory,
      );

      if (restored === null) {
        return { status: "invalid" };
      }

      const registered = restored.entries.some(
        entry =>
          entry.source === "content" &&
          entry.contentPageId === originalPage.id,
      );

      if (!registered) {
        return { status: "not-found" };
      }

      const result = updateContentPageInDraft(
        restored,
        originalPage,
        updatedPage,
      );

      if (!result.ok) {
        return { status: result.reason };
      }

      const errors = validateEditorDraft(
        result.draft,
        protectedEntries,
        placementPolicy,
        inventory,
      );

      if (errors.length > 0) {
        return { status: "invalid" };
      }

      if (!canWrite()) {
        return { status: "forbidden" };
      }

      await saveLocalEditorDraft(
        result.draft,
        "regular",
      );

      notifyLocalEditorDraftSaved({
        applicationId: result.draft.applicationId,
        scope: "regular",
      });

      return { status: "saved" };
    },
  );
}