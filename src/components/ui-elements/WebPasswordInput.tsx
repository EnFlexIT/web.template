// src/components/ui-elements/WebPasswordInput.tsx
import React from "react";
import { Pressable, View, ViewStyle } from "react-native";
import AntDesign from "@expo/vector-icons/AntDesign";
import { StyleSheet } from "react-native-unistyles";

import { inputSizeStyles } from "./TextInput";

type InputSize = "xs" | "sm" | "md";

interface WebPasswordInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
  size?: InputSize;
  isVisible: boolean;
  setIsVisible: (value: boolean) => void;
  style?: ViewStyle | ViewStyle[];
  inputStyle?: any;
  onBlur?: () => void;
  onFocus?: () => void;
  onSubmitEditing?: () => void;
  theme: any;
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
  theme,
}: WebPasswordInputProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const block = (e: any) => {
    e.preventDefault?.();
    e.stopPropagation?.();
    return false;
  };

  const moveCaretToEnd = () => {
    const el = inputRef.current;
    if (!el) return;
    try {
      const pos = el.value.length;
      el.setSelectionRange(pos, pos);
    } catch {}
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const key = e.key.toLowerCase();

    if ((e.ctrlKey || e.metaKey) && ["c", "x", "v", "a"].includes(key)) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    if (key === "enter") {
      onSubmitEditing?.();
      return;
    }

    requestAnimationFrame(moveCaretToEnd);
  };

  const handleSelect = (e: React.SyntheticEvent<HTMLInputElement>) => {
    e.preventDefault?.();
    moveCaretToEnd();
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLInputElement>) => {
    if (e.detail > 1) {
      e.preventDefault();
      moveCaretToEnd();
    }
  };

  return (
    <View style={{ position: "relative" }}>
      <input
        ref={inputRef}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        type={isVisible ? "text" : "password"}
        autoComplete="new-password"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        onChange={(e) => onChangeText(e.target.value)}
        onBlur={onBlur}
        onFocus={onFocus}
        onCopy={block}
        onCut={block}
        onPaste={block}
        onContextMenu={block}
        onDragStart={block}
        onDrop={block}
        onSelect={handleSelect}
        onMouseDown={handleMouseDown}
        onKeyDown={handleKeyDown}
        style={{
          ...styles.inputBase,
          ...inputSizeStyles[size],
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
          color: theme.colors.text,
          opacity: disabled ? 0.5 : 1,
          paddingRight: 38,
          userSelect: "none",
          WebkitUserSelect: "none",
          MozUserSelect: "none",
          outline: "none",
          width: "100%",
          boxSizing: "border-box",
          ...(StyleSheet.flatten(style) || {}),
          ...(StyleSheet.flatten(inputStyle) || {}),
        }}
      />

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
    </View>
  );
}

const styles = {
  inputBase: {
    borderWidth: 1,
    borderStyle: "solid" as const,
    paddingLeft: 10,
    paddingRight: 10,
    borderRadius: 0,
  },
  right: {
    position: "absolute" as const,
    right: 10,
    top: 0,
    bottom: 0,
    width: 28,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    //display: "flex",
  },
};