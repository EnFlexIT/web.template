import React, { useMemo, type ReactNode } from "react";

import {
  useApplicationConfig,
} from "@/template/application/ApplicationConfigContext";

import {
  createRuntimeMenuSnapshot,
} from "../adapters/createRuntimeMenuSnapshot";

import type { EditorDraft } from "../model/editorTypes";
import type { MenuPlacementPolicy } from "../model/menuPlacement";

import { LocalEditorDraftProvider } from "./LocalEditorDraftContext";

/**
 * Provides the single regular local editor draft.
 *
 * Mount this once above both editor surfaces.
 * The separate preview scope remains independent.
 */
export function RegularLocalEditorDraftProvider({
  children,
}: {
  children: ReactNode;
}) {
  const {
    id: applicationId,
    navigation,
  } = useApplicationConfig();

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

  const placementPolicy = useMemo<MenuPlacementPolicy>(
    () => ({
      allowedContentParentIds:
        navigation.editor?.allowedContentParentIds ?? [],
    }),
    [navigation.editor],
  );

  return (
    <LocalEditorDraftProvider
      storageScope="regular"
      initialDraft={initialDraft}
      protectedEntries={snapshot.protectedEntries}
      placementPolicy={placementPolicy}
      inventory={snapshot.inventory}
    >
      {children}
    </LocalEditorDraftProvider>
  );
}
