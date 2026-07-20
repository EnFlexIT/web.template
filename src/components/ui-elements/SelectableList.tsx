import React, {
  useMemo,
  useState,
} from "react";

import {
  FlatList,
  Pressable,
  View,
} from "react-native";

import {
  StyleSheet,
  useUnistyles,
} from "react-native-unistyles";

import {
  useTranslation,
} from "react-i18next";

import {
  StylisticTextInput,
} from "../../components/stylistic/StylisticTextInput";

import {
  ThemedText,
} from "../themed/ThemedText";

import {
  useThemedScrollbarWeb,
} from "../../hooks/useThemedScrollbarWeb";

export type SelectableItem<
  T extends string,
> = {
  id: T;
  label: string;
  subtitle?: string;
  disabled?: boolean;
};

type ListVariant =
  | "primary"
  | "secondary";

type ListSize =
  | "xs"
  | "sm"
  | "md"
  | "xs0";

type Props<T extends string> = {
  items: SelectableItem<T>[];
  value: T;
  onChange: (id: T) => void;

  maxHeight?: number;

  /**
   * Standardwert: true
   */
  showSearch?: boolean;

  searchPlaceholder?: string;
  emptyText?: string;

  minVisibleRows?: number;

  /**
   * Standardwert: secondary
   */
  variant?: ListVariant;

  /**
   * Standardwert: sm
   */
  size?: ListSize;
};

export function SelectableList<
  T extends string,
>({
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

  const { t } =
    useTranslation(["Settings"]);

  /**
   * nativeID des Wrappers.
   *
   * Die CSS-Regel wirkt dadurch auf die intern von
   * FlatList erzeugte Web-Scrollfläche.
   */
  const scrollbarNativeId =
    useThemedScrollbarWeb(
      "selectable-list-scrollbar",
    );

  const [query, setQuery] =
    useState("");

  const [
    hoveredId,
    setHoveredId,
  ] = useState<T | null>(null);

  const [
    pressedId,
    setPressedId,
  ] = useState<T | null>(null);

  const filteredItems =
    useMemo(() => {
      if (!showSearch) {
        return items;
      }

      const needle =
        query
          .trim()
          .toLowerCase();

      if (!needle) {
        return items;
      }

      return items.filter(
        (item) => {
          const searchableText =
            [
              item.label,
              item.subtitle ?? "",
            ]
              .join(" ")
              .toLowerCase();

          return searchableText.includes(
            needle,
          );
        },
      );
    }, [
      items,
      query,
      showSearch,
    ]);

  const rowMinHeight =
    itemSizeStyles[size].minHeight;

  const containerPadding =
    styles.container.padding * 2;

  const searchHeight =
    showSearch
      ? styles.search.paddingVertical *
          2 +
        22 +
        styles.search.marginBottom
      : 0;

  const separatorHeight = 6;

  const visibleSeparators =
    Math.max(
      0,
      minVisibleRows - 1,
    );

  const minListHeight =
    containerPadding +
    searchHeight +
    minVisibleRows *
      rowMinHeight +
    visibleSeparators *
      separatorHeight;

  const containerHeight =
    Math.max(
      minListHeight,
      maxHeight,
    );

  const isPrimary =
    variant === "primary";

  return (
    <View
      style={[
        styles.container,
        {
          height:
            containerHeight,

          borderColor:
            theme.colors.border,

          backgroundColor:
            theme.colors.card,
        },
      ]}
    >
      {showSearch ? (
        <StylisticTextInput
          value={query}
          onChangeText={
            setQuery
          }
          placeholder={
            searchPlaceholder ??
            t("search")
          }
          style={[
            styles.search,
            {
              borderColor:
                theme.colors.border,

              backgroundColor:
                theme.colors.card,

              color:
                theme.colors.text,
            },
          ]}
        />
      ) : null}

      {/*
       * dataSet wird bewusst nicht verwendet.
       *
       * nativeID ist Bestandteil der typisierten React-Native-API.
       * Die CSS-Regel im Hook formatiert alle Scrollflächen innerhalb
       * dieses Wrappers.
       */}
      <View
        nativeID={
          scrollbarNativeId
        }
        style={
          styles.listWrapper
        }
      >
        <FlatList
          data={filteredItems}
          keyExtractor={(item) =>
            item.id
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
          style={styles.list}
          contentContainerStyle={
            styles.listContent
          }
          ListEmptyComponent={
            <View
              style={
                styles.emptyContainer
              }
            >
              <ThemedText
                style={
                  styles.emptyText
                }
              >
                {emptyText}
              </ThemedText>
            </View>
          }
          renderItem={({
            item,
          }) => {
            const active =
              item.id === value;

            const disabled =
              Boolean(
                item.disabled,
              );

            const hovered =
              hoveredId ===
              item.id;

            const pressed =
              pressedId ===
              item.id;

            const backgroundColor =
              isPrimary
                ? theme.colors
                    .highlight
                : active
                  ? theme.colors
                      .background
                  : pressed
                    ? theme.colors
                        .border
                    : hovered
                      ? theme.colors
                          .highlight
                      : theme.colors
                          .card;

            const textColor =
              isPrimary
                ? theme.colors
                    .background
                : theme.colors
                    .text;

            return (
              <Pressable
                disabled={
                  disabled
                }
                onPress={() =>
                  onChange(
                    item.id,
                  )
                }
                onHoverIn={() =>
                  setHoveredId(
                    item.id,
                  )
                }
                onHoverOut={() => {
                  setHoveredId(
                    null,
                  );

                  setPressedId(
                    null,
                  );
                }}
                onPressIn={() =>
                  setPressedId(
                    item.id,
                  )
                }
                onPressOut={() =>
                  setPressedId(
                    null,
                  )
                }
                onFocus={() =>
                  setHoveredId(
                    item.id,
                  )
                }
                onBlur={() => {
                  setHoveredId(
                    null,
                  );

                  setPressedId(
                    null,
                  );
                }}
                style={[
                  styles.itemBase,
                  itemSizeStyles[
                    size
                  ],
                  {
                    borderColor:
                      theme.colors
                        .border,

                    backgroundColor,

                    opacity:
                      disabled
                        ? 0.5
                        : 1,
                  },
                ]}
              >
                <View
                  style={
                    styles.inlineRow
                  }
                >
                  <ThemedText
                    numberOfLines={
                      1
                    }
                    style={[
                      styles.itemLabel,
                      {
                        color:
                          textColor,
                      },
                    ]}
                  >
                    {item.label}
                  </ThemedText>

                  {item.subtitle ? (
                    <ThemedText
                      numberOfLines={
                        1
                      }
                      style={[
                        styles.subtitle,
                        {
                          opacity:
                            isPrimary
                              ? 0.65
                              : 0.5,

                          color:
                            isPrimary
                              ? theme
                                  .colors
                                  .background
                              : theme
                                  .colors
                                  .text,
                        },
                      ]}
                    >
                      (
                      {
                        item.subtitle
                      }
                      )
                    </ThemedText>
                  ) : null}
                </View>
              </Pressable>
            );
          }}
          ItemSeparatorComponent={() => (
            <View
              style={
                styles.separator
              }
            />
          )}
        />
      </View>
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

  listWrapper: {
    flex: 1,
    minHeight: 0,
    overflow: "hidden",
  },

  list: {
    flex: 1,
    minHeight: 0,
  },

  listContent: {
    paddingBottom: 6,
  },

  itemBase: {
    marginBottom: -3,
  },

  inlineRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },

  itemLabel: {
    flexShrink: 1,
  },

  subtitle: {
    marginLeft: 6,
    flexShrink: 1,
  },

  separator: {
    height: 6,
  },

  emptyContainer: {
    paddingVertical: 10,
  },

  emptyText: {
    opacity: 0.5,
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