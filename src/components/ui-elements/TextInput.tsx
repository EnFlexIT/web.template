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
import { WebPasswordInput } from "./WebPasswordInput";

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
  passwordToggle?: boolean;
  right?: React.ReactNode;
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

  const showEye = passwordToggle;
  const showRight = showEye || !!right;
  const isPasswordField = passwordToggle || secureTextEntry;

  // WEB: eigenes Passwortfeld ohne Browser-Standard-Icon
  if (Platform.OS === "web" && isPasswordField) {
    return (
      <View style={{ gap: 4 }}>
        {label && <Text style={styles.label}>{label}</Text>}

        <WebPasswordInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          disabled={disabled}
          size={size}
          isVisible={isVisible}
          setIsVisible={setIsVisible}
          style={style}
          inputStyle={inputStyle}
          onBlur={onBlur}
          onFocus={onFocus}
          onSubmitEditing={onSubmitEditing}
          returnKeyType={returnKeyType}
          theme={theme}
          showEye={showEye}
          right={right}
          autoCapitalize={autoCapitalize}
        />
      </View>
    );
  }

  const nativeSecure = passwordToggle ? !isVisible : secureTextEntry;

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
          secureTextEntry={nativeSecure}
          contextMenuHidden={isPasswordField}
          selectTextOnFocus={!isPasswordField}
          autoCorrect={false}
          spellCheck={false}
          style={[
            styles.inputBase,
            inputSizeStyles[size],
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              color: theme.colors.text,
              opacity: disabled ? 0.5 : 1,
            },
            showRight ? { paddingRight: 38 } : null,
            style,
            inputStyle,
          ]}
        />

        {showEye ? (
          <Pressable
            onPressIn={() => setIsVisible(true)}
            onPressOut={() => setIsVisible(false)}
            onTouchEnd={() => setIsVisible(false)}
            onTouchCancel={() => setIsVisible(false)}
            hitSlop={10}
            style={styles.right}
            disabled={disabled}
          >
            <AntDesign
              name={isVisible ? "eye" : "eye-invisible"}
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

export const inputSizeStyles = {
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