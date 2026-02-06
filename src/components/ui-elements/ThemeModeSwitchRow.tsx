import React, { useMemo, useState } from "react";
import { Pressable, Switch, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { H4 } from "../stylistic/H4";
import { ThemedText } from "../themed/ThemedText";

interface SettingsSwitchRowProps {
  label: string;
  value: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  description?: string;

  // Optional: rechts neben dem Switch noch Text anzeigen
  showStatusText?: boolean;
  statusOnText?: string;
  statusOffText?: string;
}

export function SettingsSwitchRow({
  label,
  value,
  onChange,
  disabled = false,
  description,
  showStatusText = true,
  statusOnText = "Accepted",
  statusOffText = "Not accepted",
}: SettingsSwitchRowProps) {
  const { theme } = useUnistyles();
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const backgroundColor = useMemo(() => {
    if (pressed) return theme.colors.border;
    if (hovered) return theme.colors.highlight;
    return "transparent";
  }, [pressed, hovered, theme.colors.border, theme.colors.highlight]);

  const handleToggle = () => {
    if (disabled) return;
    onChange(!value);
  };

  return (
    <Pressable
      disabled={disabled}
      onPress={handleToggle}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => {
        setHovered(false);
        setPressed(false);
      }}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onFocus={() => setHovered(true)}
      style={[
        styles.row,
        {
          backgroundColor,
          borderColor: theme.colors.border,
          opacity: disabled ? 0.6 : 1,
        },
      ]}
    >
      <View style={styles.left}>
        <H4 style={styles.nonSelect}>{label}</H4>
        {description ? (
          <ThemedText style={[styles.description, styles.nonSelect]}>
            {description}
          </ThemedText>
        ) : null}
      </View>

      <View style={styles.right}>
        {showStatusText ? (
          <ThemedText style={[styles.statusText, styles.nonSelect]}>
            {value ? statusOnText : statusOffText}
          </ThemedText>
        ) : null}

        <Switch
          value={value}
          onValueChange={handleToggle}
          disabled={disabled}
          trackColor={{
            false: theme.colors.border,
            true: theme.colors.highlight,
          }}
          thumbColor={theme.colors.background}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  left: {
    flex: 1,
    gap: 4,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statusText: {
    opacity: 0.9,
  },
  description: {
    fontSize: 12,
    opacity: 0.8,
  },
  nonSelect: {
    userSelect: "none",
  },
}));
