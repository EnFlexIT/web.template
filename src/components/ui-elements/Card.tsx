// src/components/ui-elements/Card/Card.tsx
import React, { ReactNode, useMemo, useState } from "react";
import { Pressable, ViewStyle, StyleProp } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useUnistyles } from "react-native-unistyles";
import { ThemedView } from "../themed/ThemedView";

type CardPadding = "none" | "sm" | "md" | "lg";

interface CardProps {
  children: ReactNode;
  onPress?: () => void;

  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;

  disabled?: boolean;
  padding?: CardPadding;
}

const PADDING_MAP: Record<CardPadding, number> = {
  none: 0,
  sm: 12,
  md: 16,
  lg: 20,
};

export function Card({
  children,
  onPress,
  style,
  contentStyle,
  disabled = false,
  padding = "md",
}: CardProps) {
  const { theme } = useUnistyles();
  const [hovered, setHovered] = useState(false);

  const paddingValue = useMemo(() => PADDING_MAP[padding], [padding]);
  const isPressable = !!onPress && !disabled;

  return (
    <ThemedView
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
        style,
      ]}
    >
      <Pressable
        disabled={!isPressable}
        onPress={onPress}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        style={({ pressed }) => [
          styles.pressable,
          {
            padding: paddingValue,

           
            backgroundColor: hovered
              ? theme.colors.background
              : "transparent",

           
            opacity: pressed ? 0.9 : 1,
          },
          contentStyle,
        ]}
      >
        {children}
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create(() => ({
  card: {
    borderWidth: 1,
    overflow: "hidden",
  },
  pressable: {},
}));