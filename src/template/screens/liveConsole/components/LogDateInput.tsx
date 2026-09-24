import React from "react";

import {
  Platform,
  View,
} from "react-native";

import {
  useUnistyles,
} from "react-native-unistyles";

import {
  StyleSheet,
} from "react-native-unistyles";

import {
  TextInput,
  ThemedText,
} from "@design-system";

//**************************************************************************** */

type LogDateInputProps = {
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (
    value: string,
  ) => void;
};

//**************************************************************************** */

export function LogDateInput({
  label,
  value,
  disabled = false,
  onChange,
}: LogDateInputProps) {
  const { theme } =
    useUnistyles();

  if (
    Platform.OS === "web"
  ) {
    const webInputStyle:
      React.CSSProperties = {
      width: "100%",
      minHeight: 42,
      boxSizing:
        "border-box",
      padding:
        "8px 10px",
      border:
        `1px solid ${theme.colors.border}`,
      borderRadius: 4,
      backgroundColor:
        theme.colors.card,
      color:
        theme.colors.text,
      fontSize: 14,
      fontFamily:
        "inherit",
      opacity:
        disabled
          ? 0.5
          : 1,
    };

    return (
      <View style={s.field}>
        <ThemedText
          style={s.label}
        >
          {label}
        </ThemedText>

        <input
          type="date"
          value={value}
          disabled={disabled}
          onChange={(
            event,
          ) => {
            onChange(
              event
                .currentTarget
                .value,
            );
          }}
          style={
            webInputStyle
          }
        />
      </View>
    );
  }

  return (
    <View style={s.field}>
      <TextInput
        label={label}
        value={value}
        placeholder="YYYY-MM-DD"
        disabled={disabled}
        onChangeText={
          onChange
        }
      />
    </View>
  );
}

//**************************************************************************** */

const s = StyleSheet.create({
  field: {
    width: "100%",
    maxWidth: 240,
    gap: 4,
  },

  label: {
    fontSize: 13,
    opacity: 0.7,
  },
});