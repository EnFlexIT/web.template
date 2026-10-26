import React, { useMemo } from "react";

import {
  Pressable,
  View,
} from "react-native";

import {
  useUnistyles,
} from "react-native-unistyles";

import {
  Card,
} from "@/template/components/design-system/ui-elements/Card";

import {
  ThemedText,
} from "@/template/components/design-system/themed/ThemedText";

import type {
  EditorMenuEntry,
} from "../model/editorTypes";

import {
  buildMenuTreeRows,
} from "../utils/buildMenuTreeRows";

export interface MenuTreePanelProps {
  entries: readonly EditorMenuEntry[];
  selectedId?: string;
  onSelect: (entryId: string) => void;
}

/**
 * Read-only presentation of the editor menu tree.
 *
 * Selection is forwarded to the parent component.
 * The panel never modifies draft or runtime navigation.
 */
export function MenuTreePanel({
  entries,
  selectedId,
  onSelect,
}: MenuTreePanelProps) {
  const { theme } = useUnistyles();

  const rows = useMemo(
    () => buildMenuTreeRows(entries),
    [entries],
  );

  return (
    <Card padding="md">
      <View style={{ gap: 12 }}>
        <ThemedText
          style={{
            fontSize: 17,
            fontWeight: "600",
          }}
        >
          Menüstruktur
        </ThemedText>

        {rows.map(({ entry, depth }) => {
          const selected = entry.id === selectedId;
          const isStatic = entry.source !== "content";

          return (
            <Pressable
              key={entry.id}
              onPress={() => onSelect(entry.id)}
              accessibilityRole="button"
              accessibilityLabel={entry.caption}
              accessibilityState={{ selected }}
              style={{
                marginLeft: Math.min(depth, 8) * 16,
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderWidth: selected ? 1 : 0,
                borderColor: theme.colors.highlight,
                backgroundColor: selected
                  ? "#eeeeee"
                  : "transparent",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <ThemedText>
                  {isStatic ? "🔒" : "📄"}
                </ThemedText>

                <ThemedText
                  style={{
                    flex: 1,
                    fontWeight: selected ? "700" : "400",
                  }}
                >
                  {entry.caption}
                </ThemedText>
              </View>
            </Pressable>
          );
        })}

        {rows.length === 0 && (
          <ThemedText>
            Keine Menüeinträge vorhanden.
          </ThemedText>
        )}
      </View>
    </Card>
  );
}
