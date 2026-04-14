import React, { useEffect, useMemo, useState } from "react";
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
      type: "info" | "success" | "error";
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

  const [localMessage, setLocalMessage] = useState<LocalMessage>(null);

  const fallbackInfoText = "Info Box !";

  useEffect(() => {
    dispatch(fetchDbSettings());
  }, [dispatch]);

  const displayedMessage = useMemo(() => {
    if (error) {
      return {
        type: "error" as const,
        text: error,
      };
    }

    if (localMessage) {
      return localMessage;
    }

    return {
      type: "info" as const,
      text: fallbackInfoText,
    };
  }, [error, localMessage, fallbackInfoText]);

  const clearMessages = () => {
    if (error) {
      dispatch(clearDbSettingsError());
    }
    setLocalMessage(null);
  };

  const normalizedPort =
    Number.isFinite(Number(derby.port)) && Number(derby.port) > 0
      ? Number(derby.port)
      : 1527;

  const onSave = async () => {
    clearMessages();

    const resultAction = await dispatch(
      saveDerbyNetworkServerSettings({
        isStartDerbyNetworkServer: derby.isStartDerbyNetworkServer,
        hostIp: derby.hostIp.trim(),
        port: normalizedPort,
        userName: derby.userName,
        password: derby.password,
      }),
    );

    if (saveDerbyNetworkServerSettings.fulfilled.match(resultAction)) {
      setLocalMessage({
        type: "success",
        text: "Derby Network Server Settings wurden gespeichert.",
      });
      return;
    }

    setLocalMessage({
      type: "error",
      text: "Speichern der Derby Network Server Settings ist fehlgeschlagen.",
    });
  };

  const onTestConnection = () => {
    clearMessages();

    setLocalMessage({
      type: "info",
   text: "Für Derby Network Server gibt es aktuell keinen separaten Test-Endpunkt im Backend. Die Einstellungen können gespeichert werden, ein echter Verbindungstest ist hier derzeit jedoch nicht verfügbar.",    });
  };

  const isFormEnabled = derby.isStartDerbyNetworkServer;
  const isFormDisabled = isLoading || !isFormEnabled;

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

        <View style={styles.feedbackSlot}>
          <Card
            padding="sm"
            style={[
              styles.messageCard,
              displayedMessage.type === "error" && styles.errorCard,
              displayedMessage.type === "success" && styles.successCard,
              displayedMessage.type === "info" && styles.infoCard,
            ]}
          >
            <ThemedText>{displayedMessage.text}</ThemedText>
          </Card>
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
              disabled={isFormDisabled}
            />

            <TextInput
              label="Port (default: 1527)"
              value={derby.port ? String(derby.port) : ""}
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
              disabled={isFormDisabled}
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
              disabled={isFormDisabled}
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
              disabled={isFormDisabled}
            />
          </View>
        </View>

        <View style={styles.actions}>
          <ActionButton
            label="Test Connection"
            onPress={onTestConnection}
            size="sm"
            disabled={true}
          />

          <ActionButton
            label={isSaving ? "Saving..." : "Save"}
            onPress={onSave}
            size="sm"
            variant="secondary"
            disabled={isFormDisabled || isSaving}
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