import React, { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  View,
  StyleSheet as NativeStyleSheet,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useUnistyles } from "react-native-unistyles";

import { Logo } from "../../components/Logo";
import { H1 } from "../../components/stylistic/H1";
import { TextInput } from "../../components/ui-elements/TextInput";
import { ActionButton } from "../../components/ui-elements/ActionButton";
import { ThemedText } from "../../components/themed/ThemedText";

type Props = {
  visible: boolean;
  serverLabel: string;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (params: {
    username: string;
    password: string;
  }) => Promise<void> | void;
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

  useEffect(() => {
    if (!visible) {
      setUsername("");
      setPassword("");
    }
  }, [visible]);

  async function handleSubmit() {
    const trimmedUsername = username.trim();

    if (!trimmedUsername || !password || loading) return;

    await onSubmit({
      username: trimmedUsername,
      password,
    });

    setPassword("");
  }

  function handleClose() {
    if (loading) return;

    setUsername("");
    setPassword("");
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.backdrop} onPress={handleClose}>
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
            <Logo style={logoStyles.logo} />
            <H1>Agent.Workbench</H1>
          </View>

          <ThemedText
            style={[
              styles.subtitle,
              error
                ? { color: "red", opacity: 1 }
                : undefined,
            ]}
          >
            {error
              ? t("invalid_credentials", "Falscher Benutzername oder Passwort")
              : `${t("loginfor")}: ${serverLabel}`}
          </ThemedText>

          <View style={styles.form}>
            <TextInput
              size="sm"
              placeholder={t("username_placeholder")}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              
              returnKeyType="next"
              onSubmitEditing={() => {
                if (password) {
                  handleSubmit();
                }
              }}
            />

            <TextInput
              size="sm"
              placeholder={t("password_placeholder")}
              value={password}
              onChangeText={setPassword}
              passwordToggle
              autoCapitalize="none"
            
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
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
    gap: 50,
  },
  subtitle: {
    opacity: 0.8,
    minHeight: 20,
  },
  form: {
    gap: 10,
  },
};

const logoStyles = NativeStyleSheet.create({
  logo: {
    resizeMode: "contain",
    width: 38,
    height: 38,
    left: 40,
    bottom: 5,
  },
});