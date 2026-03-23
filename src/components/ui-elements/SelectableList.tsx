import React, { useMemo, useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { useTranslation } from "react-i18next";

import { StylisticTextInput } from "../../components/stylistic/StylisticTextInput";
import { ThemedText } from "../themed/ThemedText";

export type SelectableItem<T extends string> = {
  id: T;
  label: string;
  subtitle?: string;
  disabled?: boolean;
};

type ListVariant = "primary" | "secondary";
type ListSize = "xs" | "sm" | "md" | "xs0";

type Props<T extends string> = {
  items: SelectableItem<T>[];
  value: T;
  onChange: (id: T) => void;

  maxHeight?: number;

  // optional (Default: true)
  showSearch?: boolean;
  searchPlaceholder?: string;
  emptyText?: string;

  minVisibleRows?: number;

  variant?: ListVariant; // default: "secondary"
  size?: ListSize; // default: "sm"
};

export function SelectableList<T extends string>({
  items,
  value,
  onChange,
  maxHeight = 200,
  showSearch = true,
  searchPlaceholder,
  emptyText = "Keine Einträge gefunden",
  minVisibleRows = 4,
  variant = "secondary",
  size = "sm",
}: Props<T>) {
 


  const { theme } = useUnistyles();
  const [q, setQ] = useState("");

  // hover/pressed states per item (like ActionButton)
  const [hoveredId, setHoveredId] = useState<T | null>(null);
  const [pressedId, setPressedId] = useState<T | null>(null);
 const { t } = useTranslation(["Settings"]);
  const filtered = useMemo(() => {
    if (!showSearch) return items;
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((it) => {
      const hay = `${it.label} ${it.subtitle ?? ""}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [items, q, showSearch]);

  // --- sizing (so X rows are visible) ---
  const rowMinHeight = itemSizeStyles[size].minHeight;
  const containerPadding = styles.container.padding * 2;
  const headerHeight = showSearch
    ? styles.search.paddingVertical * 2 + 22 + styles.search.marginBottom
    : 0;

  const SEPARATOR = 6;
  const minListHeight =
    containerPadding +
    headerHeight +
    minVisibleRows * rowMinHeight +
    (minVisibleRows - 1) * SEPARATOR;

  const containerHeight = Math.max(minListHeight, maxHeight);

  const isPrimary = variant === "primary";

  return (
    <View
      style={[
        styles.container,
        {
          height: containerHeight,
          borderColor: theme.colors.border,
        },
      ]}
    >
      {showSearch && (
        <StylisticTextInput
          value={q}
          onChangeText={setQ}
          placeholder={t("search")}
          style={[
            styles.search,
            {
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.card,
              color: theme.colors.text,
            },
          ]}
        />
      )}

      <FlatList
        data={filtered}
        keyExtractor={(it) => it.id}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator
        contentContainerStyle={{ paddingBottom: 6 }}
        ListEmptyComponent={
          <View style={{ paddingVertical: 10 }}>
            <ThemedText style={{ opacity: 0.3 }}>{emptyText}</ThemedText>
          </View>
        }
        renderItem={({ item }) => {
          const active = item.id === value;
          const disabled = !!item.disabled;
          const hovered = hoveredId === item.id;
          const pressed = pressedId === item.id;

          // determine background and text colors
          const backgroundColor = isPrimary
            ? theme.colors.highlight
            : active
            ? theme.colors.background
            : pressed
            ? theme.colors.border
            : hovered
            ? theme.colors.highlight
            : theme.colors.card;

          const textColor = isPrimary ? theme.colors.background : theme.colors.text;

          return (
            <Pressable
              disabled={disabled}
              onPress={() => onChange(item.id)}
              onHoverIn={() => setHoveredId(item.id)}
              onHoverOut={() => {
                setHoveredId(null);
                setPressedId(null);
              }}
              onPressIn={() => setPressedId(item.id)}
              onPressOut={() => setPressedId(null)}
              onFocus={() => setHoveredId(item.id)}
              style={[
                styles.itemBase,
                itemSizeStyles[size],
                {
                  borderColor: theme.colors.border,
                  backgroundColor,
                  opacity: disabled ? 0.5 : 1,
                },
              ]}
            >
              <View style={styles.inlineRow}>
                <ThemedText
                  numberOfLines={1}
                  style={{
                    color: textColor,
                    flexShrink: 1,
                  }}
                >
                  {item.label}
                </ThemedText>

                {!!item.subtitle && (
                  <ThemedText
                    numberOfLines={1}
                    style={{
                      opacity: isPrimary ? 0.65 : 0.3,
                      marginLeft: 6,
                      flexShrink: 1,
                      color: isPrimary ? theme.colors.background : theme.colors.text,
                    }}
                  >
                    ({item.subtitle})
                  </ThemedText>
                )}
              </View>
            </Pressable>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderWidth: 1,
    padding: 5,
    overflow: "hidden",
  
    
  },
  search: {
    borderWidth: 1,
    paddingVertical: 2,
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  itemBase: {

   marginBottom:-3
   
  },
  inlineRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
});

const itemSizeStyles = {
  xs0: {
  
    paddingHorizontal: 4,
    minHeight: 20,
  },
  xs: {
     borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
    minHeight: 28,
  },
  sm: {
     borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    minHeight: 34,
  },
  md: {
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minHeight: 42,
  },
} as const;