import {
  BackendMenuContentScreenV2,
} from "./BackendMenuContentScreenV2";

import {
  useAppSelector,
} from "@/template/state/store/useAppSelector";

import {
  selectBackendContentWriteContext,
} from "../adapters/updateBackendContentElementFromStore";
import { selectCanEditInUiPreview } from "@/template/state/authorization/selectUiPreviewMode";

import {
  ThemedText,
} from "@/template/components/design-system/themed/ThemedText";
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
      backendMenuId?: number;
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

  const canOpenBackendEditor = useAppSelector(state => {
    const context = selectBackendContentWriteContext(state);

    return (
      state.backendRoles.status === "ready" &&
      selectCanEditInUiPreview(state) &&
      context.isLoggedIn &&
      context.canEdit &&
      !context.isSwitchingServer &&
      !context.isLoggingOut &&
      context.server.trim().length > 0
    );
  });
  const route = useRoute<EditorRoute>();
  const backendMenuId = route.params?.backendMenuId;
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

  if (backendMenuId !== undefined) {
    if (
      !Number.isSafeInteger(backendMenuId) ||
      backendMenuId <= 0
    ) {
      return (
        <ThemedText>
          Ungueltige Backend-Menue-ID.
        </ThemedText>
      );
    }

    if (!canOpenBackendEditor) {
      return (
        <ThemedText>
          Backend-Editor nicht freigegeben.
          Bitte Anmeldung und Backend-Berechtigungen pruefen.
        </ThemedText>
      );
    }

    return (
      <BackendMenuContentScreenV2
        menuId={backendMenuId}
      />
    );
  }

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