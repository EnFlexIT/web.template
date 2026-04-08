// src/components/ui-elements/ConfirmModal.tsx
import React from "react";
import { View } from "react-native";
import { ThemedText } from "../themed/ThemedText";
import { H4 } from "../stylistic/H4";
import { ActionButton } from "./ActionButton";
import { BaseModal } from "./BaseModal";

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmIcon?: string;
};

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = "OK",
  cancelLabel = "Abbrechen",
  onConfirm,
  onCancel,
  confirmIcon = "check",
}: Props) {
  return (
    <BaseModal visible={visible} onClose={onCancel}>
      <H4>{title}</H4>

      <ThemedText>{message}</ThemedText>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "flex-end",
          gap: 10,
        }}
      >
        <ActionButton
          label={cancelLabel}
          variant="secondary"
          onPress={onCancel}
          size="sm"
        />
        <ActionButton
          label={confirmLabel}
          variant="secondary"
          
          onPress={onConfirm}
          size="sm"
        />
      </View>
    </BaseModal>
  );
}