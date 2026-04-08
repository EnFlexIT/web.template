// src/components/ui-elements/BaseModal.tsx
import React from "react";
import { Modal, Pressable, View, ViewStyle } from "react-native";
import { useUnistyles } from "react-native-unistyles";

type Props = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
  contentStyle?: ViewStyle;
};

export function BaseModal({
  visible,
  onClose,
  children,
  width = 380,
  contentStyle,
}: Props) {
  const { theme } = useUnistyles();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.35)",
          justifyContent: "center",
          alignItems: "center",
          padding: 16,
        }}
      >
        <Pressable
          onPress={() => {}}
          style={[
            {
              width,
              maxWidth: "100%",
              padding: 20,
              gap: 16,
              borderWidth: 1,
            
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
            contentStyle,
          ]}
        >
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}