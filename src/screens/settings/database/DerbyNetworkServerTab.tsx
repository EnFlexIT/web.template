import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { ActionButton } from "../../../components/ui-elements/ActionButton";
import { Checkbox } from "../../../components/ui-elements/Checkbox";
import { TextInput } from "../../../components/ui-elements/TextInput";
import { H2 } from "../../../components/stylistic/H2";
import { Card } from "../../../components/ui-elements/Card";
import { ThemedText } from "../../../components/themed/ThemedText";

import { useAppDispatch } from "../../../hooks/useAppDispatch";
import { useAppSelector } from "../../../hooks/useAppSelector";
import {
  clearDbSettingsError,
  fetchDbSettings,
  saveDerbyNetworkServerSettings,
  selectDerbyNetworkServer,
  selectDbSettingsError,
  selectDbSettingsLoading,
  selectDbSettingsSaving,
  setDerbyField,
} from "../../../redux/slices/dbSettingsSlice";

type LocalMessage =
  | {
      type: "info" | "success";
      text: string;
    }
  | null;

export function DerbyNetworkServerTab() {
  const { theme } = useUnistyles();
  const dispatch = useAppDispatch();

  const derby = useAppSelector(selectDerbyNetworkServer);
  const isLoading = useAppSelector(selectDbSettingsLoading);
  const isSaving = useAppSelector(selectDbSettingsSaving);
  const error = useAppSelector(selectDbSettingsError);

  const [hasRequestedLoad, setHasRequestedLoad] = useState(false);
  const [localMessage, setLocalMessage] = useState<LocalMessage>(null);

  useEffect(() => {
    if (!hasRequestedLoad) {
      setHasRequestedLoad(true);
      dispatch(fetchDbSettings());
    }
  }, [dispatch, hasRequestedLoad]);

  const clearMessages = () => {
    if (error) {
      dispatch(clearDbSettingsError());
    }
    if (localMessage) {
      setLocalMessage(null);
    }
  };

  const onSave = async () => {
    clearMessages();

    await dispatch(
      saveDerbyNetworkServerSettings({
        isStartDerbyNetworkServer: derby.isStartDerbyNetworkServer,
        hostIp: derby.hostIp,
        port: Number(derby.port) || 1527,
        userName: derby.userName,
        password: derby.password,
      }),
    );

    setLocalMessage({
      type: "success",
      text: "Derby Network Server Settings wurden gespeichert.",
    });
  };

  const onTestConnection = () => {
    setLocalMessage({
      type: "info",
      text: "Test Connection ist aktuell nur als UI vorbereitet und noch nicht an einen echten Backend-Endpunkt angebunden.",
    });
  };

  const isFormEnabled = derby.isStartDerbyNetworkServer;

  return (
    <Card style={styles.card} padding="md">
      <View style={styles.container}>
        <View style={styles.header}>
          <H2>Derby Network Server Settings</H2>
          <View
            style={[
              styles.separator,
              { backgroundColor: theme.colors.border },
            ]}
          />
        </View>

        {isLoading ? <ThemedText>Loading...</ThemedText> : null}

        <View style={styles.feedbackSlot}>
          {!!error && (
            <Card padding="sm" style={styles.errorCard}>
              <ThemedText>{error}</ThemedText>
            </Card>
          )}

          {!error && !!localMessage && (
            <Card
              padding="sm"
              style={[
                styles.messageCard,
                localMessage.type === "success"
                  ? styles.successCard
                  : styles.infoCard,
              ]}
            >
              <ThemedText>{localMessage.text}</ThemedText>
            </Card>
          )}
        </View>

        <View style={styles.settingsBox}>
          <Checkbox
            label="Start a Derby database server that is accessible via network"
            value={derby.isStartDerbyNetworkServer}
            onChange={(value) => {
              clearMessages();
              dispatch(
                setDerbyField({
                  key: "isStartDerbyNetworkServer",
                  value,
                }),
              );
            }}
          />

          <View
            style={[
              styles.formArea,
              !isFormEnabled && styles.formAreaDisabled,
            ]}
          >
            <TextInput
              label="Host or IP"
              value={derby.hostIp}
              onChangeText={(value) => {
                clearMessages();
                dispatch(
                  setDerbyField({
                    key: "hostIp",
                    value,
                  }),
                );
              }}
              size="sm"
              disabled={!isFormEnabled}
            />

            <TextInput
              label="Port (default: 1527)"
              value={String(derby.port)}
              keyboardType="numeric"
              onChangeText={(value) => {
                clearMessages();
                const numericValue = value.replace(/[^\d]/g, "");
                dispatch(
                  setDerbyField({
                    key: "port",
                    value: numericValue === "" ? 0 : Number(numericValue),
                  }),
                );
              }}
              size="sm"
              disabled={!isFormEnabled}
            />

            <TextInput
              label="User Name"
              value={derby.userName}
              onChangeText={(value) => {
                clearMessages();
                dispatch(
                  setDerbyField({
                    key: "userName",
                    value,
                  }),
                );
              }}
              size="sm"
              disabled={!isFormEnabled}
            />

            <TextInput
              label="Password"
              value={derby.password}
              onChangeText={(value) => {
                clearMessages();
                dispatch(
                  setDerbyField({
                    key: "password",
                    value,
                  }),
                );
              }}
              secureTextEntry
              size="sm"
              disabled={!isFormEnabled}
            />
          </View>
        </View>

        <View style={styles.actions}>
          <ActionButton
            label="Test Connection"
            onPress={onTestConnection}
            size="sm"
            disabled={!isFormEnabled || isSaving}
          />

          <ActionButton
            label={isSaving ? "Saving..." : "Save"}
            onPress={onSave}
            size="sm"
            variant="secondary"
            disabled={!isFormEnabled || isSaving}
          />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    width: "100%",
    minHeight: 620,
  },

  container: {
    gap: 18,
  },

  header: {
    gap: 12,
  },

  separator: {
    height: 1,
    opacity: 0.9,
    width: "100%",
  },

  feedbackSlot: {
    minHeight: 64,
    justifyContent: "flex-start",
  },

  errorCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  messageCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  successCard: {
    opacity: 0.98,
  },

  infoCard: {
    opacity: 0.98,
  },

  settingsBox: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    gap: 20,
    minHeight: 360,
  },

  formArea: {
    gap: 16,
  },

  formAreaDisabled: {
    opacity: 0.6,
  },

  actions: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 4,
  },
}));