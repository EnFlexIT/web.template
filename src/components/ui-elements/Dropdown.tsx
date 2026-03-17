import React, { useCallback, useMemo, useRef, useState } from "react";
import { Modal, Pressable, View, useWindowDimensions } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Text } from "../stylistic/Text";
import { ThemedText } from "../themed/ThemedText";

type DropdownSize = "xs" | "sm" | "md";
type DropdownAppearance = "field" | "menu";
type DropdownStatusTone = "green" | "yellow" | "red" | "neutral";

type DropdownOptionMeta = {
  subtitle?: string;
  tone?: DropdownStatusTone;
};

interface DropdownProps<T extends string> {
  value: T;
  options: Record<T, string>;
  onChange: (value: T) => void;
  disabled?: boolean;
  maxMenuHeight?: number;
  size?: DropdownSize;
  appearance?: DropdownAppearance;
  menuWidth?: number;

  optionMeta?: Partial<Record<T, DropdownOptionMeta>>;
  showSelectedToneDot?: boolean;
  showOptionToneDot?: boolean;

  /**
   * Optionaler zusätzlicher Y-Abstand für das Menü.
   * Besonders nützlich bei Footer-Dropdowns mit appearance="menu".
   */
  menuOffsetY?: number;
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
  optionMeta,
  showSelectedToneDot = false,
  showOptionToneDot = false,
  menuOffsetY,
}: DropdownProps<T>) {
  const { theme } = useUnistyles();
  const { width: screenW, height: screenH } = useWindowDimensions();

  const buttonRef = useRef<View>(null);
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<AnchorRect | null>(null);

  const selectedLabel = options[value] ?? String(value);
  const selectedMeta = optionMeta?.[value];
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

    const DEFAULT_GAP = 8;
    const footerMenuGap = menuOffsetY ?? 18;

    const menuW = appearance === "menu" ? menuWidth : anchor.width;
    const menuH = Math.min(maxMenuHeight, keys.length * rowH);

    let left = anchor.x;
    let top =
      appearance === "menu"
        ? anchor.y - menuH - footerMenuGap
        : anchor.y + anchor.height + DEFAULT_GAP;

    if (appearance !== "menu" && top + menuH > screenH - 8) {
      top = Math.max(8, anchor.y - DEFAULT_GAP - menuH);
    }

    if (appearance === "menu" && top < 8) {
      top = anchor.y + anchor.height + DEFAULT_GAP;
    }

    if (top + menuH > screenH - 8) {
      top = Math.max(8, screenH - menuH - 8);
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
      zIndex: 9999,
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
    menuOffsetY,
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
          {showSelectedToneDot ? (
            <StatusDot tone={selectedMeta?.tone ?? "neutral"} />
          ) : null}

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
              {keys.map((key, index) => {
                const active = key === value;
                const meta = optionMeta?.[key];
                const isLast = index === keys.length - 1;

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
                        borderBottomWidth: isLast ? 0 : 1,
                      },
                      active && {
                        backgroundColor: theme.colors.background,
                      },
                    ]}
                  >
                    <View style={styles.itemContent}>
                      <View style={styles.itemMainRow}>
                        {showOptionToneDot ? (
                          <StatusDot tone={meta?.tone ?? "neutral"} />
                        ) : null}

                        <ThemedText numberOfLines={1} style={styles.itemLabel}>
                          {options[key]}
                        </ThemedText>
                      </View>

                      {meta?.subtitle ? (
                        <ThemedText numberOfLines={1} style={styles.itemSubtitle}>
                          {meta.subtitle}
                        </ThemedText>
                      ) : null}
                    </View>
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

function StatusDot({ tone }: { tone: DropdownStatusTone }) {
  return (
    <View
      style={[
        styles.statusDot,
        tone === "green" && styles.statusDotGreen,
        tone === "yellow" && styles.statusDotYellow,
        tone === "red" && styles.statusDotRed,
        tone === "neutral" && styles.statusDotNeutral,
      ]}
    />
  );
}

const styles = StyleSheet.create((theme) => ({
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
    zIndex: 9998,
  },

  menuBase: {
    borderWidth: 1,
    overflow: "hidden",
    elevation: 8,
    zIndex: 9999,
  },

  itemBase: {
    justifyContent: "center",
  },

  itemContent: {
    gap: 2,
  },

  itemMainRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  itemLabel: {
    flex: 1,
  },

  itemSubtitle: {
    fontSize: 11,
    opacity: 0.65,
    marginLeft: 16,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    flexShrink: 0,
  },

  statusDotGreen: {
    backgroundColor: "#16A34A",
  },

  statusDotYellow: {
    backgroundColor: "#EAB308",
  },

  statusDotRed: {
    backgroundColor: "#DC2626",
  },

  statusDotNeutral: {
    backgroundColor: theme.colors.border,
  },
}));

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