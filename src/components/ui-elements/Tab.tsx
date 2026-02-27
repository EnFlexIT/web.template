import React, { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useUnistyles } from "react-native-unistyles";
import { H4 } from "../stylistic/H4";

export type TabProps = {
  label: string;
  active?: boolean;
  onPress: () => void;
  disabled?: boolean;

  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  testID?: string;
};

export function Tab({
  label,
  active = false,
  onPress,
  disabled = false,
  leftSlot,
  rightSlot,
  testID,
}: TabProps) {
  const { theme } = useUnistyles();
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const underlineColor = useMemo(() => {
    if (active) return theme.colors.highlight;
    if (pressed) return theme.colors.border;
    if (hovered) return theme.colors.highlight;
    return "transparent";
  }, [active, hovered, pressed, theme.colors]);

  return (
    <Pressable
      testID={testID}
      disabled={disabled}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => {
        setHovered(false);
        setPressed(false);
      }}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onFocus={() => setHovered(true)}
      style={[
        styles.tab,
        {
          borderBottomColor: underlineColor,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      <View style={styles.inner}>
        {leftSlot ? <View style={styles.slot}>{leftSlot}</View> : null}
        <H4>{label}</H4>
        {rightSlot ? <View style={styles.slot}>{rightSlot}</View> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tab: {
    paddingBottom: 10,
    borderBottomWidth: 2,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  slot: {
    alignItems: "center",
    justifyContent: "center",
  },
});