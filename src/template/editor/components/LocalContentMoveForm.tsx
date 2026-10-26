import React, { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";

import { useApplicationConfig } from "@/template/application/ApplicationConfigContext";
import { ThemedText } from "@/template/components/design-system/themed/ThemedText";
import { ActionButton } from "@/template/components/design-system/ui-elements/ActionButton";
import { selectEffectiveRoles } from "@/template/state/authorization/authorizationSlice";
import { useAppSelector } from "@/template/state/store/useAppSelector";

import { createRuntimeMenuSnapshot } from "../adapters/createRuntimeMenuSnapshot";
import { canEditLocalContent } from "../authorization/canEditLocalContent";
import { useSharedLocalEditorDraft } from "../context/LocalEditorDraftContext";
import { getAllowedContentParents } from "../utils/getAllowedContentParents";
import { moveContentMenuToParent } from "../utils/moveContentMenuToParent";
import { validateEditorDraft } from "../validation/validateEditorDraft";

interface Props {
  entryId: string;
  onClose: () => void;
}

/**
 * Moves a local content entry to another permitted parent.
 * Saving remains the responsibility of the shared draft hook.
 */
export function LocalContentMoveForm({
  entryId,
  onClose,
}: Props) {
  const { id: applicationId, navigation } = useApplicationConfig();
  const effectiveRoles = useAppSelector(selectEffectiveRoles);
  const canEdit = canEditLocalContent(effectiveRoles);

  const { draft, setDraft, status, storageError } =
    useSharedLocalEditorDraft();

  const [targetParentId, setTargetParentId] = useState("");
  const [moveError, setMoveError] = useState("");

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
  const currentParent = draft.entries.find(
    item => item.id === entry?.parentId,
  );

  const editorReady =
    status === "ready" || status === "saving";

  const existingErrors = validateEditorDraft(
    draft,
    snapshot.protectedEntries,
    placementPolicy,
    snapshot.inventory,
  );

  const editable =
    canEdit &&
    editorReady &&
    existingErrors.length === 0 &&
    draft.applicationId === applicationId &&
    entry?.source === "content";

  const allowedParents = getAllowedContentParents(
    draft.entries,
    placementPolicy,
    snapshot.protectedEntries,
    snapshot.inventory,
  );

  const moveTargets =
    entry?.source === "content" && existingErrors.length === 0
      ? allowedParents.filter(
          parent =>
            parent.id !== entry.parentId &&
            moveContentMenuToParent(
              draft,
              placementPolicy,
              snapshot.protectedEntries,
              snapshot.inventory,
              entry.id,
              parent.id,
            ).ok,
        )
      : [];

  function confirmMove() {
    setMoveError("");

    if (!editable) {
      setMoveError(
        "Der Entwurf kann momentan nicht bearbeitet werden.",
      );
      return;
    }

    if (!moveTargets.some(parent => parent.id === targetParentId)) {
      setMoveError("Dieses Zielmenü ist nicht erlaubt.");
      return;
    }

    const result = moveContentMenuToParent(
      draft,
      placementPolicy,
      snapshot.protectedEntries,
      snapshot.inventory,
      entryId,
      targetParentId,
    );

    if (!result.ok) {
      setMoveError(`Verschieben fehlgeschlagen: ${result.reason}`);
      return;
    }

    const nextErrors = validateEditorDraft(
      result.draft,
      snapshot.protectedEntries,
      placementPolicy,
      snapshot.inventory,
    );

    if (nextErrors.length > 0) {
      setMoveError(
        "Die Änderung verletzt die Entwurfsregeln.",
      );
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

      <ThemedText style={{ fontWeight: "600" }}>
        Aktueller Ordner
      </ThemedText>

      <ThemedText>
        {currentParent?.caption ?? "Nicht gefunden"}
      </ThemedText>

      <ThemedText style={{ fontWeight: "600" }}>
        Neuer übergeordneter Ordner
      </ThemedText>

      <ScrollView
        style={{ maxHeight: 320 }}
        contentContainerStyle={{ gap: 8 }}
        nestedScrollEnabled
      >
        {moveTargets.map(parent => (
          <ActionButton
            key={parent.id}
            label={
              parent.id === targetParentId
                ? `✓ ${parent.caption}`
                : parent.caption
            }
            variant="secondary"
            disabled={!editable}
            onPress={() => {
              setTargetParentId(parent.id);
              setMoveError("");
            }}
          />
        ))}
      </ScrollView>

      {moveTargets.length === 0 && (
        <ThemedText>
          Kein gültiger anderer Zielordner verfügbar.
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

      {moveError !== "" && (
        <ThemedText>{moveError}</ThemedText>
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
          label="Verschieben"
          variant="secondary"
          disabled={
            !editable ||
            !moveTargets.some(
              parent => parent.id === targetParentId,
            )
          }
          onPress={confirmMove}
        />
      </View>
    </View>
  );
}
