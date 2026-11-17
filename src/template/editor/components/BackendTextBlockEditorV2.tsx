import React, { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { useStore } from "react-redux";

import type {
  TemplateRootState,
} from "@/template/state/store/templateStoreTypes";

import {
  useAppSelector,
} from "@/template/state/store/useAppSelector";

import {
  selectBackendContentWriteContext,
} from "../adapters/updateBackendContentElementFromStore";

import {
  saveBackendTextWithConflictCheck,
} from "../adapters/saveBackendTextWithConflictCheck";

import type {
  BackendEditorTextBlockV2,
} from "../adapters/mapBackendContentToEditorV2";

import {
  ContentTextBlockEditor,
} from "./ContentTextBlockEditor";

import {
  ActionButton,
} from "@/template/components/design-system/ui-elements/ActionButton";

import {
  ThemedText,
} from "@/template/components/design-system/themed/ThemedText";

export interface BackendTextBlockEditorV2Props {
  block: BackendEditorTextBlockV2;
  onSaved?: () => Promise<void> | void;
  onDraftChange?: (html: string | null) => void;
  desktopCompact?: boolean;
  desktopEditRequest?: number;
  onEditingStateChange?: (editing: boolean, saving: boolean, dirty: boolean) => void;
}

/**
 * Backend text editor.
 * Not connected to navigation or local draft storage.
 */
export function BackendTextBlockEditorV2({
  block,
  onSaved,
  onDraftChange,
  onEditingStateChange,
  desktopCompact = false,
  desktopEditRequest = 0,
}: BackendTextBlockEditorV2Props) {
  const store = useStore();

  const canWrite = useAppSelector(state => {
    const context = selectBackendContentWriteContext(state);

    return (
      context.isLoggedIn &&
      context.canEdit &&
      !context.isSwitchingServer &&
      !context.isLoggingOut &&
      context.server.length > 0
    );
  });

  const onDraftChangeRef = useRef(onDraftChange);
  onDraftChangeRef.current = onDraftChange;
  const [editing, setEditing] = useState(false);
  const [html, setHtml] = useState(block.html);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const onEditingStateChangeRef = useRef(onEditingStateChange);
  onEditingStateChangeRef.current = onEditingStateChange;

  const dirty = editing && html !== block.html;

  useEffect(() => {
    onEditingStateChangeRef.current?.(editing, saving, dirty);
  }, [editing, saving, dirty]);

  useEffect(() => {
    return () => onDraftChangeRef.current?.(null);
  }, [block.backendContentId]);

  useEffect(() => {
    setHtml(block.html);
    setEditing(false);
    setMessage("");
  }, [block.backendContentId]);

  const isHtmlContent =
    block.original.mimeType.toLowerCase().split(";")[0].trim() ===
    "text/html";

  const allowed =
    block.editable &&
    canWrite &&
    isHtmlContent;

  const lastDesktopEditRequestRef = useRef(desktopEditRequest);

  useEffect(() => {
    if (
      !desktopCompact ||
      desktopEditRequest === lastDesktopEditRequestRef.current
    ) {
      return;
    }

    lastDesktopEditRequestRef.current = desktopEditRequest;

    if (!allowed || editing || saving) {
      return;
    }

    setHtml(block.html);
    setMessage("");
    setEditing(true);
  }, [
    desktopCompact,
    desktopEditRequest,
    allowed,
    editing,
    saving,
    block.html,
  ]);

  const save = async () => {
    if (!allowed || saving || !editing) {
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      await saveBackendTextWithConflictCheck({
        elementId: block.backendContentId,
        original: block.original,
        html,
        getState: () => store.getState() as TemplateRootState,
      });

      setEditing(false);
      onDraftChange?.(null);

      if (onSaved) {
        try {
          await onSaved();
          setMessage("Backend-Speicherung erfolgreich. Inhalt neu geladen.");
        } catch {
          setMessage(
            "Backend-Speicherung erfolgreich, aber das erneute " +
            "Laden ist fehlgeschlagen. Nicht erneut speichern. " +
            "Bitte den Serverinhalt zuerst neu laden.",
          );
        }
      } else {
        setMessage(
          "Backend-Speicherung erfolgreich. " +
          "Der Serverinhalt wurde noch nicht erneut geladen.",
        );
      }
    } catch {
      setMessage(
        "Backend-Speicherung fehlgeschlagen oder nicht bestaetigt. " +
        "Bitte den Serverstand pruefen, bevor du erneut speicherst.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ gap: 12 }}>
      {!desktopCompact && (
        <ThemedText style={{ fontWeight: "600" }}>
          Backend-Textblock #{block.backendContentId}
        </ThemedText>
      )}

      {!allowed && (
        <ThemedText>
          Bearbeitung nicht freigegeben oder kein HTML-Textinhalt.
        </ThemedText>
      )}

      {allowed && !editing && !desktopCompact && (
        <ActionButton
          label={desktopCompact ? undefined : "Backend-Text bearbeiten"}
          icon={desktopCompact ? "edit" : undefined}
          iconSize={18}
          tooltip={desktopCompact ? "Ausgewählten Text bearbeiten" : undefined}
          onPress={() => {
            setHtml(block.html);
            setMessage("");
            setEditing(true);
          }}
        />
      )}

      {allowed && editing && (
        <>
          <ContentTextBlockEditor
            compactToolbar
            blockId={String(block.backendContentId)}
            html={html}
            onChange={(_, updatedHtml) => {
              setHtml(updatedHtml);
              onDraftChange?.(updatedHtml);
            }}
          />

          <View style={{ flexDirection: "row", gap: 12 }}>
            <ActionButton
              label={saving ? "Speichert..." : "Im Backend speichern"}
              onPress={save}
            />

            {!saving && (
              <ActionButton
                label="Verwerfen"
                variant="secondary"
                onPress={() => {
                  setHtml(block.html);
                  onDraftChange?.(null);
                  setEditing(false);
                  setMessage("");
                }}
              />
            )}
          </View>
        </>
      )}

      {!!message && (
        <ThemedText>{message}</ThemedText>
      )}
    </View>
  );
}