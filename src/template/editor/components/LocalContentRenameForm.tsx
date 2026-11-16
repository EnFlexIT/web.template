import React, { useMemo, useState } from "react";
import { View } from "react-native";

import { useApplicationConfig } from "@/template/application/ApplicationConfigContext";
import { ThemedText } from "@/template/components/design-system/themed/ThemedText";
import { ActionButton } from "@/template/components/design-system/ui-elements/ActionButton";
import { TextInput } from "@/template/components/design-system/ui-elements/TextInput";
import { selectVerifiedBackendRoles as selectEffectiveRoles } from "@/template/state/authorization/selectVerifiedBackendRoles";
import { useAppSelector } from "@/template/state/store/useAppSelector";

import { createRuntimeMenuSnapshot } from "../adapters/createRuntimeMenuSnapshot";
import { canEditLocalContent } from "../authorization/canEditLocalContent";
import { useSharedLocalEditorDraft } from "../context/LocalEditorDraftContext";
import { renameContentMenuInDraft } from "../utils/renameContentMenuInDraft";
import { validateEditorDraft } from "../validation/validateEditorDraft";

interface Props {
  entryId: string;
  onClose: () => void;
}

/**
 * Renames an editable content menu in the shared regular draft.
 * Does not modify a content page title or publish changes.
 */
export function LocalContentRenameForm({
  entryId,
  onClose,
}: Props) {
  const { id: applicationId, navigation } = useApplicationConfig();
  const effectiveRoles = useAppSelector(selectEffectiveRoles);
  const canEdit = canEditLocalContent(effectiveRoles);

  const { draft, setDraft, status, storageError } =
    useSharedLocalEditorDraft();

  const entry = draft.entries.find(item => item.id === entryId);

  const [renameTitle, setRenameTitle] = useState(
    () => entry?.caption ?? "",
  );
  const [renameError, setRenameError] = useState("");

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

  const editorReady = status === "ready" || status === "saving";
  const editable =
    canEdit &&
    editorReady &&
    draft.applicationId === applicationId &&
    entry?.source === "content";

  function renameMenu() {
    setRenameError("");

    if (!editable) {
      setRenameError("Dieses Menü kann momentan nicht bearbeitet werden.");
      return;
    }

    const existingErrors = validateEditorDraft(
      draft,
      snapshot.protectedEntries,
      placementPolicy,
      snapshot.inventory,
    );

    if (existingErrors.length > 0) {
      setRenameError("Der aktuelle Entwurf enthält Validierungsfehler.");
      return;
    }

    const result = renameContentMenuInDraft(
      draft,
      entryId,
      renameTitle,
    );

    if (!result.ok) {
      setRenameError(`Umbenennen fehlgeschlagen: ${result.reason}`);
      return;
    }

    const nextErrors = validateEditorDraft(
      result.draft,
      snapshot.protectedEntries,
      placementPolicy,
      snapshot.inventory,
    );

    if (nextErrors.length > 0) {
      setRenameError("Die Änderung verletzt die Entwurfsregeln.");
      return;
    }

    setDraft(result.draft);
    onClose();
  }

  return (
    <View style={{ gap: 16 }}>
      <ThemedText style={{ fontWeight: "600" }}>
        Ausgewählter Eintrag
      </ThemedText>

      <ThemedText>
        {entry?.caption ?? "Eintrag nicht gefunden"}
      </ThemedText>

      <TextInput
        label="Neuer Menüname"
        value={renameTitle}
        onChangeText={setRenameTitle}
        placeholder="Menüname eingeben"
      />

      {status === "loading" && (
        <ThemedText>Lokaler Entwurf wird geladen.</ThemedText>
      )}

      {status === "error" && (
        <ThemedText>
          {storageError || "Fehler beim Laden des Entwurfs."}
        </ThemedText>
      )}

      {entry && entry.source !== "content" && (
        <ThemedText>
          Dieser Menüeintrag ist geschützt.
        </ThemedText>
      )}

      {renameError !== "" && (
        <ThemedText>{renameError}</ThemedText>
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
          label="Speichern"
          variant="primary"
          disabled={
            !editable ||
            !renameTitle.trim() ||
            renameTitle.trim() === entry?.caption
          }
          onPress={renameMenu}
        />
      </View>
    </View>
  );
}
