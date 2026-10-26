import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAppSelector } from "@/template/state/store/useAppSelector";
import { selectEffectiveRoles } from "@/template/state/authorization/authorizationSlice";
import { canEditLocalContent } from "../authorization/canEditLocalContent";
import { ScrollView, View } from "react-native";

import { ThemedText } from "@/template/components/design-system/themed/ThemedText";
import { ActionButton } from "@/template/components/design-system/ui-elements/ActionButton";
import { BaseModal } from "@/template/components/design-system/ui-elements/BaseModal";
import { TextInput } from "@/template/components/design-system/ui-elements/TextInput";

import type { EditorDraft } from "../model/editorTypes";
import type {
  ProtectedMenuEntry,
  TrustedMenuInventory,
} from "../model/menuProtection";
import type { MenuPlacementPolicy } from "../model/menuPlacement";

import { addContentPageToDraft } from "../utils/addContentPageToDraft";
import { addContentFolderToDraft } from "../utils/addContentFolderToDraft";
import { renameContentMenuInDraft } from "../utils/renameContentMenuInDraft";
import { deleteContentMenuFromDraft } from "../utils/deleteContentMenuFromDraft";
import { moveContentMenuInDraft } from "../utils/moveContentMenuInDraft";
import { getAllowedContentParents } from "../utils/getAllowedContentParents";
import { moveContentMenuToParent } from "../utils/moveContentMenuToParent";
import {
  addTextBlockToDraft,
  updateTextBlockInDraft,
} from "../utils/textBlockDraft";
import { validateEditorDraft } from "../validation/validateEditorDraft";
import { useLocalEditorDraft } from "../hooks/useLocalEditorDraft";
import type { EditorStorageScope } from "../storage/localEditorDraftStorage";
import { MenuTreePanel } from "../components/MenuTreePanel";
import { ContentPagePanel } from "../components/ContentPagePanel";

export interface ContentMenuEditorScreenProps {
  initialDraft: EditorDraft;
  protectedEntries: readonly ProtectedMenuEntry[];
  placementPolicy: Readonly<MenuPlacementPolicy>;
  inventory: Readonly<TrustedMenuInventory>;
  storageScope?: EditorStorageScope;
  initialCreateMode?: "folder" | "page";
  initialParentId?: string;
  initialCreateRequestId?: string;
  initialManageAction?: "rename" | "move" | "delete" | "open";
}

/**
 * Local editor only. No API writes, publishing
 * or changes to production navigation.
 */
export function ContentMenuEditorScreen(
  props: ContentMenuEditorScreenProps,
) {
  const draftState = useLocalEditorDraft({
    initialDraft: props.initialDraft,
    protectedEntries: props.protectedEntries,
    placementPolicy: props.placementPolicy,
    inventory: props.inventory,
    storageScope: props.storageScope ?? "preview",
  });

  return (
    <ContentMenuEditorBody
      {...props}
      draftState={draftState}
    />
  );
}

export function ContentMenuEditorBody({
  initialDraft,
  protectedEntries,
  placementPolicy,
  inventory,
  initialCreateMode,
  initialParentId,
  initialCreateRequestId,
  initialManageAction,
  draftState,
}: ContentMenuEditorScreenProps & {
  draftState: ReturnType<typeof useLocalEditorDraft>;
}) {
  const effectiveRoles = useAppSelector(selectEffectiveRoles);
  const canEdit = canEditLocalContent(effectiveRoles);

  const {
    draft,
    setDraft,
    status,
    storageError,
    canRetrySave,
    retrySave,
  } = draftState;

  const editorReady = status === "ready" || status === "saving";

  const [selectedId, setSelectedId] =
    useState<string | undefined>(initialParentId);
  const initialCreateOpened = useRef<string | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<string | undefined>();
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameTitle, setRenameTitle] = useState("");
  const [renameError, setRenameError] = useState("");
  const [folderOpen, setFolderOpen] = useState(false);
  const [folderTitle, setFolderTitle] = useState("");
  const [folderParentId, setFolderParentId] = useState("");
  const [folderError, setFolderError] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newParentId, setNewParentId] = useState("");
  const [createError, setCreateError] = useState("");

  const [moveOpen, setMoveOpen] = useState(false);
  const [moveEntryId, setMoveEntryId] = useState("");
  const [moveParentId, setMoveParentId] = useState("");
  const [moveError, setMoveError] = useState("");

  const allowedParents = useMemo(
    () =>
      getAllowedContentParents(
        draft.entries,
        placementPolicy,
        protectedEntries,
        inventory,
      ),
    [draft.entries, placementPolicy, protectedEntries, inventory],
  );

  const selectedEntry = useMemo(
    () => draft.entries.find(entry => entry.id === selectedId),
    [draft.entries, selectedId],
  );

  const selectedPage = useMemo(
    () => draft.pages.find(
      page => page.id === selectedEntry?.contentPageId,
    ),
    [draft.pages, selectedEntry],
  );

  const errors = useMemo(
    () => validateEditorDraft(
      draft,
      protectedEntries,
      placementPolicy,
      inventory,
    ),
    [draft, protectedEntries, placementPolicy, inventory],
  );

  function openDeleteDialog() {
    if (
      !editorReady ||
      errors.length > 0 ||
      selectedEntry?.source !== "content"
    ) {
      return;
    }

    setDeleteTargetId(selectedEntry.id);
    setDeleteError("");
    setDeleteOpen(true);
  }

  function deleteMenu() {
    if (
      !editorReady ||
      errors.length > 0 ||
      !deleteTargetId
    ) {
      setDeleteError("Loeschen ist momentan nicht moeglich.");
      return;
    }

    const result = deleteContentMenuFromDraft(
      draft,
      deleteTargetId,
    );

    if (!result.ok) {
      setDeleteError(`Loeschen fehlgeschlagen: ${result.reason}`);
      return;
    }

    const nextErrors = validateEditorDraft(
      result.draft,
      protectedEntries,
      placementPolicy,
      inventory,
    );

    if (nextErrors.length > 0) {
      setDeleteError("Die Aenderung verletzt die Entwurfsregeln.");
      return;
    }

    setDraft(result.draft);
    setSelectedId(undefined);
    setDeleteTargetId(undefined);
    setDeleteError("");
    setDeleteOpen(false);
  }
  function openRenameDialog() {
    if (
      !editorReady ||
      errors.length > 0 ||
      selectedEntry?.source !== "content"
    ) {
      return;
    }

    setRenameTitle(selectedEntry.caption);
    setRenameError("");
    setRenameOpen(true);
  }

  function renameMenu() {
    if (
      !editorReady ||
      errors.length > 0 ||
      selectedEntry?.source !== "content"
    ) {
      setRenameError("Dieses Menue kann nicht bearbeitet werden.");
      return;
    }

    const result = renameContentMenuInDraft(
      draft,
      selectedEntry.id,
      renameTitle,
    );

    if (!result.ok) {
      setRenameError(`Umbenennen fehlgeschlagen: ${result.reason}`);
      return;
    }

    const nextErrors = validateEditorDraft(
      result.draft,
      protectedEntries,
      placementPolicy,
      inventory,
    );

    if (nextErrors.length > 0) {
      setRenameError("Die Aenderung verletzt die Entwurfsregeln.");
      return;
    }

    setDraft(result.draft);
    setRenameOpen(false);
    setRenameError("");
  }
  function updatePageTitle(pageId: string, title: string) {
    setDraft(previous => ({
      ...previous,
      pages: previous.pages.map(page =>
        page.id === pageId ? { ...page, title } : page,
      ),
    }));
  }

  function addTextBlock(pageId: string) {
    setDraft(previous => {
      const usedIds = new Set(
        previous.pages.flatMap(page =>
          page.blocks.map(block => block.id),
        ),
      );

      let next = 1;

      while (usedIds.has(`block:local-${next}`)) {
        next++;
      }

      const result = addTextBlockToDraft(
        previous,
        pageId,
        `block:local-${next}`,
      );

      return result.ok ? result.draft : previous;
    });
  }

  function updateTextBlock(
    pageId: string,
    blockId: string,
    html: string,
  ) {
    setDraft(previous => {
      const result = updateTextBlockInDraft(
        previous,
        pageId,
        blockId,
        html,
      );

      return result.ok ? result.draft : previous;
    });
  }

  const canMoveUp =
    editorReady &&
    errors.length === 0 &&
    selectedEntry?.source === "content" &&
    moveContentMenuInDraft(draft, selectedEntry.id, "up").ok;

  const canMoveDown =
    editorReady &&
    errors.length === 0 &&
    selectedEntry?.source === "content" &&
    moveContentMenuInDraft(draft, selectedEntry.id, "down").ok;
  function moveMenu(direction: "up" | "down") {
    if (
      !editorReady ||
      errors.length > 0 ||
      selectedEntry?.source !== "content"
    ) {
      return;
    }

    const result = moveContentMenuInDraft(
      draft,
      selectedEntry.id,
      direction,
    );

    if (!result.ok) return;

    const nextErrors = validateEditorDraft(
      result.draft,
      protectedEntries,
      placementPolicy,
      inventory,
    );

    if (nextErrors.length > 0) return;

    setDraft(result.draft);
  }
  const moveEntry = draft.entries.find(
    entry => entry.id === moveEntryId,
  );

  const moveTargets =
    moveEntry?.source === "content"
      ? allowedParents.filter(
          parent =>
            parent.id !== moveEntry.parentId &&
            moveContentMenuToParent(
              draft,
              placementPolicy,
              protectedEntries,
              inventory,
              moveEntry.id,
              parent.id,
            ).ok,
        )
      : [];

  const canMoveToOtherParent =
    editorReady &&
    errors.length === 0 &&
    selectedEntry?.source === "content" &&
    allowedParents.some(
      parent =>
        parent.id !== selectedEntry.parentId &&
        moveContentMenuToParent(
          draft,
          placementPolicy,
          protectedEntries,
          inventory,
          selectedEntry.id,
          parent.id,
        ).ok,
    );

  function openMoveDialog() {
    if (!canMoveToOtherParent || !selectedEntry) {
      return;
    }

    const targets = allowedParents.filter(
      parent =>
        parent.id !== selectedEntry.parentId &&
        moveContentMenuToParent(
          draft,
          placementPolicy,
          protectedEntries,
          inventory,
          selectedEntry.id,
          parent.id,
        ).ok,
    );

    if (targets.length === 0) {
      return;
    }

    setMoveEntryId(selectedEntry.id);
    setMoveParentId(targets[0].id);
    setMoveError("");
    setMoveOpen(true);
  }

  function confirmMoveToParent() {
    if (!editorReady || errors.length > 0) {
      setMoveError("Der Entwurf kann momentan nicht bearbeitet werden.");
      return;
    }

    if (!moveTargets.some(parent => parent.id === moveParentId)) {
      setMoveError("Dieses Zielmenü ist nicht erlaubt.");
      return;
    }

    const result = moveContentMenuToParent(
      draft,
      placementPolicy,
      protectedEntries,
      inventory,
      moveEntryId,
      moveParentId,
    );

    if (!result.ok) {
      setMoveError(`Verschieben fehlgeschlagen: ${result.reason}`);
      return;
    }

    setDraft(result.draft);
    setSelectedId(moveEntryId);
    setMoveError("");
    setMoveOpen(false);
  }

  function openFolderDialog() {
    if (!editorReady || errors.length > 0 || allowedParents.length === 0) {
      return;
    }

    setFolderTitle("");
    setFolderParentId(
      allowedParents.find(entry => entry.id === selectedId)?.id ??
      allowedParents[0]?.id ??
      "",
    );
    setFolderError("");
    setFolderOpen(true);
  }

  function createFolder() {
    if (!editorReady || errors.length > 0) {
      setFolderError("Der Entwurf kann momentan nicht bearbeitet werden.");
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
      protectedEntries,
      inventory,
      folderParentId,
      folderTitle,
      `content:folder-local-${next}`,
    );

    if (!result.ok) {
      setFolderError(`Menü konnte nicht erstellt werden: ${result.reason}`);
      return;
    }

    const nextErrors = validateEditorDraft(
      result.draft,
      protectedEntries,
      placementPolicy,
      inventory,
    );

    if (nextErrors.length > 0) {
      setFolderError("Das neue Menü verletzt die Entwurfsregeln.");
      return;
    }

    setDraft(result.draft);
    setSelectedId(result.entryId);
    setFolderError("");
    setFolderOpen(false);
  }

  function openCreateDialog() {
    setNewTitle("");
    setNewParentId(
      allowedParents.find(entry => entry.id === selectedId)?.id ??
      allowedParents[0]?.id ??
      "",
    );
    setCreateError("");
    setCreateOpen(true);
  }

  function createPage() {
    if (errors.length > 0) {
      setCreateError(
        "Der aktuelle Entwurf enthält Validierungsfehler.",
      );
      return;
    }

    // IDs are local draft identifiers, not backend IDs.
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
      protectedEntries,
      inventory,
      newParentId,
      newTitle,
      `content:local-${next}`,
      `page:local-${next}`,
    );

    if (!result.ok) {
      setCreateError(`Seite konnte nicht erstellt werden: ${result.reason}`);
      return;
    }

    const nextErrors = validateEditorDraft(
      result.draft,
      protectedEntries,
      placementPolicy,
      inventory,
    );

    if (nextErrors.length > 0) {
      setCreateError(
        "Die neue Seite verletzt die Entwurfsregeln.",
      );
      return;
    }

    setDraft(result.draft);
    setSelectedId(result.entryId);
    setCreateOpen(false);
  }

  const lastManageRequest = useRef<string | null>(null);

  useEffect(() => {
    if (
      initialCreateMode ||
      !initialParentId ||
      !canEdit ||
      !editorReady ||
      !draft.entries.some(entry =>
        entry.id === initialParentId && entry.source === "content"
      )
    ) {
      return;
    }

    const requestKey = initialCreateRequestId ?? "initial";
    const selectionKey = `${requestKey}:${initialParentId}`;

    if (lastManageRequest.current === selectionKey) {
      return;
    }

    lastManageRequest.current = selectionKey;
    setSelectedId(initialParentId);
  }, [
    initialCreateMode,
    initialCreateRequestId,
    initialParentId,
    canEdit,
    editorReady,
    draft.entries,
  ]);
  useEffect(() => {
    const requestKey = initialCreateRequestId ?? "initial";

    if (
      initialCreateOpened.current === requestKey ||
      !initialCreateMode ||
      !canEdit ||
      !editorReady ||
      errors.length > 0 ||
      allowedParents.length === 0
    ) {
      return;
    }

    initialCreateOpened.current = requestKey;

    const allowedParent = allowedParents.find(
      entry => entry.id === initialParentId,
    )?.id;

    if (initialCreateMode === "folder") {
      openFolderDialog();
      if (allowedParent) setFolderParentId(allowedParent);
    } else {
      openCreateDialog();
      if (allowedParent) setNewParentId(allowedParent);
    }
  }, [
    initialCreateMode,
    initialCreateRequestId,
    initialParentId,
    canEdit,
    editorReady,
    errors.length,
    allowedParents,
  ]);

  const lastSidebarActionRequest = useRef<string | null>(null);

  useEffect(() => {
    if (
      !initialManageAction ||
      initialManageAction === "open" ||
      initialCreateMode ||
      !canEdit ||
      !editorReady ||
      errors.length > 0 ||
      !initialParentId ||
      selectedEntry?.id !== initialParentId ||
      selectedEntry.source !== "content"
    ) {
      return;
    }

    const requestKey =
      `${initialCreateRequestId ?? "initial"}:${initialParentId}:${initialManageAction}`;

    if (lastSidebarActionRequest.current === requestKey) {
      return;
    }

    lastSidebarActionRequest.current = requestKey;

    if (initialManageAction === "rename") {
      openRenameDialog();
    } else if (initialManageAction === "move") {
      openMoveDialog();
    } else if (initialManageAction === "delete") {
      openDeleteDialog();
    }
  }, [
    initialManageAction,
    initialCreateMode,
    initialCreateRequestId,
    initialParentId,
    canEdit,
    editorReady,
    errors.length,
    selectedEntry,
  ]);
  if (status === "loading") {
    return (
      <View style={{ padding: 24 }}>
        <ThemedText>Lokalen Entwurf laden ...</ThemedText>
      </View>
    );
  }

  if (status === "error") {
    return (
      <View style={{ padding: 24, gap: 12 }}>
        <ThemedText>Lokale Speicherung fehlgeschlagen.</ThemedText>
        <ThemedText>{storageError}</ThemedText>
        {canRetrySave && (
          <ActionButton
            label="Erneut speichern"
            variant="secondary"
            onPress={() => {
              void retrySave();
            }}
          />
        )}
      </View>
    );
  }

  if (!canEdit) {
    return (
      <View style={{ padding: 24, gap: 12 }}>
        <ThemedText style={{ fontSize: 24, fontWeight: "700" }}>
          Content- und Menüverwaltung
        </ThemedText>
        <ThemedText>
          Du hast Leserechte. Die Bearbeitung von Menüs und Inhalten
          ist für deine aktuelle Rolle nicht freigegeben.
        </ThemedText>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}>
      <ThemedText style={{ fontSize: 24, fontWeight: "700" }}>
        Content- und Menü-Editor
      </ThemedText>

      <ThemedText>
        Lokaler Entwurf – keine Veröffentlichung.
      </ThemedText>

      <ThemedText>
        {status === "saving"
          ? "Änderungen werden lokal gespeichert ..."
          : "Lokaler Entwurf gespeichert."}
      </ThemedText>


<View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
        <ActionButton
          label="Neues Menü"
          variant="secondary"
          onPress={openFolderDialog}
          disabled={!editorReady || allowedParents.length === 0 || errors.length > 0}
        />
        <ActionButton
          label="Neue Inhaltsseite"
          variant="secondary"
          onPress={openCreateDialog}
          disabled={!editorReady || allowedParents.length === 0 || errors.length > 0}
        />
        <ActionButton
          label="Nach oben"
          variant="secondary"
          onPress={() => moveMenu("up")}
          disabled={!canMoveUp}
        />
        <ActionButton
          label="Nach unten"
          variant="secondary"
          onPress={() => moveMenu("down")}
          disabled={!canMoveDown}
        />
        <ActionButton
          label="In Ordner verschieben"
          variant="secondary"
          onPress={openMoveDialog}
          disabled={!canMoveToOtherParent}
        />
        <ActionButton
          label="Menü löschen"
          onPress={openDeleteDialog}
          disabled={
            !editorReady ||
            errors.length > 0 ||
            selectedEntry?.source !== "content"
          }
        />
        <ActionButton
          label="Menü umbenennen"
          onPress={openRenameDialog}
          disabled={
            !editorReady ||
            errors.length > 0 ||
            selectedEntry?.source !== "content"
          }
        />
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 20,
        }}
      >
        <View style={{ flexGrow: 1, flexBasis: 280, minWidth: 240 }}>
          <MenuTreePanel
            entries={draft.entries}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </View>

        <View style={{ flexGrow: 2, flexBasis: 360, minWidth: 260 }}>
          <ContentPagePanel
            selectedEntry={selectedEntry}
            page={selectedPage}
                        onTitleChange={updatePageTitle}
            onAddTextBlock={addTextBlock}
            onTextBlockChange={updateTextBlock}
          />
        </View>
      </View>

      <View style={{ gap: 6 }}>
        <ThemedText style={{ fontWeight: "600" }}>
          Entwurfsprüfung
        </ThemedText>

        <ThemedText>
          {errors.length === 0
            ? "Keine Validierungsfehler."
            : `${errors.length} Validierungsfehler gefunden.`}
        </ThemedText>

        {errors.map((error, index) => (
          <ThemedText
            key={`${error.code}-${error.entryId ?? "draft"}-${index}`}
          >
            {error.code}: {error.message}
          </ThemedText>
        ))}
      </View>

      <BaseModal
        visible={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        width={520}
      >
        <View style={{ gap: 16 }}>
          <ThemedText style={{ fontSize: 19, fontWeight: "600" }}>
            Menü löschen?
          </ThemedText>

          <ThemedText>
            Möchtest du dieses Menü wirklich aus dem lokalen Entwurf entfernen?
            Die zugehörige Inhaltsseite und ihre Inhalte werden ebenfalls gelöscht.
          </ThemedText>

          {deleteError !== "" && (
            <ThemedText>{deleteError}</ThemedText>
          )}

          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              gap: 12,
            }}
          >
            <ActionButton
              label="Abbrechen"
              onPress={() => setDeleteOpen(false)}
            />
            <ActionButton
              label="Menü löschen"
              variant="primary"
              onPress={deleteMenu}
            />
          </View>
        </View>
      </BaseModal>
      <BaseModal
        visible={renameOpen}
        onClose={() => setRenameOpen(false)}
        width={520}
      >
        <View style={{ gap: 16 }}>
          <ThemedText style={{ fontSize: 19, fontWeight: "600" }}>
            Menü umbenennen
          </ThemedText>

          <TextInput
            label="Neuer Menüname"
            value={renameTitle}
            onChangeText={setRenameTitle}
            placeholder="Menüname eingeben"
          />

          {renameError !== "" && (
            <ThemedText>{renameError}</ThemedText>
          )}

          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              gap: 12,
            }}
          >
            <ActionButton
              label="Abbrechen"
              onPress={() => setRenameOpen(false)}
            />
            <ActionButton
              label="Speichern"
              variant="primary"
              disabled={!renameTitle.trim()}
              onPress={renameMenu}
            />
          </View>
        </View>
      </BaseModal>
      <BaseModal
        visible={folderOpen}
        onClose={() => setFolderOpen(false)}
        width={520}
      >
        <View style={{ gap: 16 }}>
          <ThemedText style={{ fontSize: 19, fontWeight: "600" }}>
            Neues Menü erstellen
          </ThemedText>

          <TextInput
            label="Menüname"
            value={folderTitle}
            onChangeText={setFolderTitle}
            placeholder="Zum Beispiel: Dokumentation"
          />

          <ThemedText style={{ fontWeight: "600" }}>
            Übergeordnetes Menü
          </ThemedText>

          {allowedParents.map(parent => (
            <ActionButton
              key={parent.id}
              label={
                parent.id === folderParentId
                  ? `✓ ${parent.caption}`
                  : parent.caption
              }
              variant={
                 "secondary"
              }
              onPress={() => setFolderParentId(parent.id)}
            />
          ))}

          {folderError !== "" && (
            <ThemedText>{folderError}</ThemedText>
          )}

          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              gap: 12,
            }}
          >
            <ActionButton
              label="Abbrechen"
              onPress={() => setFolderOpen(false)}
            />
            <ActionButton
              label="Hinzufügen"
              variant="secondary"
              disabled={!folderTitle.trim() || !folderParentId}
              onPress={createFolder}
            />
          </View>
        </View>
      </BaseModal>

      <BaseModal
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        width={520}
      >
        <View style={{ gap: 16 }}>
          <ThemedText style={{ fontSize: 19, fontWeight: "600" }}>
            Neue Inhaltsseite
          </ThemedText>

          <TextInput
            label="Seitentitel"
            value={newTitle}
            onChangeText={setNewTitle}
            placeholder="Zum Beispiel: Dokumentation"
          />

          <ThemedText style={{ fontWeight: "600" }}>
            Übergeordnetes Menü
          </ThemedText>

          {allowedParents.map(parent => (
            <ActionButton
              key={parent.id}
              label={
                parent.id === newParentId
                  ? `✓ ${parent.caption}`
                  : parent.caption
              }
              variant={
                 "secondary"
              }
              onPress={() => setNewParentId(parent.id)}
            />
          ))}

          {createError !== "" && (
            <ThemedText>{createError}</ThemedText>
          )}

          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              gap: 12,
            }}
          >
            <ActionButton
              label="Abbrechen"
              onPress={() => setCreateOpen(false)}
            />
            <ActionButton
              label="Hinzufügen"
              variant="secondary"
              disabled={!newTitle.trim() || !newParentId}
              onPress={createPage}
            />
          </View>
        </View>
      </BaseModal>
      <BaseModal
        visible={moveOpen}
        onClose={() => setMoveOpen(false)}
        width={520}
      >
        <View style={{ gap: 16 }}>
          <ThemedText style={{ fontSize: 19, fontWeight: "600" }}>
            In anderen Ordner verschieben
          </ThemedText>

          <ThemedText>
            Menüeintrag: {moveEntry?.caption ?? ""}
          </ThemedText>

          <ThemedText style={{ fontWeight: "600" }}>
            Neues übergeordnetes Menü
          </ThemedText>

          {moveTargets.map(parent => (
            <ActionButton
              key={parent.id}
              label={
                parent.id === moveParentId
                  ? `✓ ${parent.caption}`
                  : parent.caption
              }
              variant="secondary"
              onPress={() => setMoveParentId(parent.id)}
            />
          ))}

          {moveTargets.length === 0 && (
            <ThemedText>
              Kein gültiger Zielordner verfügbar.
            </ThemedText>
          )}

          {moveError !== "" && (
            <ThemedText>{moveError}</ThemedText>
          )}

          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              gap: 12,
            }}
          >
            <ActionButton
              label="Abbrechen"
              variant="secondary"
              onPress={() => setMoveOpen(false)}
            />

            <ActionButton
              label="Verschieben"
              variant="secondary"
              disabled={
                !editorReady ||
                errors.length > 0 ||
                !moveTargets.some(parent => parent.id === moveParentId)
              }
              onPress={confirmMoveToParent}
            />
          </View>
        </View>
      </BaseModal>
    </ScrollView>
  );
}
