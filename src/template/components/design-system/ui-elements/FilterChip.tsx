import React, {
  useState,
} from "react";

import {
  Pressable,
  View,
} from "react-native";

import {
  StyleSheet,
  useUnistyles,
} from "react-native-unistyles";

import {
  Icon,
  type IconName,
} from "./Icon/Icon";

import {
  ThemedText,
} from "@/template/components/design-system/themed/ThemedText";

interface FilterChipProps {
  label: string;

  selected?: boolean;

  onPress: () => void;

  icon?: IconName;

  count?: number;

  disabled?: boolean;
}

export function FilterChip({
  label,
  selected = false,
  onPress,
  icon,
  count,
  disabled = false,
}: FilterChipProps) {
  const { theme } =
    useUnistyles();

  const [
    hovered,
    setHovered,
  ] = useState(false);

  const backgroundColor =
    selected
      ? theme.colors.highlight
      : hovered
        ? theme.colors.background
        : theme.colors.card;

  const textColor =
    selected
      ? theme.colors.background
      : theme.colors.text;

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      onHoverIn={() => {
        setHovered(true);
      }}
      onHoverOut={() => {
        setHovered(false);
      }}
      style={[
        styles.chip,
        {
          backgroundColor,
          borderColor:
            selected
              ? theme.colors.highlight
              : theme.colors.border,

          opacity:
            disabled
              ? 0.5
              : 1,
        },
      ]}
    >
      {icon ? (
        <Icon
          name={icon}
          size={14}
          color={textColor}
        />
      ) : null}

      <ThemedText
        numberOfLines={1}
        style={[
          styles.label,
          {
            color: textColor,
          },
        ]}
      >
        {label}
      </ThemedText>

      {typeof count === "number" ? (
        <View
          style={[
            styles.count,
            {
              borderColor:
                selected
                  ? theme.colors.background
                  : theme.colors.border,
            },
          ]}
        >
          <ThemedText
            style={[
              styles.countText,
              {
                color: textColor,
              },
            ]}
          >
            {count}
          </ThemedText>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles =
  StyleSheet.create(() => ({
    chip: {
      minHeight: 30,

      paddingHorizontal: 10,
      paddingVertical: 5,

      borderWidth: 1,
      borderRadius: 999,

      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",

      gap: 6,

      alignSelf: "flex-start",
    },

    label: {
      fontSize: 13,
      fontWeight: "500",
    },

    count: {
      minWidth: 18,
      height: 18,

      paddingHorizontal: 4,

      borderWidth: 1,
      borderRadius: 999,

      alignItems: "center",
      justifyContent: "center",
    },

    countText: {
      fontSize: 10,
      lineHeight: 12,
      fontWeight: "600",
    },
  }));

  