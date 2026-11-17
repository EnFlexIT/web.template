import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, View } from "react-native";

import { useApplicationConfig } from "@/template/application/ApplicationConfigContext";
import { ThemedText } from "@/template/components/design-system/themed/ThemedText";
import { ActionButton } from "@/template/components/design-system/ui-elements/ActionButton";
import { selectVerifiedBackendRoles as selectEffectiveRoles } from "@/template/state/authorization/selectVerifiedBackendRoles";
import { useAppSelector } from "@/template/state/store/useAppSelector";

import { createRuntimeMenuSnapshot } from "../adapters/createRuntimeMenuSnapshot";
import { canEditLocalContent } from "../authorization/canEditLocalContent";
import { useSharedLocalEditorDraft } from "../context/LocalEditorDraftContext";
import { useLocalContentEditorPanel } from "../context/LocalContentEditorPanelContext";
import {
  useLocalContentLivePage,
} from "../context/LocalContentPreviewContext";
import type { EditorContentPage } from "../model/editorTypes";
import {
  updateTextBlockInDraft,
} from "../utils/textBlockDraft";
import { validateEditorDraft } from "../validation/validateEditorDraft";
import { ContentPagePanel } from "./ContentPagePanel";

interface Props {
  entryId: string;
  onClose: () => void;
}

function copyPage(page: EditorContentPage): EditorContentPage {
  return {
    ...page,
    blocks: page.blocks.map(block => ({ ...block })),
  };
}

export function LocalContentPageEditForm({
  entryId,
  onClose,
}: Props) {
  const { id: applicationId, navigation } = useApplicationConfig();
  const effectiveRoles = useAppSelector(selectEffectiveRoles);
  const canEdit = canEditLocalContent(effectiveRoles);

  const { draft, setDraft, status, storageError } =
    useSharedLocalEditorDraft();
  const { setLivePage } = useLocalContentLivePage();
  const { setUnsavedChanges } = useLocalContentEditorPanel();

  const [workingPage, setWorkingPage] =
    useState<EditorContentPage | null>(null);

  const [baselinePage, setBaselinePage] =
    useState<EditorContentPage | null>(null);

  const [editError, setEditError] = useState("");
  const [editorResetVersion, setEditorResetVersion] = useState(0);

  useEffect(() => {
    if (workingPage) {
      setLivePage(copyPage(workingPage));
    }
  }, [workingPage, setLivePage]);

  useEffect(() => {
    return () => setLivePage(null);
  }, [setLivePage]);

  const snapshot = useMemo(
    () => createRuntimeMenuSnapshot(applicationId),
    [applicationId],
  );

  const placementPolicy = useMemo(
    () => ({
      allowedContentParentIds:
        navigation.editor?.allowedContentParentIds ?? [],
    }),
    [navigation.editor],
  );

  const entry = draft.entries.find(item => item.id === entryId);
  const page = draft.pages.find(
    item => item.id === entry?.contentPageId,
  );

  const ready = status === "ready" || status === "saving";

  useEffect(() => {
    if (!ready || !page || baselinePage !== null) return;

    setBaselinePage(copyPage(page));
    setWorkingPage(copyPage(page));
  }, [ready, page, baselinePage]);

  const existingErrors = validateEditorDraft(
    draft,
    snapshot.protectedEntries,
    placementPolicy,
    snapshot.inventory,
  );

  const editable =
    ready &&
    canEdit &&
    draft.applicationId === applicationId &&
    entry?.source === "content" &&
    Boolean(entry.contentPageId) &&
    Boolean(page) &&
    existingErrors.length === 0;

  const dirty =
    baselinePage !== null &&
    workingPage !== null &&
    JSON.stringify(baselinePage) !== JSON.stringify(workingPage);

  useEffect(() => {
    setUnsavedChanges(dirty);
  }, [dirty, setUnsavedChanges]);

  useEffect(() => {
    return () => setUnsavedChanges(false);
  }, [setUnsavedChanges]);

  function updatePageTitle(pageId: string, title: string) {
    if (!editable || pageId !== workingPage?.id) return;

    setWorkingPage(previous =>
      previous?.id === pageId
        ? { ...previous, title }
        : previous,
    );
  }

  function addTextBlock(pageId: string) {
    if (!editable || pageId !== workingPage?.id) return;

    setWorkingPage(previous => {
      if (!previous || previous.id !== pageId) return previous;

      const usedIds = new Set(
        draft.pages.flatMap(item =>
          item.blocks.map(block => block.id),
        ),
      );

      for (const block of previous.blocks) {
        usedIds.add(block.id);
      }

      let next = 1;

      while (usedIds.has(`block:local-${next}`)) {
        next++;
      }

      return {
        ...previous,
        blocks: [
          ...previous.blocks,
          {
            id: `block:local-${next}`,
            type: "text" as const,
            html: "<p></p>",
          },
        ],
      };
    });
  }
  function updateTextBlock(
    pageId: string,
    blockId: string,
    html: string,
  ) {
    if (!editable || pageId !== workingPage?.id) return;

    setWorkingPage(previous => {
      if (!previous || previous.id !== pageId) return previous;

      const temporaryDraft = {
        ...draft,
        pages: draft.pages.map(item =>
          item.id === previous.id ? previous : item,
        ),
      };

      const result = updateTextBlockInDraft(
        temporaryDraft,
        pageId,
        blockId,
        html,
      );

      return result.ok
        ? result.draft.pages.find(item => item.id === pageId) ?? previous
        : previous;
    });
  }

  function deleteTextBlock(pageId: string, blockId: string) {
    if (!editable || pageId !== workingPage?.id) return;

    setWorkingPage(previous => {
      if (!previous || previous.id !== pageId) return previous;

      const selected = previous.blocks.find(
        block => block.id === blockId,
      );

      if (!selected || selected.type !== "text") {
        return previous;
      }

      return {
        ...previous,
        blocks: previous.blocks.filter(
          block => block.id !== blockId,
        ),
      };
    });
  }
  function discardChanges() {
    if (!baselinePage) return;

    setWorkingPage(copyPage(baselinePage));
    setEditorResetVersion(previous => previous + 1);
    setEditError("");
  }

  function applyChanges() {
    setEditError("");

    if (!canEdit) {
      setEditError("Die Bearbeitungsrechte fehlen.");
      return;
    }

    if (!ready) {
      setEditError(
        `Der lokale Entwurf ist nicht bereit (Status: ${status}).`,
      );
      return;
    }

    if (draft.applicationId !== applicationId) {
      setEditError("Der Entwurf gehört zu einer anderen Anwendung.");
      return;
    }

    if (!entry || entry.source !== "content" || !entry.contentPageId) {
      setEditError("Der Menüeintrag ist keine bearbeitbare Inhaltsseite.");
      return;
    }

    if (!page || !workingPage || !baselinePage) {
      setEditError("Die Inhaltsseite ist nicht vollständig geladen.");
      return;
    }

    if (existingErrors.length > 0) {
      setEditError("Der bestehende Entwurf enthält Validierungsfehler.");
      return;
    }

    if (!dirty) {
      setEditError("Es gibt keine Änderungen zum Übernehmen.");
      return;
    }

    if (JSON.stringify(page) !== JSON.stringify(baselinePage)) {
      setEditError(
        "Die gespeicherte Seite wurde zwischenzeitlich geändert. " +
        "Bitte prüfe die Änderungen, bevor du fortfährst.",
      );
      return;
    }

    const nextDraft = {
      ...draft,
      pages: draft.pages.map(item =>
        item.id === workingPage.id
          ? copyPage(workingPage)
          : item,
      ),
    };

    const errors = validateEditorDraft(
      nextDraft,
      snapshot.protectedEntries,
      placementPolicy,
      snapshot.inventory,
    );

    if (errors.length > 0) {
      setEditError(
        "Die Änderungen verletzen die Entwurfsregeln.",
      );
      return;
    }

    setDraft(nextDraft);
    setBaselinePage(copyPage(workingPage));
  }

  return (
    <View style={{ gap: 16 }}>
      {status === "loading" && (
        <ThemedText>Lokaler Entwurf wird geladen.</ThemedText>
      )}

      {status === "error" && (
        <ThemedText>
          {storageError || "Fehler beim lokalen Entwurf."}
        </ThemedText>
      )}

      {!entry && (
        <ThemedText>Menüeintrag nicht gefunden.</ThemedText>
      )}

      {entry?.source === "content" && !entry.contentPageId && (
        <ThemedText>
          Dieser Ordner besitzt keine eigene Inhaltsseite.
        </ThemedText>
      )}

      {!canEdit && (
        <ThemedText>Bearbeitungsrechte fehlen.</ThemedText>
      )}

      {existingErrors.length > 0 && (
        <ThemedText>
          Die Bearbeitung ist wegen Validierungsfehlern gesperrt.
        </ThemedText>
      )}

      {editable && workingPage && entry && (
        <ScrollView
          style={{ maxHeight: 620 }}
          contentContainerStyle={{ paddingBottom: 12 }}
          nestedScrollEnabled
        >
          <ContentPagePanel
            key={`${workingPage.id}:${editorResetVersion}`}
            selectedEntry={entry}
            page={workingPage}
            onTitleChange={updatePageTitle}
            onAddTextBlock={addTextBlock}
            onDeleteTextBlock={deleteTextBlock}
            onTextBlockChange={updateTextBlock}
          />
        </ScrollView>
      )}

      {dirty && (
        <ThemedText style={{ fontWeight: "600" }}>
          Nicht übernommene Änderungen
        </ThemedText>
      )}

      {editError !== "" && (
        <ThemedText>{editError}</ThemedText>
      )}

      <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>
        Eingaben bleiben zunächst im Bearbeitungsentwurf.
        Erst „Änderungen übernehmen“ startet die lokale Speicherung.
      </ThemedText>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "flex-end",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <ActionButton
          label="Verwerfen"
          variant="secondary"
          disabled={!dirty}
          onPress={discardChanges}
        />
        <ActionButton
          label="Änderungen übernehmen"
          variant="primary"
          disabled={!editable || !dirty}
          onPress={applyChanges}
        />
      </View>
    </View>
  );
}
