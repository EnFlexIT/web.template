import { View, TextInput as RNTextInput } from "react-native";
import { Text } from "../stylistic/Text";
import { StyleSheet } from "react-native-unistyles";
import { useUnistyles } from "react-native-unistyles";

type InputSize = "xs" | "sm" | "md";

interface TextInputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "email-address";
  disabled?: boolean;
  secureTextEntry?: boolean;
  size?: InputSize;
}

export function TextInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  disabled = false,
  secureTextEntry = false,
  size = "md", // ✅ default wie beim Button
}: TextInputProps) {
  const { theme } = useUnistyles();

  return (
    <View style={{ gap: 4 }}>
      {label && <Text style={styles.label}>{label}</Text>}

      <RNTextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        editable={!disabled}
        secureTextEntry={secureTextEntry}
        placeholderTextColor={theme.colors.text + "80"}
        style={[
          styles.inputBase,
          inputSizeStyles[size],
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
            color: theme.colors.text,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    opacity: 0.7,
  },
  inputBase: {
    borderWidth: 1,
    paddingHorizontal: 10,
  },
});

const inputSizeStyles = {
  xs: {
    minHeight: 28,
    paddingVertical: 4,
    fontSize: 13,
  },
  sm: {
    minHeight: 30,
    paddingVertical: 5,
    fontSize: 13.5,
  },
  md: {
    minHeight: 42,
    paddingVertical: 10,
    fontSize: 14,
  },
} as const;
