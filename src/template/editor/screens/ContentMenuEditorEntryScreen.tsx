import React, {
  useMemo,
} from "react";

import {
  useRoute,
  type RouteProp,
} from "@react-navigation/native";

import {
  useApplicationConfig,
} from "@/template/application/ApplicationConfigContext";

import {
  createRuntimeMenuSnapshot,
} from "../adapters/createRuntimeMenuSnapshot";

import {
  ContentMenuEditorBody,
} from "./ContentMenuEditorScreen";

import type {
  EditorDraft,
} from "../model/editorTypes";

import type {
  MenuPlacementPolicy,
} from "../model/menuPlacement";

/**
 * Regular Template screen entry for the local
 * Content and Menu Editor.
 *
 * Does not publish changes or modify runtime
 * navigation.
 */
type EditorRoute = RouteProp<
  {
    "3027": {
      createMode?: "folder" | "page";
      parentId?: string;
      requestId?: string;
      manageAction?: "rename" | "move" | "delete" | "open";
    } | undefined;
  },
  "3027"
>;

import { useSharedLocalEditorDraft } from "../context/LocalEditorDraftContext";

export function ContentMenuEditorEntryScreen() {
  const draftState = useSharedLocalEditorDraft();
  const route = useRoute<EditorRoute>();
  const createMode = route.params?.createMode;
  const parentId = route.params?.parentId;
  const requestId = route.params?.requestId;
  const manageAction = route.params?.manageAction;

  const {
    id: applicationId,
    navigation,
  } = useApplicationConfig();

  const snapshot = useMemo(
    () =>
      createRuntimeMenuSnapshot(
        applicationId,
      ),
    [applicationId],
  );

  const initialDraft =
    useMemo<EditorDraft>(
      () => ({
        schemaVersion: 1,
        applicationId,
        entries:
          snapshot.entries.map(
            entry => ({
              ...entry,
            }),
          ),
        pages: [],
      }),
      [applicationId, snapshot],
    );

  const placementPolicy =
    useMemo<MenuPlacementPolicy>(
      () => ({
        allowedContentParentIds:
          navigation.editor?.allowedContentParentIds ?? [],
      }),
      [navigation.editor],
    );

  return (
    <ContentMenuEditorBody
      draftState={draftState}
      initialCreateMode={createMode}
      initialParentId={parentId}
      initialCreateRequestId={requestId}
      initialManageAction={manageAction}
      initialDraft={initialDraft}
      protectedEntries={
        snapshot.protectedEntries
      }
      placementPolicy={
        placementPolicy
      }
      inventory={
        snapshot.inventory
      }
    />
  );
}