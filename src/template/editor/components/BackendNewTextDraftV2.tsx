import React, { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import type { TemplateRootState } from "@/template/state/store/templateStoreTypes";
import { createBackendTextFromStoreV2 } from "../adapters/createBackendTextFromStoreV2";

import { ThemedText } from "@/template/components/design-system/themed/ThemedText";
import { ActionButton } from "@/template/components/design-system/ui-elements/ActionButton";
import { sanitizeContentHtml } from "../utils/sanitizeContentHtml";
import { useBackendLiveContent } from "../context/BackendContentLivePreviewContext";
import { ContentTextBlockEditor } from "./ContentTextBlockEditor";

type Props = {
  menuId: number;
  position: number;
  getState: () => TemplateRootState;
  onSaved: () => Promise<void>;
};

/**
 * Unpublished backend text draft, rendered with the existing Tiptap editor.
 * Edits are displayed in the left viewer immediately and NEVER auto-saved.
 * Backend creation remains disabled until V2 IDs/permissions are verified.
 */
export function BackendNewTextDraftV2({
  menuId,
  position,
  getState,
  onSaved,
}: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveLocked, setSaveLocked] = useState(false);
  const [message, setMessage] = useState("");
  const busyRef = useRef(false);
  const mountedRef = useRef(true);
  const [html, setHtml] = useState("<p></p>");
  const { setLiveNewHtml } = useBackendLiveContent();
  const liveSetterRef = useRef(setLiveNewHtml);
  liveSetterRef.current = setLiveNewHtml;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      liveSetterRef.current(menuId, null);
    };
  }, [menuId]);

  const discard = () => {
    if (busyRef.current) return;
    setLiveNewHtml(menuId, null);
    setOpen(false);
    setHtml("<p></p>");
    setSaveLocked(false);
    setMessage("");
  };

  const save = async () => {
    if (busyRef.current || saveLocked || !open) return;

    busyRef.current = true;
    setSaving(true);
    setMessage("");

    let createdId: number | null = null;

    try {
      createdId = await createBackendTextFromStoreV2({
        menuId,
        position,
        html,
        getState,
      });

      await onSaved();

      if (!mountedRef.current) return;

      setLiveNewHtml(menuId, null);
      setOpen(false);
      setHtml("<p></p>");
      setMessage(`Online gespeichert: Textinhalt #${createdId}`);
    } catch {
      if (!mountedRef.current) return;

      // Keine automatische Wiederholung bei unklarem POST-Ergebnis.
      setSaveLocked(true);

      setMessage(
        createdId !== null
          ? `Textinhalt #${createdId} wurde angelegt, aber das Menü konnte nicht neu geladen werden.`
          : "Speicherung nicht eindeutig bestätigt. Bitte Backend-Inhalte neu laden und prüfen, bevor du einen weiteren Inhalt erstellst.",
      );
    } finally {
      busyRef.current = false;
      if (mountedRef.current) setSaving(false);
    }
  };

  return (
    <View style={{ gap: 12 }}>
      {!open ? (
        <ActionButton
          label="Neuen Textinhalt hinzufuegen"
          onPress={() => {
            setSaveLocked(false);
            setMessage("");
            setOpen(true);
          }}
        />
      ) : (
        <View style={{ gap: 12 }}>
          <ThemedText style={{ fontWeight: "600" }}>
            Neuer Textinhalt fuer Menue #{menuId}
          </ThemedText>
          <ThemedText>
            Lokaler Entwurf. Jede Textaenderung erscheint sofort links.
            Noch nicht im Backend gespeichert.
          </ThemedText>
          <ContentTextBlockEditor
            compactToolbar
            blockId={`backend-new-${menuId}`}
            html={html}
            onChange={(_, updatedHtml) => {
              const safe = sanitizeContentHtml(updatedHtml);
              setHtml(safe);
              setLiveNewHtml(menuId, safe);
            }}
          />
          {!saveLocked && (
            <ActionButton
              label={saving ? "Online-Speicherung laeuft ..." : "Online speichern"}
              onPress={() => void save()}
            />
          )}
          {!saving && (
            <ActionButton
              label="Entwurf verwerfen"
              variant="secondary"
              onPress={discard}
            />
          )}
        </View>
      )}
      {!!message && <ThemedText>{message}</ThemedText>}
    </View>
  );
}
