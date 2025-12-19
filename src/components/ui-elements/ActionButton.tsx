import { Pressable } from "react-native";
import { Text } from "../stylistic/Text";
import { StyleSheet } from "react-native-unistyles";
import { useUnistyles } from "react-native-unistyles";

interface ActionButtonProps {
  label: string;
  variant?: "primary" | "secondary";
  onPress: () => void;
}

export function ActionButton({
  label,
  variant = "secondary",
  onPress,
}: ActionButtonProps) {
  const { theme } = useUnistyles();

  const isPrimary = variant === "primary";

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
      <Text
        style={{
          color: isPrimary
            ? theme.colors.background
            : theme.colors.text,
          fontWeight: "600",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
});
