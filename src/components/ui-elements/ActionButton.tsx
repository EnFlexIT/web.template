import { Pressable, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useUnistyles } from "react-native-unistyles";
import { Icon, IconName } from "./Icon/Icon";
import { useState } from "react";
import { ThemedText } from "../themed/ThemedText";

interface ActionButtonProps {
  label?: string;
  variant?: "primary" | "secondary";
  size?: "xs" | "sm" | "md";
  onPress: () => void;
  icon?: IconName;
  iconSize?: number;
  disabled?: boolean;
  tooltip?: string;
}

export function ActionButton({
  label,
  variant = "secondary",
  size = "md",
  onPress,
  icon,
  iconSize = 20,
  disabled = false,
  tooltip,
}: ActionButtonProps) {
  const { theme } = useUnistyles();

  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);

  const isPrimary = variant === "primary";

  const backgroundColor = isPrimary
    ? theme.colors.highlight
    : pressed
    ? theme.colors.border
    : hovered
    ? theme.colors.highlight
    : "transparent";

  const textColor = isPrimary ? theme.colors.background : theme.colors.text;

  function showTooltip() {
    if (!tooltip || disabled) return;
    setTooltipVisible(true);
  }

  function hideTooltip() {
    setTooltipVisible(false);
  }

  return (
    <View style={styles.wrapper}>
      {tooltipVisible && tooltip ? (
        <View
          style={[
            styles.tooltip,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <ThemedText style={styles.tooltipText}>{tooltip}</ThemedText>
        </View>
      ) : null}

      <Pressable
        disabled={disabled}
        onPress={onPress}
        onHoverIn={() => {
          setHovered(true);
          showTooltip();
        }}
        onHoverOut={() => {
          setHovered(false);
          setPressed(false);
          hideTooltip();
        }}
        onPressIn={() => setPressed(true)}
        onPressOut={() => {
          setPressed(false);
        }}
        onLongPress={showTooltip}
        delayLongPress={250}
        onFocus={() => {
          setHovered(true);
          showTooltip();
        }}
        onBlur={() => {
          setHovered(false);
          hideTooltip();
        }}
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
          <ThemedText style={{ color: textColor }}>
            {label}
          </ThemedText>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  wrapper: {
    position: "relative",
     alignSelf: "stretch",
  },
  button: {
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  icon: {},
  tooltip: {
    position: "absolute",
    bottom: "100%",
    marginBottom: 8,
    left: 0,
    maxWidth: 260,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    zIndex: 1000,
  },
  tooltipText: {
    fontSize: 12,
    lineHeight: 16,
  },
}));

const sizeStyles = {
  xs: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    minHeight: 28,
  },
  sm: {
    paddingVertical: 5,
    paddingHorizontal: 9,
    minHeight: 30,
  },
  md: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    minHeight: 42,
  },
} as const;