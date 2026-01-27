import { Pressable, View } from "react-native";
import { H4 } from "../stylistic/H4";
import { StyleSheet } from "react-native-unistyles";
import { useUnistyles } from "react-native-unistyles";
import { Icon, IconName } from "./Icon/Icon";
import { useState } from "react";

interface ActionButtonProps {
  label?: string;
  variant?: "primary" | "secondary";
  size?: "sm" | "md";
  onPress: () => void;
  icon?: IconName;
  iconSize?: number;
  disabled?: boolean;
}

export function ActionButton({
  label,
  variant = "secondary",
  size = "md",
  onPress,
  icon,
  iconSize = 20,
  disabled = false,
}: ActionButtonProps) {
  const { theme } = useUnistyles();

  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const isPrimary = variant === "primary";

  // ✅ genau wie Login: secondary hover => theme.colors.highlight
  const backgroundColor = isPrimary
    ? theme.colors.highlight
    : pressed
    ? theme.colors.border
    : hovered
    ? theme.colors.highlight
    : "transparent";

  const textColor = isPrimary ? theme.colors.background : theme.colors.text;

  return (
    <Pressable
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
        styles.button,
        sizeStyles[size],
        {
          backgroundColor,
          borderColor: theme.colors.border,
          opacity: disabled ? 0.6 : 1,
        },
      ]}
    >
      {icon && (
        <View style={styles.icon}>
          <Icon name={icon} size={iconSize} color={textColor} />
        </View>
      )}

      {label && (
        <H4
         
        >
          {label}
        </H4>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    
  },
  icon: {},
});

const sizeStyles = {
  sm: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    minHeight: 34,
  },
  md: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    minHeight: 42,
  },
} as const;