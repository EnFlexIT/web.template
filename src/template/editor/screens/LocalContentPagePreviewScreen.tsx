import React from "react";
import { useStore } from "react-redux";
import type { TemplateRootState } from "@/template/state/store/templateStoreTypes";
import { useAppSelector } from "@/template/state/store/useAppSelector";
import { selectEffectiveRoles } from "@/template/state/authorization/authorizationSlice";
import { canEditLocalContent } from "../authorization/canEditLocalContent";
import { useApplicationConfig } from "@/template/application/ApplicationConfigContext";
import { createRuntimeMenuSnapshot } from "../adapters/createRuntimeMenuSnapshot";
import { saveLocalContentPage } from "../storage/saveLocalContentPage";
import { isLocalContentPreviewEnabled } from "../config/localContentPreviewConfig";
import type { EditorContentPage } from "../model/editorTypes";

import {
  ScrollView,
} from "react-native";

import {
  useRoute,
  type RouteProp,
} from "@react-navigation/native";

import {
  Card,
} from "@/template/components/design-system/ui-elements/Card";

import {
  ThemedText,
} from "@/template/components/design-system/themed/ThemedText";

import {
  useSharedLocalContentPreview,
  useLocalContentLivePage,
} from "../context/LocalContentPreviewContext";

import {
  LocalContentPageInlineEditor,
} from "../components/LocalContentPageInlineEditor";
import {
  LocalContentPageViewer,
} from "../components/LocalContentPageViewer";

import type {
  LocalContentPreviewNode,
} from "../adapters/buildLocalContentPreview";

type PreviewRoute = RouteProp<
  { LocalContentPreview: { pageId?: string } },
  "LocalContentPreview"
>;

function containsPage(
  nodes: readonly LocalContentPreviewNode[],
  pageId: string,
): boolean {
  return nodes.some(node =>
    node.contentPageId === pageId ||
    containsPage(node.children, pageId),
  );
}

/**
 * Development-only read-only page preview.
 * Never publishes content or changes runtime menus.
 */
export function LocalContentPagePreviewScreen() {
  const route = useRoute<PreviewRoute>();

  const preview = useSharedLocalContentPreview();
  const { livePage } = useLocalContentLivePage();
  const { id: applicationId, navigation } = useApplicationConfig();
  const store = useStore();
  const effectiveRoles = useAppSelector(selectEffectiveRoles);
  const canEdit = canEditLocalContent(effectiveRoles);

  const canWrite = () =>
    isLocalContentPreviewEnabled() &&
    canEditLocalContent(
      selectEffectiveRoles(store.getState() as TemplateRootState),
    );

  const savePage = async (
    originalPage: EditorContentPage,
    updatedPage: EditorContentPage,
  ) => {
    if (
      !isLocalContentPreviewEnabled() ||
      !canEdit
    ) {
      return { status: "forbidden" as const };
    }



    const snapshot = createRuntimeMenuSnapshot(applicationId);

    const currentDraft = {
      schemaVersion: 1 as const,
      applicationId,
      entries: snapshot.entries.map(entry => ({ ...entry })),
      pages: [],
    };

    return saveLocalContentPage(
      currentDraft,
      snapshot.protectedEntries,
      {
        allowedContentParentIds:
          navigation.editor?.allowedContentParentIds ?? [],
      },
      snapshot.inventory,
      originalPage,
      updatedPage,
      canWrite,
    );
  };

  const pageId =
    typeof route.params?.pageId === "string"
      ? route.params.pageId
      : undefined;

  if (preview.status === "disabled") {
    return null;
  }

  if (preview.status === "loading") {
    return (
      <Card padding="md">
        <ThemedText>Lokale Inhaltsseite wird geladen …</ThemedText>
      </Card>
    );
  }

  if (preview.status !== "ready" || !pageId) {
    return (
      <Card padding="md">
        <ThemedText>
          Lokale Inhaltsseite nicht verfügbar.
        </ThemedText>
      </Card>
    );
  }

  const isRegisteredPage =
    containsPage(preview.roots, pageId);

  const page = isRegisteredPage
    ? preview.pages.find(item => item.id === pageId)
    : undefined;

  if (!page) {
    return (
      <Card padding="md">
        <ThemedText>
          Lokale Inhaltsseite nicht gefunden.
        </ThemedText>
      </Card>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      {livePage?.id === pageId ? (
        <LocalContentPageViewer page={livePage} />
      ) : (
        <LocalContentPageInlineEditor
          page={page}
          onSave={savePage}
        />
      )}
    </ScrollView>
  );
}