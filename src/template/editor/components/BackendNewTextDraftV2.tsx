import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation(["Editor"]);
  const [messageId, setMessageId] = useState<number | null>(null);
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
      setMessageId(createdId);
      setMessage("backendContent.textCreated");
    } catch {
      if (!mountedRef.current) return;

      // Keine automatische Wiederholung bei unklarem POST-Ergebnis.
      setSaveLocked(true);

      setMessageId(createdId);
      setMessage(
        createdId !== null
          ? "backendContent.textCreatedReloadFailed"
          : "backendContent.createUncertain",
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
          label={t("backendContent.addText")}
          onPress={() => {
            setSaveLocked(false);
            setMessage("");
            setOpen(true);
          }}
        />
      ) : (
        <View style={{ gap: 12 }}>
          <ThemedText style={{ fontWeight: "600" }}>
            {t("backendContent.newTextTitle", { id: menuId })}
          </ThemedText>
          <ThemedText>{t("backendContent.draftHint")}</ThemedText>
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
              label={saving ? t("backendContent.savingOnline") : t("backendContent.saveOnline")}
              onPress={() => void save()}
            />
          )}
          {!saving && (
            <ActionButton
              label={t("backendContent.discardDraft")}
              variant="secondary"
              onPress={discard}
            />
          )}
        </View>
      )}
      {!!message && <ThemedText>{t(message, { id: messageId })}</ThemedText>}
    </View>
  );
}
