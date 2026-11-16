import React, { useMemo, useState } from "react";
import { View } from "react-native";

import {
  useApplicationConfig,
} from "@/template/application/ApplicationConfigContext";
import { ThemedText } from "@/template/components/design-system/themed/ThemedText";
import { ActionButton } from "@/template/components/design-system/ui-elements/ActionButton";
import { TextInput } from "@/template/components/design-system/ui-elements/TextInput";
import { selectVerifiedBackendRoles as selectEffectiveRoles } from "@/template/state/authorization/selectVerifiedBackendRoles";
import { useAppSelector } from "@/template/state/store/useAppSelector";

import { createRuntimeMenuSnapshot } from "../adapters/createRuntimeMenuSnapshot";
import { canEditLocalContent } from "../authorization/canEditLocalContent";
import { useSharedLocalEditorDraft } from "../context/LocalEditorDraftContext";
import { addContentPageToDraft } from "../utils/addContentPageToDraft";
import { getAllowedContentParents } from "../utils/getAllowedContentParents";
import { validateEditorDraft } from "../validation/validateEditorDraft";

interface LocalContentPageCreateFormProps {
  parentId: string;
  onClose: () => void;
}

/**
 * Creates a content page in the shared, unpublished regular draft.
 * Persistence is handled exclusively by useLocalEditorDraft.
 */
export function LocalContentPageCreateForm({
  parentId,
  onClose,
}: LocalContentPageCreateFormProps) {
  const { id: applicationId, navigation } = useApplicationConfig();
  const effectiveRoles = useAppSelector(selectEffectiveRoles);
  const canEdit = canEditLocalContent(effectiveRoles);

  const { draft, setDraft, status, storageError } =
    useSharedLocalEditorDraft();

  const [pageTitle, setPageTitle] = useState("");
  const [pageError, setPageError] = useState("");

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

  const allowedParents = getAllowedContentParents(
    draft.entries,
    placementPolicy,
    snapshot.protectedEntries,
    snapshot.inventory,
  );

  const parent = allowedParents.find(
    entry => entry.id === parentId,
  );

  const editorReady =
    status === "ready" || status === "saving";

  function createPage() {
    setPageError("");

    if (!canEdit || !editorReady) {
      setPageError(
        "Der Entwurf kann momentan nicht bearbeitet werden.",
      );
      return;
    }

    if (draft.applicationId !== applicationId) {
      setPageError("Der Entwurf gehört zu einer anderen Anwendung.");
      return;
    }

    if (!parent) {
      setPageError("Unter diesem Menü darf keine Inhaltsseite erstellt werden.");
      return;
    }

    const existingErrors = validateEditorDraft(
      draft,
      snapshot.protectedEntries,
      placementPolicy,
      snapshot.inventory,
    );

    if (existingErrors.length > 0) {
      setPageError(
        "Der aktuelle Entwurf enthält ungültige Einträge.",
      );
      return;
    }

    const usedIds = new Set([
      ...draft.entries.map(entry => entry.id),
      ...draft.pages.map(page => page.id),
    ]);

    let next = 1;

    while (
      usedIds.has(`content:local-${next}`) ||
      usedIds.has(`page:local-${next}`)
    ) {
      next++;
    }

    const result = addContentPageToDraft(
      draft,
      placementPolicy,
      snapshot.protectedEntries,
      snapshot.inventory,
      parentId,
      pageTitle,
      `content:local-${next}`,
      `page:local-${next}`,
    );

    if (!result.ok) {
      setPageError(
        `Seite konnte nicht erstellt werden: ${result.reason}`,
      );
      return;
    }

    const nextErrors = validateEditorDraft(
      result.draft,
      snapshot.protectedEntries,
      placementPolicy,
      snapshot.inventory,
    );

    if (nextErrors.length > 0) {
      setPageError(
        "Das neue Menü verletzt die Entwurfsregeln.",
      );
      return;
    }

    setDraft(result.draft);
    setPageTitle("");
    onClose();
  }

  return (
    <View style={{ gap: 16 }}>
      <ThemedText style={{ fontWeight: "600" }}>
        Übergeordnetes Menü
      </ThemedText>

      <ThemedText>
        {parent?.caption ?? "Kein erlaubter Elternordner"}
      </ThemedText>

      <TextInput
        label="Seitentitel"
        value={pageTitle}
        onChangeText={setPageTitle}
        placeholder="Zum Beispiel: Projektübersicht"
      />

      {status === "loading" && (
        <ThemedText>
          Lokaler Entwurf wird geladen.
        </ThemedText>
      )}

      {status === "error" && (
        <ThemedText>
          {storageError || "Fehler beim Laden des Entwurfs."}
        </ThemedText>
      )}

      {pageError !== "" && (
        <ThemedText>{pageError}</ThemedText>
      )}

      {!canEdit && (
        <ThemedText>
          Für diese Aktion fehlen die Bearbeitungsrechte.
        </ThemedText>
      )}

      <View
        style={{
          flexDirection: "row",
          justifyContent: "flex-end",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <ActionButton
          label="Abbrechen"
          onPress={onClose}
        />
        <ActionButton
          label="Hinzufügen"
          variant="secondary"
          disabled={
            !canEdit ||
            !editorReady ||
            !pageTitle.trim() ||
            !parent ||
            draft.applicationId !== applicationId
          }
          onPress={createPage}
        />
      </View>
    </View>
  );
}
