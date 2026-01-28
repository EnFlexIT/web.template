import React, { useMemo, useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { H4 } from "../../components/stylistic/H4";
import { StylisticTextInput } from "../../components/stylistic/StylisticTextInput";

export type SelectableItem<T extends string> = {
  id: T;
  label: string;
  subtitle?: string;
  disabled?: boolean;
};

type Props<T extends string> = {
  items: SelectableItem<T>[];
  value: T;
  onChange: (id: T) => void;

  maxHeight?: number;

  // optional (Default: true)
  showSearch?: boolean;
  searchPlaceholder?: string;
  emptyText?: string;
};

export function SelectableList<T extends string>({
  items,
  value,
  onChange,
  maxHeight = 220,
  showSearch = true,
  searchPlaceholder = "Suchen…",
  emptyText = "Keine Einträge gefunden",
}: Props<T>) {
  const { theme } = useUnistyles();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!showSearch) return items;

    const needle = q.trim().toLowerCase();
    if (!needle) return items;

    return items.filter((it) => {
      const hay = `${it.label} ${it.subtitle ?? ""}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [items, q, showSearch]);

  return (
    <View style={[styles.container, {height:120 ,borderColor: theme.colors.border }]}>
      {showSearch && (
        <StylisticTextInput
          value={q}
          onChangeText={setQ}
          placeholder={searchPlaceholder}
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
        showsVerticalScrollIndicator={true}   // ✅ Scrollbar
        alwaysBounceVertical={true}           // iOS fühlt sich “scrollbar” an
        contentContainerStyle={{ paddingBottom: 6 }}
        ListEmptyComponent={
          <View style={{ paddingVertical: 10 }}>
            <H4 style={{ opacity: 0.7 }}>{emptyText}</H4>
          </View>
        }
        renderItem={({ item }) => {
          const active = item.id === value;
          const disabled = !!item.disabled;

          return (
            <Pressable
              disabled={disabled}
              onPress={() => onChange(item.id)}
              style={[
                styles.item,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: active
                    ? theme.colors.background
                    : theme.colors.card,
                  opacity: disabled ? 0.5 : 1,
                },
              ]}
            >
              <View style={{ gap: 2 }}>
                <H4
                  numberOfLines={1}
                  style={{
                    color: active ? theme.colors.highlight : theme.colors.text,
                    fontWeight: active ? "700" : "500",
                    
                  }}
                >
                  {item.label}
                </H4>

                {item.subtitle ? (
                  <H4 numberOfLines={1} style={{ opacity: 0.7, fontSize: 12 }}>
                    {item.subtitle}
                  </H4>
                ) : null}
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
    padding: 8,
    overflow: "hidden",
  
  },
  search: {
    borderWidth: 1,
    paddingVertical: 8,   
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  item: {
    borderWidth: 1,
    paddingVertical: 8,   
    paddingHorizontal: 10,
   
  },
});