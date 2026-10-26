import React, { useMemo, useState } from "react";
import { View } from "react-native";

import {
  useApplicationConfig,
} from "@/template/application/ApplicationConfigContext";
import { ThemedText } from "@/template/components/design-system/themed/ThemedText";
import { ActionButton } from "@/template/components/design-system/ui-elements/ActionButton";
import { TextInput } from "@/template/components/design-system/ui-elements/TextInput";
import { selectEffectiveRoles } from "@/template/state/authorization/authorizationSlice";
import { useAppSelector } from "@/template/state/store/useAppSelector";

import { createRuntimeMenuSnapshot } from "../adapters/createRuntimeMenuSnapshot";
import { canEditLocalContent } from "../authorization/canEditLocalContent";
import { useSharedLocalEditorDraft } from "../context/LocalEditorDraftContext";
import { addContentFolderToDraft } from "../utils/addContentFolderToDraft";
import { getAllowedContentParents } from "../utils/getAllowedContentParents";
import { validateEditorDraft } from "../validation/validateEditorDraft";

interface LocalContentFolderCreateFormProps {
  parentId: string;
  onClose: () => void;
}

/**
 * Creates a folder in the shared, unpublished regular draft.
 * Persistence is handled exclusively by useLocalEditorDraft.
 */
export function LocalContentFolderCreateForm({
  parentId,
  onClose,
}: LocalContentFolderCreateFormProps) {
  const { id: applicationId, navigation } = useApplicationConfig();
  const effectiveRoles = useAppSelector(selectEffectiveRoles);
  const canEdit = canEditLocalContent(effectiveRoles);

  const { draft, setDraft, status, storageError } =
    useSharedLocalEditorDraft();

  const [folderTitle, setFolderTitle] = useState("");
  const [folderError, setFolderError] = useState("");

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

  function createFolder() {
    setFolderError("");

    if (!canEdit || !editorReady) {
      setFolderError(
        "Der Entwurf kann momentan nicht bearbeitet werden.",
      );
      return;
    }

    if (draft.applicationId !== applicationId) {
      setFolderError("Der Entwurf gehört zu einer anderen Anwendung.");
      return;
    }

    if (!parent) {
      setFolderError("Dieses übergeordnete Menü ist nicht erlaubt.");
      return;
    }

    const existingErrors = validateEditorDraft(
      draft,
      snapshot.protectedEntries,
      placementPolicy,
      snapshot.inventory,
    );

    if (existingErrors.length > 0) {
      setFolderError(
        "Der aktuelle Entwurf enthält ungültige Einträge.",
      );
      return;
    }

    const usedIds = new Set([
      ...draft.entries.map(entry => entry.id),
      ...draft.pages.map(page => page.id),
    ]);

    let next = 1;

    while (usedIds.has(`content:folder-local-${next}`)) {
      next++;
    }

    const result = addContentFolderToDraft(
      draft,
      placementPolicy,
      snapshot.protectedEntries,
      snapshot.inventory,
      parentId,
      folderTitle,
      `content:folder-local-${next}`,
    );

    if (!result.ok) {
      setFolderError(
        `Menü konnte nicht erstellt werden: ${result.reason}`,
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
      setFolderError(
        "Das neue Menü verletzt die Entwurfsregeln.",
      );
      return;
    }

    setDraft(result.draft);
    setFolderTitle("");
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
        label="Name des Unterordners"
        value={folderTitle}
        onChangeText={setFolderTitle}
        placeholder="Zum Beispiel: Dokumentation"
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

      {folderError !== "" && (
        <ThemedText>{folderError}</ThemedText>
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
            !folderTitle.trim() ||
            !parent ||
            draft.applicationId !== applicationId
          }
          onPress={createFolder}
        />
      </View>
    </View>
  );
}
