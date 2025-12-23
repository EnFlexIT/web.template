import { Pressable, View } from "react-native";
import { Text } from "../stylistic/Text";
import { StyleSheet } from "react-native-unistyles";
import { useUnistyles } from "react-native-unistyles";
import { Icon, IconName } from "./Icon/Icon";

interface ActionButtonProps {
  label?: string;
  variant?: "primary" | "secondary";
  onPress: () => void;

 
  icon?: IconName;
  iconSize?: number;
}

export function ActionButton({
  label,
  variant = "secondary",
  onPress,
  icon,
  iconSize = 24,
}: ActionButtonProps) {
  const { theme } = useUnistyles();
  const isPrimary = variant === "primary";

  const iconColor = isPrimary
    ? theme.colors.background
    : theme.colors.text;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.button,
        {
          borderColor: theme.colors.border,
          backgroundColor: isPrimary
            ? theme.colors.highlight
            : "transparent",
        },
      ]}
    >
      {/* ICON */}
      {icon && (
        <View style={styles.icon}>
          <Icon
            name={icon}
            size={iconSize}
            color={iconColor}
          />
        </View>
      )}

      {/* LABEL */}
      {label && (
        <Text
          style={{
            color: iconColor,
            fontWeight: "600",
          }}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  icon: {},
});
