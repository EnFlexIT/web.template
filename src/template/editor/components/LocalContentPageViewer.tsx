import React from "react";

import { View } from "react-native";

import {
  Card,
} from "@/template/components/design-system/ui-elements/Card";

import {
  ThemedText,
} from "@/template/components/design-system/themed/ThemedText";

import type {
  EditorContentPage,
} from "../model/editorTypes";

import {
  ContentTextBlockViewer,
} from "./ContentTextBlockViewer";

export interface LocalContentPageViewerProps {
  page?: EditorContentPage;
}

/**
 * Read-only display of a local, unpublished content page.
 *
 * Does not modify the editor draft or call backend APIs.
 */
export function LocalContentPageViewer({
  page,
}: LocalContentPageViewerProps) {
  if (!page) {
    return (
      <Card padding="md">
        <ThemedText>
          Die lokale Inhaltsseite wurde nicht gefunden.
        </ThemedText>
      </Card>
    );
  }

  return (
    <Card padding="md">
      <View style={{ gap: 20 }}>
        <ThemedText
          style={{
            fontSize: 24,
            fontWeight: "700",
          }}
        >
          {page.title}
        </ThemedText>

        {page.blocks.length === 0 && (
          <ThemedText>
            Diese Inhaltsseite enthält noch keine Inhalte.
          </ThemedText>
        )}

        {page.blocks.map(block => {
          if (block.type === "text") {
            return (
              <ContentTextBlockViewer
                key={block.id}
                html={block.html}
              />
            );
          }

          return (
            <View key={block.id} style={{ gap: 6 }}>
              <ThemedText style={{ fontWeight: "600" }}>
                Bildvorschau noch nicht verfügbar
              </ThemedText>

              <ThemedText>
                {block.alt}
              </ThemedText>
            </View>
          );
        })}
      </View>
    </Card>
  );
}