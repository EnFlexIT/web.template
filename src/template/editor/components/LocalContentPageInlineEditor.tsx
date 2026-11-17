import React, { useEffect, useState } from "react";

import {
  useAppSelector,
} from "@/template/state/store/useAppSelector";

import { selectVerifiedBackendRoles as selectEffectiveRoles } from "@/template/state/authorization/selectVerifiedBackendRoles";

import {
  canEditLocalContent,
} from "../authorization/canEditLocalContent";

import {
  View,
} from "react-native";

import type {
  EditorContentPage,
} from "../model/editorTypes";

import {
  Card,
} from "@/template/components/design-system/ui-elements/Card";

import {
  ActionButton,
} from "@/template/components/design-system/ui-elements/ActionButton";

import {
  TextInput,
} from "@/template/components/design-system/ui-elements/TextInput";

import {
  ThemedText,
} from "@/template/components/design-system/themed/ThemedText";

import {
  ContentTextBlockEditor,
} from "./ContentTextBlockEditor";

import {
  LocalContentPageViewer,
} from "./LocalContentPageViewer";

function clonePage(page: EditorContentPage): EditorContentPage {
  return {
    ...page,
    blocks: page.blocks.map(block => ({ ...block })),
  };
}

/**
 * Development-only inline editor.
 *
 * Changes exist only inside component state.
 * No draft storage, backend writes, or publishing.
 */
export function LocalContentPageInlineEditor({
  page,
  onSave,
}: {
  page: EditorContentPage;
  onSave: (
    originalPage: EditorContentPage,
    updatedPage: EditorContentPage,
  ) => Promise<{ status: string }>;
}) {
  const effectiveRoles = useAppSelector(selectEffectiveRoles);
  const canEdit = canEditLocalContent(effectiveRoles);

  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!canEdit) {
      setEditing(false);
    }
  }, [canEdit]);

  const [workingPage, setWorkingPage] =
    useState<EditorContentPage>(() => clonePage(page));

  const [previewPage, setPreviewPage] =
    useState<EditorContentPage>(() => clonePage(page));

  useEffect(() => {
    setWorkingPage(clonePage(page));
    setPreviewPage(clonePage(page));
    setEditing(false);
  }, [page.id]);

  const updateText = (
    blockId: string,
    html: string,
  ) => {
    setWorkingPage(current => ({
      ...current,
      blocks: current.blocks.map(block =>
        block.type === "text" && block.id === blockId
          ? { ...block, html }
          : block,
      ),
    }));
  };

  const cancel = () => {
    setWorkingPage(clonePage(previewPage));
    setEditing(false);
  };

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const apply = async () => {
    if (saving || !canEdit) return;

    setSaving(true);
    setSaveError("");

    try {
      const result = await onSave(
        clonePage(previewPage),
        clonePage(workingPage),
      );

      if (
        result.status === "saved" ||
        result.status === "unchanged"
      ) {
        setPreviewPage(clonePage(workingPage));
        setEditing(false);
      } else {
        setSaveError(
          `Speichern fehlgeschlagen: ${result.status}. ` +
          "Deine Eingaben bleiben erhalten.",
        );
      }
    } catch {
      setSaveError(
        "Speichern fehlgeschlagen. Deine Eingaben bleiben erhalten.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (!editing || !canEdit) {
    return (
      <View style={{ gap: 12 }}>
        {canEdit && (
          <View style={{ alignItems: "flex-end" }}>
            <ActionButton
              label="Bearbeiten"
              onPress={() => {
                setWorkingPage(clonePage(previewPage));
                setEditing(true);
              }}
            />
          </View>
        )}

        <LocalContentPageViewer page={previewPage} />
      </View>
    );
  }

  return (
    <Card padding="md">
      <View style={{ gap: 16 }}>
        <ThemedText style={{ fontSize: 18, fontWeight: "600" }}>
          Inhaltsseite bearbeiten
        </ThemedText>

        <TextInput
          label="Seitentitel"
          value={workingPage.title}
          onChangeText={title =>
            setWorkingPage(current => ({
              ...current,
              title,
            }))
          }
        />

        {workingPage.blocks.map(block => {
          if (block.type !== "text") {
            return (
              <ThemedText key={block.id}>
                Bildblock bleibt unverändert: {block.alt}
              </ThemedText>
            );
          }

          return (
            <View key={block.id} style={{ gap: 8 }}>
              <ThemedText style={{ fontWeight: "600" }}>
                Textblock
              </ThemedText>

              <ContentTextBlockEditor
                blockId={block.id}
                html={block.html}
                onChange={updateText}
              />
            </View>
          );
        })}

        <View style={{ flexDirection: "row", gap: 12 }}>
          <ActionButton
            label="Änderungen übernehmen"
            onPress={apply}
          />

          <ActionButton
            label="Verwerfen"
            variant="secondary"
            onPress={cancel}
          />
        </View>

        {saving && (
          <ThemedText>Lokalen Entwurf speichern ...</ThemedText>
        )}
        {!!saveError && (
          <ThemedText>{saveError}</ThemedText>
        )}
        <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>
          Lokale Entwurfsspeicherung. Keine Veröffentlichung im Backend.
        </ThemedText>
      </View>
    </Card>
  );
}