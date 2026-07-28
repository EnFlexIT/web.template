import React from "react";
import { View, Pressable } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import AntDesign from "@expo/vector-icons/AntDesign";

import { inputSizeStyles } from "./TextInput";

type InputSize = "xs" | "sm" | "md";

interface WebPasswordInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
  size?: InputSize;
  isVisible: boolean;
  setIsVisible: React.Dispatch<React.SetStateAction<boolean>>;
  style?: any;
  inputStyle?: any;
  onBlur?: () => void;
  onFocus?: () => void;
  onSubmitEditing?: () => void;
  returnKeyType?: "done" | "next" | "go" | "search" | "send";
  theme: any;
  showEye?: boolean;
  right?: React.ReactNode;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
}

function mapAutoCapitalize(value?: string) {
  switch (value) {
    case "characters":
      return "characters";
    case "words":
      return "words";
    case "sentences":
      return "sentences";
    case "none":
    default:
      return "none";
  }
}

function mapEnterKeyHint(
  value?: "done" | "next" | "go" | "search" | "send"
): React.HTMLAttributes<HTMLInputElement>["enterKeyHint"] {
  switch (value) {
    case "done":
      return "done";
    case "next":
      return "next";
    case "go":
      return "go";
    case "search":
      return "search";
    case "send":
      return "send";
    default:
      return "done";
  }
}

function flattenStyle(style: any): Record<string, any> {
  if (!style) return {};

  if (Array.isArray(style)) {
    return style.reduce((acc, item) => {
      if (!item) return acc;
      return { ...acc, ...flattenStyle(item) };
    }, {});
  }

  if (typeof style === "object") {
    return style;
  }

  return {};
}

export function WebPasswordInput({
  value,
  onChangeText,
  placeholder,
  disabled = false,
  size = "md",
  isVisible,
  setIsVisible,
  style,
  inputStyle,
  onBlur,
  onFocus,
  onSubmitEditing,
  returnKeyType,
  theme,
  showEye = true,
  right,
  autoCapitalize = "none",
}: WebPasswordInputProps) {
  const showRight = showEye || !!right;

  const webInputStyle: React.CSSProperties & {
    WebkitTextSecurity?: "none" | "disc";
  } = {
    width: "100%",
    outline: "none",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    color: theme.colors.text,
    opacity: disabled ? 0.5 : 1,
    borderRadius: 0,
    paddingLeft: 10,
    paddingRight: showRight ? 38 : 10,
    fontSize: inputSizeStyles[size].fontSize,
    minHeight: inputSizeStyles[size].minHeight,
    paddingTop: inputSizeStyles[size].paddingVertical,
    paddingBottom: inputSizeStyles[size].paddingVertical,
    boxSizing: "border-box",
    WebkitTextSecurity: isVisible ? "none" : "disc",
    ...flattenStyle(style),
    ...flattenStyle(inputStyle),
  };

  return (
    <View style={showRight ? styles.wrapper : undefined}>
      <input
        value={value}
        onChange={(e) => onChangeText(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        onBlur={onBlur}
        onFocus={onFocus}
        onKeyDown={(e) => {
          if (e.key === "Enter" && onSubmitEditing) {
            onSubmitEditing();
          }
        }}
        onCopy={(e) => e.preventDefault()}
        onCut={(e) => e.preventDefault()}
        // Einfügen bleibt erlaubt
        autoCorrect="off"
        spellCheck={false}
        autoCapitalize={mapAutoCapitalize(autoCapitalize)}
        enterKeyHint={mapEnterKeyHint(returnKeyType)}
        type="text"
        style={webInputStyle}
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
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
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