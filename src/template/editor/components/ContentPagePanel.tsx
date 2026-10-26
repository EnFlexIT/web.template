import React from "react";

import {
  View,
} from "react-native";

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

import type {
  EditorContentPage,
  EditorMenuEntry,
} from "../model/editorTypes";

import {
  ContentTextBlockEditor,
} from "./ContentTextBlockEditor";

export interface ContentPagePanelProps {
  selectedEntry?: EditorMenuEntry;
  page?: EditorContentPage;
  onTitleChange: (pageId: string, title: string) => void;
  onAddTextBlock: (pageId: string) => void;
  onDeleteTextBlock?: (pageId: string, blockId: string) => void;
  onTextBlockChange: (
    pageId: string,
    blockId: string,
    html: string,
  ) => void;
}

/**
 * Local content-page editor.
 * Does not persist or publish changes.
 */
export function ContentPagePanel({
  selectedEntry,
  page,
  onTitleChange,
  onAddTextBlock,
  onDeleteTextBlock,
  onTextBlockChange,
}: ContentPagePanelProps) {
  if (!selectedEntry) {
    return (
      <Card padding="md">
        <ThemedText>
          Wähle links einen Menüeintrag aus.
        </ThemedText>
      </Card>
    );
  }

  if (selectedEntry.source !== "content") {
    return (
      <Card padding="md">
        <View style={{ gap: 12 }}>
          <ThemedText style={{ fontSize: 17, fontWeight: "600" }}>
            {selectedEntry.caption}
          </ThemedText>

          <ThemedText>
            Dieser Menüeintrag gehört zur bestehenden
            Application- oder Template-Navigation.
          </ThemedText>

          <ThemedText>
            Die Bearbeitung ist in dieser Version deaktiviert.
          </ThemedText>
        </View>
      </Card>
    );
  }

  // Content folders do not own a content page.
  if (selectedEntry.contentPageId === undefined) {
    return (
      <Card padding="md">
        <View style={{ gap: 12 }}>
          <ThemedText style={{ fontSize: 17, fontWeight: "600" }}>
            {selectedEntry.caption}
          </ThemedText>

          <ThemedText>
            Dieser Menüordner besitzt keine eigene Inhaltsseite.
          </ThemedText>

          <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>
            Du kannst darin weitere Menüordner und Inhaltsseiten
            erstellen. Wähle dazu diesen Ordner und anschließend
            „Neues Menü“ oder „Neue Inhaltsseite“.
          </ThemedText>
        </View>
      </Card>
    );
  }
  if (!page || page.id !== selectedEntry.contentPageId) {
    return (
      <Card padding="md">
        <ThemedText>
          Die zugehörige Inhaltsseite wurde nicht gefunden.
        </ThemedText>
      </Card>
    );
  }

  return (
    <Card padding="md">
      <View style={{ gap: 16 }}>
        <ThemedText style={{ fontSize: 17, fontWeight: "600" }}>
          Inhaltsseite bearbeiten
        </ThemedText>

        <TextInput
          label="Seitentitel"
          value={page.title}
          onChangeText={title => onTitleChange(page.id, title)}
          placeholder="Titel eingeben"
        />

        <ThemedText>
          Menüeintrag: {selectedEntry.caption}
        </ThemedText>

        <ThemedText>
          Inhaltsblöcke: {page.blocks.length}
        </ThemedText>

        {page.blocks.map(block => {
          if (block.type === "text") {
            return (
              <View key={block.id} style={{ gap: 8 }}>
                <ThemedText style={{ fontWeight: "600" }}>
                  Textblock
                </ThemedText>

                                {onDeleteTextBlock && (
                  <View style={{ alignItems: "flex-end" }}>
                    <ActionButton
                      label="Textblock löschen"
                      variant="secondary"
                      onPress={() =>
                        onDeleteTextBlock(page.id, block.id)
                      }
                    />
                  </View>
                )}
<ContentTextBlockEditor
                  key={block.id}
                  blockId={block.id}
                  html={block.html}
                  onChange={(blockId, html) =>
                    onTextBlockChange(page.id, blockId, html)
                  }
                />
              </View>
            );
          }

          return (
            <ThemedText key={block.id}>
              Bildblock: {block.alt}
            </ThemedText>
          );
        })}

        <ActionButton
          label="Textblock hinzufügen"
          variant="secondary"
          onPress={() => onAddTextBlock(page.id)}
        />

        <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>
          Textänderungen bleiben im lokalen Entwurf.
          Eine Veröffentlichung ist nicht möglich.
        </ThemedText>
      </View>
    </Card>
  );
}
