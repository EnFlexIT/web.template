import React, { useCallback, useMemo, useRef, useState } from "react";
import { Modal, Pressable, View, useWindowDimensions } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Text } from "../stylistic/Text";
import { ThemedText } from "../themed/ThemedText";
type DropdownSize = "xs" | "sm" | "md";
type DropdownAppearance = "field" | "menu";

interface DropdownProps<T extends string> {
  value: T;
  options: Record<T, string>;
  onChange: (value: T) => void;
  disabled?: boolean;
  maxMenuHeight?: number;
  size?: DropdownSize;
  appearance?: DropdownAppearance;
  menuWidth?: number;
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
  appearance = "field",
  menuWidth = 180,
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

    const GAP = 14;

    let left = anchor.x;
    let top =
      appearance === "menu"
        ? anchor.y - GAP - Math.min(maxMenuHeight, keys.length * rowH)
        : anchor.y + anchor.height + GAP;

   const menuW = anchor.width;
    const menuH = Math.min(maxMenuHeight, keys.length * rowH);

    if (appearance !== "menu" && top + menuH > screenH - 8) {
      top = Math.max(8, anchor.y - GAP - menuH);
    }

    if (appearance === "menu" && top < 8) {
      top = anchor.y + anchor.height + GAP;
    }

    if (left + menuW > screenW - 8) {
      left = Math.max(8, screenW - menuW - 8);
    }

    if (left < 8) left = 8;

    return {
      position: "absolute" as const,
      left,
      top,
      width: menuW,
      maxHeight: maxMenuHeight,
    };
  }, [
    anchor,
    appearance,
    menuWidth,
    maxMenuHeight,
    keys.length,
    rowH,
    screenW,
    screenH,
  ]);

  return (
    <View
      style={[
        styles.wrapper,
        appearance === "menu" && { width: menuWidth },
      ]}
    >
      <Pressable
        ref={buttonRef}
        collapsable={false}
        disabled={disabled}
        onPress={measureAndOpen}
        style={[
          styles.buttonBase,
          sizeStyles[size].button,
          appearance === "menu"
            ? [
                styles.buttonMenu,
                {
                  width: menuWidth,
                  backgroundColor: "transparent",
                },
              ]
            : {
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.card,
              },
          { opacity: disabled ? 0.6 : 1 },
        ]}
      >
        <View style={styles.buttonInner}>
          <ThemedText numberOfLines={1} style={{ flex: 1 }}>
            {selectedLabel}
          </ThemedText>
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
                      {
                        borderBottomColor: theme.colors.border,
                      },
                      active && {
                        backgroundColor: theme.colors.background,
                      },
                    ]}
                  >
                    <ThemedText>
                      {options[key]}
                    </ThemedText>
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

  buttonMenu: {
    borderWidth: 0,
    justifyContent: "center",
    paddingHorizontal: 0,
    paddingVertical: 0,
    minHeight: 0,
  },

  buttonInner: {
    flexDirection: "row",
    alignItems: "center",
  },

  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.18)",
  },

  menuBase: {
    borderWidth: 1,
    overflow: "hidden",
    elevation: 8,
  },

  itemBase: {
    justifyContent: "center",
    borderBottomWidth: 1,
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