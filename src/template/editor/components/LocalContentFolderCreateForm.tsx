import React, { useMemo, useState } from "react";
import { View } from "react-native";

import {
  useApplicationConfig,
} from "@/template/application/ApplicationConfigContext";
import { ThemedText } from "@/template/components/design-system/themed/ThemedText";
import { ActionButton } from "@/template/components/design-system/ui-elements/ActionButton";
import { TextInput } from "@/template/components/design-system/ui-elements/TextInput";
import { selectVerifiedBackendRoles as selectEffectiveRoles } from "@/template/state/authorization/selectVerifiedBackendRoles";
import { selectAvailableGroupRoles } from "@/template/state/authorization/selectGroupMenuRole";
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
  const availableGroupRoles = useAppSelector(selectAvailableGroupRoles);

  const { draft, setDraft, status, storageError } =
    useSharedLocalEditorDraft();

  const [folderTitle, setFolderTitle] = useState("");
  const [folderError, setFolderError] = useState("");
  const [visibilityMode, setVisibilityMode] = useState<"public" | "groups">("public");
  const [selectedGroupRoles, setSelectedGroupRoles] = useState<string[]>([]);

  const validSelectedRoles = selectedGroupRoles.filter(
    role => availableGroupRoles.includes(role),
  );

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

    if (visibilityMode === "groups" && validSelectedRoles.length === 0) {
      setFolderError("Bitte mindestens eine verfügbare Gruppenrolle auswählen.");
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

    const preparedDraft = {
      ...result.draft,
      entries: result.draft.entries.map(entry =>
        entry.id === result.entryId
          ? {
              ...entry,
              groupRoles:
                visibilityMode === "public"
                  ? []
                  : validSelectedRoles,
            }
          : entry,
      ),
    };

    const nextErrors = validateEditorDraft(
      preparedDraft,
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

    setDraft(preparedDraft);
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

      <ThemedText style={{ fontWeight: "600" }}>
        Menüsichtbarkeit
      </ThemedText>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <ActionButton
          label={visibilityMode === "public" ? "Öffentlich (ausgewählt)" : "Öffentlich"}
          onPress={() => setVisibilityMode("public")}
        />
        <ActionButton
          label={visibilityMode === "groups" ? "Gruppen (ausgewählt)" : "Bestimmte Gruppen"}
          disabled={availableGroupRoles.length === 0}
          onPress={() => setVisibilityMode("groups")}
        />
      </View>

      {availableGroupRoles.length === 0 && (
        <ThemedText>
          Die Gruppenauswahl ist verfügbar, sobald die zugewiesenen Gruppenrollen
          vom Backend geladen wurden. Öffentliche Menüs sind bereits möglich.
        </ThemedText>
      )}

      {visibilityMode === "groups" && (
        <View style={{ gap: 8 }}>
          <ThemedText>
            Gruppenrollen auswählen:
          </ThemedText>
          {availableGroupRoles.map(role => {
            const selected = validSelectedRoles.includes(role);

            return (
              <ActionButton
                key={role}
                label={selected ? `${role} (ausgewählt)` : role}
                onPress={() => setSelectedGroupRoles(previous =>
                  previous.includes(role)
                    ? previous.filter(value => value !== role)
                    : [...previous, role],
                )}
              />
            );
          })}
        </View>
      )}
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
            (visibilityMode === "groups" && validSelectedRoles.length === 0) ||
            !parent ||
            draft.applicationId !== applicationId
          }
          onPress={createFolder}
        />
      </View>
    </View>
  );
}
