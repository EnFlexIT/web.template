import { View, TextInput as RNTextInput } from "react-native";
import { Text } from "../stylistic/Text";
import { StyleSheet } from "react-native-unistyles";
import { useUnistyles } from "react-native-unistyles";

interface TextInputProps {
    label?: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    keyboardType?: "default" | "numeric" | "email-address";
    disabled?: boolean;
    secureTextEntry?: boolean; // ✅ NEU
}

export function TextInput({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = "default",
    disabled = false,
    secureTextEntry = false, // ✅ NEU
}: TextInputProps) {
    const { theme } = useUnistyles();

    return (
        <View style={{ gap: 4 }}>
            {label && (
                <Text style={styles.label}>
                    {label}
                </Text>
            )}

            <RNTextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                keyboardType={keyboardType}
                editable={!disabled}
                secureTextEntry={secureTextEntry} // ✅ NEU
                placeholderTextColor={theme.colors.text + "80"}
                style={[
                    styles.input,
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
    input: {
        height: 40,
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 10,
        fontSize: 14,
    },
});
