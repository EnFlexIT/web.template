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

  /** optional: eigene Styles */
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;

  /** optional: UI Verhalten */
  hoverBorderHighlight?: boolean; // default true
  disabled?: boolean; // default false

  /** ✅ padding variants */
  padding?: CardPadding; // default "md"
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
  hoverBorderHighlight = true,
  disabled = false,
  padding = "md",
}: CardProps) {
  const [over, setOver] = useState(false);
  const { theme } = useUnistyles();
  const colors: any = theme.colors;

  const backgroundColor =
    colors.surface ?? colors.card ?? colors.background ?? "transparent";

  const baseBorder = colors.border ?? theme.colors.text;
  const borderColor =
    hoverBorderHighlight && over ? theme.colors.highlight : baseBorder;

  const isPressable = !!onPress && !disabled;

  const paddingValue = useMemo(() => PADDING_MAP[padding], [padding]);

  return (
    <ThemedView style={[styles.card, { backgroundColor, borderColor }, style]}>
      <Pressable
        disabled={!isPressable}
        onPress={onPress}
        onHoverIn={() => setOver(true)}
        onHoverOut={() => setOver(false)}
        style={({ pressed }) => [
          styles.pressable,
          { padding: paddingValue, opacity: pressed ? 0.88 : 1 },
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
    borderRadius: 10,
    overflow: "hidden",
  },
  pressable: {
    
  },
}));
