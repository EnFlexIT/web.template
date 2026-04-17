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
import { useTranslation } from "react-i18next";

type LocalMessage =
  | {
      type: "info" | "success" | "error";
      text: string;
    }
  | null;

function translateBackendMessage(
  message: string,
  t: (key: string, options?: any) => string,
) {
  const normalized = String(message ?? "").trim();

  if (!normalized) {
    return normalized;
  }

  if (normalized === "Done") {
    return t("backendMessageDone");
  }

  if (normalized === "Properties could not be applied.") {
    return t("backendMessagePropertiesCouldNotBeApplied");
  }

  if (
    normalized === "Permission denied!!" ||
    normalized === "Permission denied!"
  ) {
    return t("backendMessagePermissionDenied");
  }

  let translated = normalized;

  translated = translated.replaceAll(
    "Properties could not be applied.",
    t("backendMessagePropertiesCouldNotBeApplied"),
  );
  translated = translated.replaceAll(
    "Permission denied!!",
    t("backendMessagePermissionDenied"),
  );
  translated = translated.replaceAll(
    "Permission denied!",
    t("backendMessagePermissionDenied"),
  );

  return translated;
}

export function DerbyNetworkServerTab() {
  const { theme } = useUnistyles();
  const dispatch = useAppDispatch();
  const { t } = useTranslation(["DataBase"]);

  const derby = useAppSelector(selectDerbyNetworkServer);
  const isLoading = useAppSelector(selectDbSettingsLoading);
  const isSaving = useAppSelector(selectDbSettingsSaving);
  const error = useAppSelector(selectDbSettingsError);

  const [localMessage, setLocalMessage] = useState<LocalMessage>(null);

  const fallbackInfoText = t("messageInfoBoxDefault", {
    defaultValue: "Info Box",
  });

  useEffect(() => {
    dispatch(fetchDbSettings());
  }, [dispatch]);

  const displayedMessage = useMemo(() => {
    if (error) {
      return {
        type: "error" as const,
        text: translateBackendMessage(error, t),
      };
    }

    if (localMessage) {
      return {
        ...localMessage,
        text: translateBackendMessage(localMessage.text, t),
      };
    }

    return {
      type: "info" as const,
      text: fallbackInfoText,
    };
  }, [error, localMessage, fallbackInfoText, t]);

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

    try {
      await dispatch(
        saveDerbyNetworkServerSettings({
          isStartDerbyNetworkServer: derby.isStartDerbyNetworkServer,
          hostIp: derby.hostIp.trim(),
          port: normalizedPort,
          userName: derby.userName,
          password: derby.password,
        }),
      ).unwrap();

      setLocalMessage({
        type: "success",
        text: t("messageSettingsSaved"),
      });
    } catch (err: any) {
      setLocalMessage({
        type: "error",
        text: translateBackendMessage(
          err?.message ||
            t("messageSettingsSaveError", {
              defaultValue: "Fehler beim Speichern der Einstellungen.",
            }),
          t,
        ),
      });
    }
  };

  const onTestConnection = () => {
    clearMessages();

    setLocalMessage({
      type: "info",
      text: t("messageDerbyNetworkServerTestInfo"),
    });
  };

  const isFormEnabled = derby.isStartDerbyNetworkServer;
  const isFormDisabled = isLoading || !isFormEnabled;

  return (
    <Card style={styles.card} padding="md">
      <View style={styles.container}>
        <View style={styles.header}>
          <H2>{t("labelDerbyNetworkServerSettings")}</H2>
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
              label={t("labelHostOrIP")}
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
              label={`${t("labelPort")} (default: 1527)`}
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
              label={t("labelUserName")}
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
              label={t("labelPassword")}
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
            label={t("labelTestConnection")}
            onPress={onTestConnection}
            size="sm"
            disabled={true}
          />

          <ActionButton
            label={isSaving ? "Saving..." : t("labelSave")}
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