import React, { useCallback, useMemo, useRef, useState } from "react";
import { Modal, Pressable, View, useWindowDimensions } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useUnistyles } from "react-native-unistyles";
import { Text } from "../stylistic/Text";

type DropdownSize = "xs" | "sm" | "md";

interface DropdownProps<T extends string> {
  value: T;
  options: Record<T, string>;
  onChange: (value: T) => void;
  disabled?: boolean;
  maxMenuHeight?: number;

 
  size?: DropdownSize; 
}

type AnchorRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function Dropdown<T extends string>({
  value,
  options,
  onChange,
  disabled = false,
  maxMenuHeight = 220,
  size = "md",
}: DropdownProps<T>) {
  const { theme } = useUnistyles();
  const { width: screenW, height: screenH } = useWindowDimensions();

  const buttonRef = useRef<View>(null);
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<AnchorRect | null>(null);

  const selectedLabel = options[value] ?? String(value);
  const keys = useMemo(() => Object.keys(options) as T[], [options]);

  const rowH = sizeStyles[size].menuItemMinHeight;

  const measureAndOpen = useCallback(() => {
    if (!buttonRef.current) {
      setOpen(true);
      return;
    }

    buttonRef.current.measureInWindow(
      (x: number, y: number, w: number, h: number) => {
        setAnchor({ x, y, width: w, height: h });
        setOpen(true);
      },
    );
  }, []);

  const close = useCallback(() => setOpen(false), []);

  const menuStyle = useMemo(() => {
    if (!anchor) return null;

    const GAP = 6;

    let left = anchor.x;
    let top = anchor.y + anchor.height + GAP;
    const menuW = anchor.width;

    if (left + menuW > screenW - 8) left = Math.max(8, screenW - menuW - 8);
    if (left < 8) left = 8;

    const menuH = Math.min(maxMenuHeight, keys.length * rowH);
    if (top + menuH > screenH - 8) {
      top = Math.max(8, anchor.y - GAP - menuH);
    }

    return {
      position: "absolute" as const,
      left,
      top,
      width: menuW,
      maxHeight: maxMenuHeight,
    };
  }, [anchor, screenW, screenH, maxMenuHeight, keys.length, rowH]);

  return (
    <View style={styles.wrapper}>
      <Pressable
        disabled={disabled}
        onPress={measureAndOpen}
        style={[
          styles.buttonBase,
          sizeStyles[size].button,
          {
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.card,
            opacity: disabled ? 0.6 : 1,
          },
        ]}
      >
        <View ref={buttonRef} collapsable={false} style={styles.buttonInner}>
          <Text numberOfLines={1} style={{ flex: 1 }}>
            {selectedLabel}
          </Text>
          <Text style={{ opacity: 0.6, marginLeft: 8 }}>
            {open ? "▲" : "▼"}
          </Text>
        </View>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <Pressable style={styles.backdrop} onPress={close}>
          <Pressable
            onPress={() => {}}
            style={[
              styles.menuBase,
              menuStyle,
              {
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.card,
              },
            ]}
          >
            <View>
              {keys.map((key) => {
                const active = key === value;
                return (
                  <Pressable
                    key={key}
                    onPress={() => {
                      onChange(key);
                      close();
                    }}
                    style={[
                      styles.itemBase,
                      sizeStyles[size].item,
                      active && { backgroundColor: theme.colors.background },
                    ]}
                  >
                    <Text
                      style={{
                        color: active ? theme.colors.highlight : theme.colors.text,
                        fontWeight: active ? "700" : "400",
                      }}
                    >
                      {options[key]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
  },

  buttonBase: {
    borderWidth: 1,
  },

  buttonInner: {
    flexDirection: "row",
    alignItems: "center",
  },

  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
  },

  menuBase: {
    borderWidth: 1,
    overflow: "hidden",
    elevation: 6,
  },

  itemBase: {
    justifyContent: "center",
  },
});


const sizeStyles = {
  xs: {
    button: {
      paddingVertical: 4,
      paddingHorizontal: 8,
      minHeight: 28,
    },
    item: {
      paddingVertical: 8,
      paddingHorizontal: 10,
      minHeight: 32,
    },
    menuItemMinHeight: 32,
  },
  sm: {
    button: {
      paddingVertical: 5,
      paddingHorizontal: 9,
      minHeight: 30,
    },
    item: {
      paddingVertical: 10,
      paddingHorizontal: 12,
      minHeight: 38,
    },
    menuItemMinHeight: 38,
  },
  md: {
    button: {
      paddingVertical: 10,
      paddingHorizontal: 12,
      minHeight: 42,
    },
    item: {
      paddingVertical: 12,
      paddingHorizontal: 12,
      minHeight: 44,
    },
    menuItemMinHeight: 44,
  },
} as const;
