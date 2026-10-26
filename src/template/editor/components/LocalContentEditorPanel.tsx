import React from "react";
import { LocalContentFolderCreateForm } from "./LocalContentFolderCreateForm";
import { LocalContentPageCreateForm } from "./LocalContentPageCreateForm";
import { LocalContentRenameForm } from "./LocalContentRenameForm";
import { LocalContentMoveForm } from "./LocalContentMoveForm";
import { LocalContentDeleteForm } from "./LocalContentDeleteForm";
import { LocalContentPageEditForm } from "./LocalContentPageEditForm";
import { Pressable, ScrollView, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useUnistyles } from "react-native-unistyles";

import { ThemedText } from "@/template/components/design-system/themed/ThemedText";
import { ActionButton } from "@/template/components/design-system/ui-elements/ActionButton";
import {
  useLocalContentEditorPanel,
} from "../context/LocalContentEditorPanelContext";
import {
  useSharedLocalEditorDraft,
} from "../context/LocalEditorDraftContext";

const actionTitles = {
  rename: "Umbenennen",
  move: "Verschieben",
  delete: "Löschen",
  open: "Bearbeiten",
} as const;

/**
 * Development-only editor panel.
 *
 * Hosts local draft actions without publishing content.
 * The panel header remains visible while the body scrolls.
 */
export function LocalContentEditorPanel() {
  const { theme } = useUnistyles();
  const {
    request,
    closePanel,
    confirmationPending,
    cancelPendingAction,
    confirmDiscardAndContinue,
  } = useLocalContentEditorPanel();
  const { status, storageError } = useSharedLocalEditorDraft();

  if (!request) return null;

  const title =
    request.kind === "create"
      ? request.mode === "folder"
        ? "Neuen Ordner erstellen"
        : "Neue Inhaltsseite erstellen"
      : actionTitles[request.action];

  const targetId =
    request.kind === "create"
      ? request.parentId
      : request.entryId;

  const statusLabel =
    status === "loading"
      ? "Lokaler Entwurf wird geladen"
      : status === "saving"
        ? "Änderungen werden lokal gespeichert"
        : status === "error"
          ? "Fehler beim lokalen Entwurf"
          : "Lokaler Entwurf bereit";

  const statusIcon =
    status === "loading"
      ? "clock"
      : status === "saving"
        ? "refresh-cw"
        : status === "error"
          ? "alert-circle"
          : "check-circle";

  return (
    <View
      style={{
        width: 460,
        maxWidth: "100%",
        flexShrink: 0,
        flexGrow: 0,
        flexBasis: 460,
        minHeight: 0,
        backgroundColor: theme.colors.card,
        borderLeftWidth: 1,
        borderLeftColor: theme.colors.border,
        padding: 16,
        gap: 16,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <ThemedText style={{ fontSize: 17, fontWeight: "600" }}>
          {title}
        </ThemedText>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Editor schließen"
          onPress={closePanel}
          style={{ padding: 8 }}
        >
          <Feather
            name="x"
            size={18}
            color={theme.colors.text}
          />
        </Pressable>
      </View>
      {confirmationPending && (
        <View
          style={{
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: 8,
            padding: 12,
            gap: 12,
          }}
        >
          <ThemedText style={{ fontWeight: "600" }}>
            Nicht übernommene Änderungen
          </ThemedText>

          <ThemedText>
            Möchtest du weiter bearbeiten oder die Änderungen
            verwerfen und fortfahren?
          </ThemedText>

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <ActionButton
              label="Weiter bearbeiten"
              variant="secondary"
              onPress={cancelPendingAction}
            />
            <ActionButton
              label="Verwerfen und fortfahren"
              variant="primary"
              onPress={confirmDiscardAndContinue}
            />
          </View>
        </View>
      )}

      <ScrollView
        style={{
          flex: 1,
          minHeight: 0,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
        }}
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: 24,
          gap: 12,
        }}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
      >
        <View
          style={{
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: 8,
            padding: 12,
            gap: 6,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Feather
              name={statusIcon}
              size={15}
              color={theme.colors.text}
            />
            <ThemedText style={{ fontSize: 13, fontWeight: "600" }}>
              {statusLabel}
            </ThemedText>
          </View>

          <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>
            Nur lokaler Entwurf – nicht veröffentlicht
          </ThemedText>

          {status === "error" && storageError !== "" && (
            <ThemedText style={{ fontSize: 12 }}>
              {storageError}
            </ThemedText>
          )}
        </View>

        {request.kind === "create" && request.mode === "folder" ? (
          <LocalContentFolderCreateForm
            key={request.parentId}
            parentId={request.parentId}
            onClose={closePanel}
          />
        ) : request.kind === "create" && request.mode === "page" ? (
          <LocalContentPageCreateForm
            key={request.parentId}
            parentId={request.parentId}
            onClose={closePanel}
          />
        ) : request.kind === "manage" && request.action === "rename" ? (
          <LocalContentRenameForm
            key={request.entryId}
            entryId={request.entryId}
            onClose={closePanel}
          />
        ) : request.kind === "manage" && request.action === "move" ? (
          <LocalContentMoveForm
            key={request.entryId}
            entryId={request.entryId}
            onClose={closePanel}
          />
        ) : request.kind === "manage" && request.action === "delete" ? (
          <LocalContentDeleteForm
            key={request.entryId}
            entryId={request.entryId}
            onClose={closePanel}
          />
        ) : request.kind === "manage" && request.action === "open" ? (
          <LocalContentPageEditForm
            key={request.entryId}
            entryId={request.entryId}
            onClose={closePanel}
          />
        ) : (
          <>
            <ThemedText>
              Ausgewählter Eintrag: {targetId}
            </ThemedText>

            <ThemedText style={{ fontSize: 13, opacity: 0.7 }}>
              Die Bearbeitungsfelder werden im nächsten Schritt
              mit den vorhandenen Editor-Funktionen verbunden.
            </ThemedText>
          </>
        )}
      </ScrollView>
    </View>
  );
}