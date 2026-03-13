// src/screens/login/ServerLoginModal.tsx
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useUnistyles } from "react-native-unistyles";

import { H1 } from "../../components/stylistic/H1";
import { TextInput } from "../../components/ui-elements/TextInput";
import { ActionButton } from "../../components/ui-elements/ActionButton";
import { ThemedText } from "../../components/themed/ThemedText";
import { Icon } from "../../components/ui-elements/Icon/Icon";

type Props = {
  visible: boolean;
  serverLabel: string;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (params: { username: string; password: string }) => Promise<void> | void;
};

export function ServerLoginModal({
  visible,
  serverLabel,
  loading = false,
  error = null,
  onClose,
  onSubmit,
}: Props) {
  const { t } = useTranslation(["Login"]);
  const { theme } = useUnistyles();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit() {
    if (!username.trim() || !password) return;
    await onSubmit({
      username: username.trim(),
      password,
    });
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          onPress={() => {}}
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.header}>
            <H1>{t("login")}</H1>

            <Pressable onPress={onClose} hitSlop={10}>
              <Icon name="close" size={20} color={theme.colors.text} />
            </Pressable>
          </View>

          <ThemedText style={styles.subtitle}>
            Anmeldung für: {serverLabel}
          </ThemedText>

          <View style={styles.form}>
            <TextInput
              size="sm"
              placeholder={t("username_placeholder")}
              value={username}
              onChangeText={setUsername}
            />

            <TextInput
              size="sm"
              placeholder={t("password_placeholder")}
              value={password}
              onChangeText={setPassword}
              passwordToggle
            />
          </View>

          <View style={styles.feedback}>
            {loading ? (
              <ActivityIndicator />
            ) : error ? (
              <ThemedText style={{ color: "red" }}>{error}</ThemedText>
            ) : null}
          </View>

          <ActionButton
            label={t("login")}
            variant="secondary"
            onPress={handleSubmit}
            size="sm"
            disabled={loading || !username.trim() || !password}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = {
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.30)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    padding: 20,
  },
  card: {
    width: 420,
    maxWidth: "100%" as const,
    padding: 16,
    gap: 14,
    borderWidth: 1,
  },
  header: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
  },
  subtitle: {
    opacity: 0.8,
  },
  form: {
    gap: 10,
  },
  feedback: {
    minHeight: 22,
    justifyContent: "center" as const,
  },
};