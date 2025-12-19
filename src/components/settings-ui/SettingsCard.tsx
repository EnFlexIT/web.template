import React, { useState } from "react";
import { Pressable } from "react-native";
import { ThemedView } from "../themed/ThemedView"; 
import { Text } from "../stylistic/Text";
import { StyleSheet } from "react-native-unistyles";
import { useUnistyles } from "react-native-unistyles";

interface SettingsCardProps {
  title: string;
  description?: string;
  onPress?: () => void;
}

export function SettingsCard({ title, description, onPress }: SettingsCardProps) {
  const [over, setOver] = useState(false);
  const { theme } = useUnistyles();

  // ✅ Theme-safe Zugriff: falls einzelne Keys in eurem Theme anders heißen
  const colors: any = theme.colors;

  const backgroundColor =
    colors.surface ?? colors.card ?? colors.background ?? "transparent";

  const borderColor = over ? theme.colors.highlight : (colors.border ?? theme.colors.text);

  const titleColor = theme.colors.text;
  const descriptionColor = colors.textMuted ?? colors.subText ?? colors.textSecondary ?? theme.colors.text;

  return (
    <ThemedView
      style={[
        styles.card,
        {
          backgroundColor,
          borderColor,
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        onHoverIn={() => setOver(true)}
        onHoverOut={() => setOver(false)}
        style={({ pressed }) => [
          styles.pressable,
          { opacity: pressed ? 0.88 : 1 },
        ]}
      >
        <Text style={[styles.title, { color: titleColor }]}>{title}</Text>

        {!!description && (
          <Text style={[styles.description, { color: descriptionColor }]}>
            {description}
          </Text>
        )}
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create(() => ({
  card: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: "hidden",
  },
  pressable: {
    padding: 16,
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  description: {
    fontSize: 13,
    opacity: 0.8,
  },
}));
