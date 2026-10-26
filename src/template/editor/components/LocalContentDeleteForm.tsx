import React, { useMemo, useState } from "react";
import { View } from "react-native";

import { useApplicationConfig } from "@/template/application/ApplicationConfigContext";
import { ThemedText } from "@/template/components/design-system/themed/ThemedText";
import { ActionButton } from "@/template/components/design-system/ui-elements/ActionButton";
import { selectEffectiveRoles } from "@/template/state/authorization/authorizationSlice";
import { useAppSelector } from "@/template/state/store/useAppSelector";

import { createRuntimeMenuSnapshot } from "../adapters/createRuntimeMenuSnapshot";
import { canEditLocalContent } from "../authorization/canEditLocalContent";
import { useSharedLocalEditorDraft } from "../context/LocalEditorDraftContext";
import { deleteContentMenuFromDraft } from "../utils/deleteContentMenuFromDraft";
import { validateEditorDraft } from "../validation/validateEditorDraft";

interface Props {
  entryId: string;
  onClose: () => void;
}

/**
 * Deletes a single editable leaf entry from the unpublished draft.
 * Never cascades to child menus or writes to the backend.
 */
export function LocalContentDeleteForm({
  entryId,
  onClose,
}: Props) {
  const { id: applicationId, navigation } = useApplicationConfig();
  const effectiveRoles = useAppSelector(selectEffectiveRoles);
  const canEdit = canEditLocalContent(effectiveRoles);

  const { draft, setDraft, status, storageError } =
    useSharedLocalEditorDraft();

  const [confirmed, setConfirmed] = useState(false);
  const [deleteError, setDeleteError] = useState("");

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

  const hasChildren = draft.entries.some(
    item => item.parentId === entryId,
  );

  const hasSharedPage = Boolean(
    entry?.contentPageId &&
      draft.entries.some(
        item =>
          item.id !== entryId &&
          item.contentPageId === entry.contentPageId,
      ),
  );

  const existingErrors = validateEditorDraft(
    draft,
    snapshot.protectedEntries,
    placementPolicy,
    snapshot.inventory,
  );

  const ready = status === "ready" || status === "saving";

  const editable =
    ready &&
    canEdit &&
    draft.applicationId === applicationId &&
    entry?.source === "content" &&
    !hasChildren &&
    !hasSharedPage &&
    existingErrors.length === 0;

  function confirmDelete() {
    setDeleteError("");

    if (!confirmed || !editable) {
      setDeleteError("Löschen ist momentan nicht möglich.");
      return;
    }

    const result = deleteContentMenuFromDraft(draft, entryId);

    if (!result.ok) {
      setDeleteError(`Löschen fehlgeschlagen: ${result.reason}`);
      setConfirmed(false);
      return;
    }

    const nextErrors = validateEditorDraft(
      result.draft,
      snapshot.protectedEntries,
      placementPolicy,
      snapshot.inventory,
    );

    if (nextErrors.length > 0) {
      setDeleteError("Die Änderung verletzt die Entwurfsregeln.");
      setConfirmed(false);
      return;
    }

    setDraft(result.draft);
    onClose();
  }

  return (
    <View style={{ gap: 16 }}>
      <ThemedText style={{ fontWeight: "600" }}>
        Diesen Eintrag löschen?
      </ThemedText>

      <ThemedText>
        {entry?.caption ?? "Eintrag nicht gefunden"}
      </ThemedText>

      {page ? (
        <ThemedText>
          Die zugehörige Inhaltsseite und ihre Inhaltsblöcke
          werden ebenfalls aus dem lokalen Entwurf entfernt.
        </ThemedText>
      ) : (
        <ThemedText>
          Der Ordner wird aus dem lokalen Entwurf entfernt.
        </ThemedText>
      )}

      {hasChildren && (
        <ThemedText>
          Dieser Ordner enthält weitere Einträge und kann
          nicht gelöscht werden. Entferne oder verschiebe
          zuerst die enthaltenen Einträge.
        </ThemedText>
      )}

      {hasSharedPage && (
        <ThemedText>
          Die zugehörige Inhaltsseite wird gemeinsam verwendet.
          Dieser Eintrag kann deshalb nicht gelöscht werden.
        </ThemedText>
      )}

      {entry && entry.source !== "content" && (
        <ThemedText>
          Dieser Menüeintrag ist geschützt.
        </ThemedText>
      )}

      {status === "loading" && (
        <ThemedText>Lokaler Entwurf wird geladen.</ThemedText>
      )}

      {status === "error" && (
        <ThemedText>
          {storageError || "Fehler beim Laden des Entwurfs."}
        </ThemedText>
      )}

      {existingErrors.length > 0 && (
        <ThemedText>
          Der Entwurf enthält Validierungsfehler.
          Löschen ist deshalb gesperrt.
        </ThemedText>
      )}

      {deleteError !== "" && (
        <ThemedText>{deleteError}</ThemedText>
      )}

      {confirmed && (
        <ThemedText style={{ fontWeight: "600" }}>
          Bestätigung: Der Eintrag wird aus dem
          unveröffentlichten lokalen Entwurf gelöscht.
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

        {!confirmed ? (
          <ActionButton
            label="Löschen vorbereiten"
            variant="secondary"
            disabled={!editable}
            onPress={() => setConfirmed(true)}
          />
        ) : (
          <ActionButton
            label="Ja, löschen"
            variant="primary"
            disabled={!editable}
            onPress={confirmDelete}
          />
        )}
      </View>
    </View>
  );
}
