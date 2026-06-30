import React from "react";
import { Modal, Pressable, View } from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import Feather_ from "@expo/vector-icons/Feather";

import { ActionButton } from "./ActionButton";
import { ThemedText } from "../themed/ThemedText";

const Feather = withUnistyles(Feather_);

type FeatherIconName = React.ComponentProps<typeof Feather_>["name"];

type ConfirmDialogVariant = "info" | "warning" | "success" | "danger";

type Props = {
  visible: boolean;
  title: string;
  description?: string;
  icon?: FeatherIconName;
  variant?: ConfirmDialogVariant;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  onClose?: () => void;
};

export function ConfirmDialog({
  visible,
  title,
  description,
  icon = "info",
  variant = "info",
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  onClose,
}: Props) {
  const iconColorByVariant: Record<ConfirmDialogVariant, string> = {
    info: "#2f80ed",
    warning: "#f5a623",
    success: "#22c55e",
    danger: "#ef4444",
  };

  const iconColor = iconColorByVariant[variant];

  function closeDialog() {
    if (onClose) {
      onClose();
      return;
    }

    onCancel();
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.overlay}>
        <View style={s.dialog}>
          <Pressable style={s.closeButton} onPress={closeDialog}>
            <Feather name="x" size={20} color={s.closeIcon.color} />
          </Pressable>

          <View
            style={[
              s.iconContainer,
              { backgroundColor: `${iconColor}1F` },
            ]}
          >
            <Feather name={icon} size={34} color={iconColor} />
          </View>

          <View style={s.textBlock}>
            <ThemedText style={s.title}>{title}</ThemedText>

            {description ? (
              <ThemedText style={s.description}>{description}</ThemedText>
            ) : null}
          </View>

          <View style={s.actions}>
            <View style={s.actionButton}>
              <ActionButton
                label={cancelLabel}
                variant="secondary"
                size="sm"
                onPress={onCancel}
              />
            </View>

            <View style={s.actionButton}>
              <ActionButton
                label={confirmLabel}
                variant="primary"
                size="sm"
                onPress={onConfirm}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create((theme) => ({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  dialog: {
    width: "100%",
    maxWidth: 480,
    
    padding: 24,
    gap: 18,
    alignItems: "center",
    backgroundColor: theme.colors.background,
  },

  closeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  closeIcon: {
    color: theme.colors.text,
  },

  iconContainer: {
    padding: 12,
    borderRadius: 999,
  },

  textBlock: {
    gap: 8,
    alignItems: "center",
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },

  description: {
    fontSize: 13,
    opacity: 0.75,
    textAlign: "center",
    lineHeight: 20,
  },

  actions: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
    flexWrap: "wrap",
  },

  actionButton: {
    minWidth: 150,
  },
}));