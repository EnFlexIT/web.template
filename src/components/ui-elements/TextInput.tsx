// src/components/ui-elements/TextInput.tsx
import React from "react";
import {
  View,
  TextInput as RNTextInput,
  Pressable,
  ViewStyle,
  Platform,
} from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useUnistyles } from "react-native-unistyles";
import AntDesign from "@expo/vector-icons/AntDesign";

import { Text } from "../stylistic/Text";

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

  //Passwort Toggle (zeigt Auge + toggelt)
  passwordToggle?: boolean;

  // optional: eigenes Right-Element (wenn nicht passwordToggle)
  right?: React.ReactNode;

  // wichtig: damit alte Screens nicht kaputt gehen
  style?: ViewStyle | ViewStyle[];
  inputStyle?: any;

  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  textContentType?: any;
  onBlur?: () => void;
  onFocus?: () => void;
  onSubmitEditing?: () => void;
  returnKeyType?: "done" | "next" | "go" | "search" | "send";
}

export function TextInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  disabled = false,
  secureTextEntry = false,
  size = "md",

  passwordToggle = false,
  right,

  style,
  inputStyle,

  autoCapitalize = "none",
  textContentType,
  onBlur,
  onFocus,
  onSubmitEditing,
  returnKeyType,
}: TextInputProps) {
  const { theme } = useUnistyles();

  const [isVisible, setIsVisible] = React.useState(false);

  const showEye = passwordToggle; // immer zeigen (auch web)
  const showRight = showEye || !!right;

  // Native: echtes secureTextEntry toggeln
  const nativeSecure = passwordToggle ? !isVisible : secureTextEntry;

  // Web: Browser-Passwort-Auge vermeiden + trotzdem maskieren
  const isWebPasswordMode = Platform.OS === "web" && passwordToggle;

  return (
    <View style={{ gap: 4 }}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={showRight ? { position: "relative" } : undefined}>
        <RNTextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          keyboardType={keyboardType}
          editable={!disabled}
          autoCapitalize={autoCapitalize}
          textContentType={textContentType}
          onBlur={onBlur}
          onFocus={onFocus}
          onSubmitEditing={onSubmitEditing}
          returnKeyType={returnKeyType}
          placeholderTextColor={theme.colors.text + "80"}
         
          // - Web: NICHT secureTextEntry nutzen -> sonst Browser-Auge (unstabil)
          // - Native: normal secureTextEntry
          secureTextEntry={isWebPasswordMode ? false : nativeSecure}
          style={[
            styles.inputBase,
            inputSizeStyles[size],
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              color: theme.colors.text,
              opacity: disabled ? 0.5 : 1,
            },

            //  Platz für Icon nur wenn rechts was ist
            showRight ? { paddingRight: 38 } : null,

            //  Web-Maskierung statt Browser-password
            isWebPasswordMode
              ? ({
                  // solange "unsichtbar": Punkte anzeigen
                  WebkitTextSecurity: isVisible ? "none" : "disc",
                  // optional: sorgt für konsistenteres Rendering
                  outlineStyle: "none",
                } as any)
              : null,

            style,
            inputStyle,
          ]}
        />

        {/* Right side */}
        {showEye ? (
          <Pressable
            onPress={() => setIsVisible((p) => !p)}
            hitSlop={10}
            style={styles.right}
            disabled={disabled}
          >
            <AntDesign
              name={isVisible ? "eye" : "eyeo"}
              size={18}
              color={theme.colors.text}
            />
          </Pressable>
        ) : right ? (
          <View style={styles.right}>{right}</View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    opacity: 0.7,
  },

  //wie dein Original
  inputBase: {
    borderWidth: 1,
    paddingHorizontal: 10,
  },

  right: {
    position: "absolute",
    right: 10,
    top: 0,
    bottom: 0,
    width: 28,
    justifyContent: "center",
    alignItems: "center",
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
