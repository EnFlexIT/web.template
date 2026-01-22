import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  View,
  LayoutRectangle,
  useWindowDimensions,
  Platform,
} from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useUnistyles } from "react-native-unistyles";
import { Text } from "../stylistic/Text";

interface DropdownProps<T extends string> {
  value: T;
  options: Record<T, string>;
  onChange: (value: T) => void;
  disabled?: boolean;
  maxMenuHeight?: number;
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
}: DropdownProps<T>) {
  const { theme } = useUnistyles();
  const { width: screenW, height: screenH } = useWindowDimensions();

  const buttonRef = useRef<View>(null);
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<AnchorRect | null>(null);

  const selectedLabel = options[value] ?? String(value);

  const keys = useMemo(() => Object.keys(options) as T[], [options]);

  const measureAndOpen = useCallback(() => {
    if (!buttonRef.current) {
      setOpen(true);
      return;
    }

    // measureInWindow works on native + web (RN Web) for positioned dropdowns
  
    buttonRef.current.measureInWindow((x: number, y: number, w: number, h: number) => {
      setAnchor({ x, y, width: w, height: h });
      setOpen(true);
    });
  }, []);

  const close = useCallback(() => setOpen(false), []);

  // compute menu position & clamp to viewport
  const menuStyle = useMemo(() => {
    if (!anchor) return null;

    const GAP = 6;

    let left = anchor.x;
    let top = anchor.y + anchor.height + GAP;
    const menuW = anchor.width;

    // clamp horizontally
    if (left + menuW > screenW - 8) left = Math.max(8, screenW - menuW - 8);
    if (left < 8) left = 8;

    // if menu would overflow bottom, show above the button
    const menuH = Math.min(maxMenuHeight, keys.length * 44); // approx row height
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
  }, [anchor, screenW, screenH, maxMenuHeight, keys.length]);

  return (
    <View style={styles.wrapper}>
      <Pressable
        disabled={disabled}
        onPress={measureAndOpen}
        style={[
          styles.button,
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
          <Text style={{ opacity: 0.6, marginLeft: 8 }}>{open ? "▲" : "▼"}</Text>
        </View>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={close}
      >
        {/* Fullscreen click-catcher */}
        <Pressable style={styles.backdrop} onPress={close}>
          {/* Stop closing when clicking inside menu */}
          <Pressable onPress={() => {}} style={[styles.menuBase, menuStyle, {
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.card,
          }]}>
            <View style={styles.menuScroll}>
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
                      styles.item,
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

  button: {
    borderWidth: 1,
  
    paddingVertical: 10,
    paddingHorizontal: 12,
  },

  buttonInner: {
    flexDirection: "row",
    alignItems: "center",
  },

  backdrop: {
    flex: 1,
    // IMPORTANT: no centering -> we position menu absolutely
    backgroundColor: "rgba(0,0,0,0.25)",
  },

  menuBase: {
    borderWidth: 1,
  
    overflow: "hidden",
    // small shadow feel
    // (RN Web ignores elevation, native uses it)
    elevation: 6,
  },

  menuScroll: {
    // simple container; if you want real scrolling on native/web,
    // we can replace with ScrollView, but this already limits height via maxHeight.
  },

  item: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
});
