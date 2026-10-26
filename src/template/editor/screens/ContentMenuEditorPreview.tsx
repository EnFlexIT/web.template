import React, { useMemo } from "react";

import {
  ContentMenuEditorScreen,
} from "./ContentMenuEditorScreen";

import {
  createRuntimeMenuSnapshot,
} from "../adapters/createRuntimeMenuSnapshot";

import type {
  EditorDraft,
} from "../model/editorTypes";

/**
 * Local development preview.
 *
 * Reads the registered menu configuration.
 * Does not modify production navigation or APIs.
 */
export function ContentMenuEditorPreview({
  applicationId,
}: {
  applicationId: string;
}) {
  const snapshot = useMemo(
    () => createRuntimeMenuSnapshot(applicationId),
    [applicationId],
  );

  const initialDraft = useMemo<EditorDraft>(
    () => ({
      schemaVersion: 1,
      applicationId,
      entries: snapshot.entries.map(entry => ({ ...entry })),
      pages: [],
    }),
    [applicationId, snapshot],
  );

  const placementPolicy = useMemo(
    () => ({
      allowedContentParentIds:
        snapshot.inventory.staticMenuIds.includes("static:3900")
          ? ["static:3900"]
          : [],
    }),
    [snapshot],
  );

  return (
    <ContentMenuEditorScreen
      initialDraft={initialDraft}
      protectedEntries={snapshot.protectedEntries}
      inventory={snapshot.inventory}
      placementPolicy={placementPolicy}
    />
  );
}
