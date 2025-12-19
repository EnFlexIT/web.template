import { Pressable, View } from "react-native";
import { Text } from "../stylistic/Text";
import { StyleSheet } from "react-native-unistyles";
import { useUnistyles } from "react-native-unistyles";

interface CheckboxProps {
  value: boolean;
  label?: string;
  onChange: (value: boolean) => void;
}

export function Checkbox({ value, label, onChange }: CheckboxProps) {
  const { theme } = useUnistyles();

  return (
    <Pressable
      onPress={() => onChange(!value)}
      style={styles.row}
    >
      <View
        style={[
          styles.box,
          {
            borderColor: theme.colors.border,
            backgroundColor: value
              ? theme.colors.highlight
              : "transparent",
          },
        ]}
      >
        {value && (
          <Text
            style={{
              color: theme.colors.background,
              fontWeight: "600",
            }}
          >
            ✓
          </Text>
        )}
      </View>

      {label && (
        <Text style={{ opacity: 0.85 }}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  box: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
});
