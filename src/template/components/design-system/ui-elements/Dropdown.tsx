import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
} from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Text } from "@/template/components/design-system/stylistic/Text";
import { ThemedText } from "@/template/components/design-system/themed/ThemedText";
import Feather from "@expo/vector-icons/Feather";

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
  triggerLabel?: string;
  menuWidth?: number;
  triggerWidth?: number;
  hideChevron?: boolean;
  minimalMenu?: boolean;
  optionMeta?: Partial<Record<T, DropdownOptionMeta>>;
  optionIcons?: Partial<Record<T, React.ComponentProps<typeof Feather>["name"]>>;
  destructiveOptions?: readonly T[];
  showSelectedToneDot?: boolean;
  showOptionToneDot?: boolean;
  menuOffsetY?: number;
  menuPlacement?: "auto" | "above" | "below";
  onOpen?: () => void;
  onClose?: () => void;
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
  triggerLabel,
  menuWidth = 180,
  triggerWidth,
  hideChevron = false,
  minimalMenu = false,
  optionMeta,
  optionIcons,
  destructiveOptions,
  showSelectedToneDot = false,
  showOptionToneDot = false,
  menuOffsetY,
  menuPlacement,
  onOpen,
  onClose,
}: DropdownProps<T>) {
  const { theme } = useUnistyles();
  const { width: screenW, height: screenH } = useWindowDimensions();

  const buttonRef = useRef<View>(null);
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<AnchorRect | null>(null);

  const selectedLabel = triggerLabel ?? options[value] ?? String(value);
  const selectedMeta = optionMeta?.[value];
  const [hoveredOption, setHoveredOption] = useState<T | null>(null);
  const keys = useMemo(() => Object.keys(options) as T[], [options]);

  const rowH = sizeStyles[size].menuItemMinHeight;

  const handleClose = useCallback(() => {
    setOpen(false);
    onClose?.();
  }, [onClose]);

  const measureAndOpen = useCallback(() => {
    if (disabled) return;

    if (open) {
      handleClose();
      return;
    }

    onOpen?.();

    requestAnimationFrame(() => {
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
    });
  }, [disabled, open, handleClose, onOpen]);

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

    if (menuPlacement) {
      const below = anchor.y + anchor.height + DEFAULT_GAP;
      const above = anchor.y - menuH - footerMenuGap;
      const fitsBelow = below + menuH <= screenH - 8;
      const fitsAbove = above >= 8;

      if (menuPlacement === "above") {
        top = fitsAbove ? above : below;
      } else if (menuPlacement === "below") {
        top = fitsBelow ? below : above;
      } else if (fitsBelow) {
        top = below;
      } else if (fitsAbove) {
        top = above;
      } else {
        const spaceBelow = screenH - below - 8;
        const spaceAbove = anchor.y - footerMenuGap - 8;
        top = spaceBelow >= spaceAbove ? below : above;
      }
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
    menuPlacement,
  ]);

  return (
    <View
      style={[
        styles.wrapper,
        appearance === "menu" && { width: triggerWidth ?? menuWidth },
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
                  width: triggerWidth ?? menuWidth, backgroundColor: "transparent",
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

          {!hideChevron && (<Text style={{ opacity: 0.6, marginLeft: 8 }}>{open ? "▲" : "▼"}</Text>)}
        </View>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <Pressable style={[styles.backdrop, minimalMenu && { backgroundColor: "transparent" }]} onPress={handleClose}>
          <Pressable
            onPress={() => {}}
            style={[
              styles.menuBase,
              minimalMenu && { borderRadius: 10 },
              menuStyle,
              {
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.card,
              },
            ]}
          >
            <ScrollView
              style={{ maxHeight: maxMenuHeight }}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
            >
              {keys.map((key, index) => {
                const active = key === value;
                const meta = optionMeta?.[key];
                const destructive = destructiveOptions?.includes(key) ?? false;
                const isLast = index === keys.length - 1;

                return (
                  <Pressable
                    key={key}
                    onHoverIn={() => {
                      if (minimalMenu) setHoveredOption(key);
                    }}
                    onHoverOut={() => {
                      if (minimalMenu) setHoveredOption(null);
                    }}
                    onPress={() => {
                      onChange(key);
                      handleClose();
                    }}
                    style={[
                      styles.itemBase,
                      sizeStyles[size].item,
                      {
                        borderBottomColor: theme.colors.border,
                        borderBottomWidth: minimalMenu ? 0 : (isLast ? 0 : 1),
                          borderTopWidth: minimalMenu && destructive ? 1 : 0,
                          borderTopColor: theme.colors.border,
                      },
                      minimalMenu && hoveredOption === key && {
                        backgroundColor: theme.colors.background,
                      },
                      active && !minimalMenu && {
                        backgroundColor: theme.colors.background,
                      },
                    ]}
                  >
                    <View style={styles.itemContent}>
                      <View style={styles.itemMainRow}>
                        {optionIcons?.[key] ? (
                          <Feather
                            name={optionIcons[key]!}
                            size={15}
                            color={destructive ? "#DC2626" : theme.colors.text}
                          />
                        ) : null}
                        {showOptionToneDot ? (
                          <StatusDot tone={meta?.tone ?? "neutral"} />
                        ) : null}

                        <ThemedText
                          numberOfLines={1}
                          style={[
                            styles.itemLabel,
                            destructive && { color: "#DC2626" },
                          ]}
                        >
                          {options[key]}
                        </ThemedText>
                      </View>

                      {meta?.subtitle ? (
                        <ThemedText
                          numberOfLines={1}
                          style={styles.itemSubtitle}
                        >
                          {meta.subtitle}
                        </ThemedText>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
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