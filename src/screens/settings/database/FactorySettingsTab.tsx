import React, { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import AntDesign_ from "@expo/vector-icons/AntDesign";
import { StyleSheet, withUnistyles } from "react-native-unistyles";

import { ActionButton } from "../../../components/ui-elements/ActionButton";
import { TextInput } from "../../../components/ui-elements/TextInput";
import { H4 } from "../../../components/stylistic/H4";
import { Card } from "../../../components/ui-elements/Card";
import { Dropdown } from "../../../components/ui-elements/Dropdown";
import { ThemedText } from "../../../components/themed/ThemedText";
import { H2 } from "../../../components/stylistic/H2";
import { useTranslation } from "react-i18next";
import { useAppDispatch } from "../../../hooks/useAppDispatch";
import { useAppSelector } from "../../../hooks/useAppSelector";
import {
  clearDbSettingsError,
  fetchDbSettings,
  fetchDbSystemParameters,
  fetchFactoryDbConnectionSettings,
  saveFactoryDbConnectionSettings,
  testFactoryDbConnection,
  selectDbSettingsError,
  selectDbSettingsLoading,
  selectDbSettingsSaving,
  selectDbSystemParameters,
  selectDbSystems,
  selectFactories,
  selectFactoryStates,
  selectSelectedFactoryConnection,
  selectSelectedFactoryId,
  setSelectedFactoryConnectionField,
  setSelectedFactoryId,
} from "../../../redux/slices/dbSettingsSlice";

const AntDesign = withUnistyles(AntDesign_);

type LocalMessage =
  | {
      type: "info" | "success" | "error";
      text: string;
    }
  | null;

type FactoryStateMeta = {
  label: string;
  color: string;
  iconName: React.ComponentProps<typeof AntDesign>["name"];
};

function getFactoryStateMeta(state: string): FactoryStateMeta {
  switch (state) {
    case "Destroyed":
      return {
        label: "SessionFactory was destroyed",
        color: "#9CA3AF",
        iconName: "database",
      };

    case "CheckDBConnection":
      return {
        label: "Checking database connection ...",
        color: "#2563EB",
        iconName: "database",
      };

    case "CheckDBConectionFailed":
      return {
        label: "Database connection test failed!",
        color: "#DC2626",
        iconName: "database",
      };

    case "InitializationProcessStarted":
      return {
        label: "Initialize SessionFactory",
        color: "#14B8A6",
        iconName: "database",
      };

    case "InitializationProcessFailed":
      return {
        label: "Initialization of SessionFactory failed",
        color: "#DC2626",
        iconName: "database",
      };

    case "Created":
      return {
        label: "Successfully Initialized",
        color: "#16A34A",
        iconName: "database",
      };

    case "NotAvailableYet":
    default:
      return {
        label: "Not available yet",
        color: "#9CA3AF",
        iconName: "database",
      };
  }
}

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

  if (normalized === "Connection test failed.") {
    return t("backendMessageConnectionTestFailed");
  }

  if (normalized === "Connection test successful.") {
    return t("backendMessageConnectionTestSuccessful");
  }

  if (normalized === "DB connection test failed.") {
    return t("backendMessageConnectionTestFailed");
  }

  if (normalized === "DB connection test was successful.") {
    return t("backendMessageConnectionTestSuccessful");
  }

  if (normalized === "The user name is empty.") {
    return t("backendMessageUserNameEmpty");
  }

  if (normalized === "The password is empty.") {
    return t("backendMessagePasswordEmpty");
  }

  if (
    normalized === "The user name is empty., The password is empty." ||
    normalized === "The user name is empty. The password is empty."
  ) {
    return t("backendMessageCombinedUserPasswordEmpty");
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
    "Connection test failed.",
    t("backendMessageConnectionTestFailed"),
  );
  translated = translated.replaceAll(
    "Connection test successful.",
    t("backendMessageConnectionTestSuccessful"),
  );
  translated = translated.replaceAll(
    "DB connection test failed.",
    t("backendMessageConnectionTestFailed"),
  );
  translated = translated.replaceAll(
    "DB connection test was successful.",
    t("backendMessageConnectionTestSuccessful"),
  );
  translated = translated.replaceAll(
    "The user name is empty.",
    t("backendMessageUserNameEmpty"),
  );
  translated = translated.replaceAll(
    "The password is empty.",
    t("backendMessagePasswordEmpty"),
  );
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

export function FactorySettingsTab() {
  const dispatch = useAppDispatch();

  const { t } = useTranslation(["DataBase"]);
  const dbSystems = useAppSelector(selectDbSystems);
  const dbSystemParameters = useAppSelector(selectDbSystemParameters);
  const factories = useAppSelector(selectFactories);
  const factoryStates = useAppSelector(selectFactoryStates);
  const selectedFactoryId = useAppSelector(selectSelectedFactoryId);
  const selectedFactoryConnection = useAppSelector(
    selectSelectedFactoryConnection,
  );
  const isLoading = useAppSelector(selectDbSettingsLoading);
  const isSaving = useAppSelector(selectDbSettingsSaving);
  const error = useAppSelector(selectDbSettingsError);

  const [localMessage, setLocalMessage] = useState<LocalMessage>(null);

  const fallbackInfoText = t("messageInfoBoxDefault", {
    defaultValue: "Info Box",
  });

  useEffect(() => {
    dispatch(fetchDbSettings());
    dispatch(fetchDbSystemParameters());
  }, [dispatch]);

  useEffect(() => {
    if (!selectedFactoryId && factories.length > 0) {
      dispatch(setSelectedFactoryId(factories[0]));
    }
  }, [dispatch, factories, selectedFactoryId]);

  useEffect(() => {
    if (selectedFactoryId) {
      dispatch(fetchFactoryDbConnectionSettings(selectedFactoryId));
    }
  }, [dispatch, selectedFactoryId]);

  const factoryOptions = useMemo<Record<string, string>>(() => {
    return factories.reduce<Record<string, string>>((acc, factory) => {
      acc[factory] = factory;
      return acc;
    }, {});
  }, [factories]);

  const databaseSystemOptions = useMemo<Record<string, string>>(() => {
    return dbSystems.reduce<Record<string, string>>((acc, system) => {
      acc[system] = system;
      return acc;
    }, {});
  }, [dbSystems]);

  const selectedFactoryState = selectedFactoryId
    ? factoryStates[selectedFactoryId] ?? "NotAvailableYet"
    : "NotAvailableYet";

  const selectedFactoryStateMeta = useMemo(() => {
    return getFactoryStateMeta(selectedFactoryState);
  }, [selectedFactoryState]);

  const activeDbSystemDefinition = useMemo(() => {
    if (!selectedFactoryConnection.dbSystem) return undefined;
    return dbSystemParameters[selectedFactoryConnection.dbSystem];
  }, [dbSystemParameters, selectedFactoryConnection.dbSystem]);

  const resolvedDriverClass =
    selectedFactoryConnection.driverClass ||
    activeDbSystemDefinition?.driverClass ||
    "";

  const resolvedUrl =
    selectedFactoryConnection.url || activeDbSystemDefinition?.url || "";

  const resolvedDefaultCatalog =
    selectedFactoryConnection.defaultCatalog ||
    activeDbSystemDefinition?.defaultCatalog ||
    "";

  const resolvedUserName =
    selectedFactoryConnection.userName || activeDbSystemDefinition?.userName || "admin";

  const resolvedPassword =
    selectedFactoryConnection.password || activeDbSystemDefinition?.password || "admin";

  const isFormDisabled = !selectedFactoryId || isLoading;

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

  const onFactoryChange = (factoryId: string) => {
    clearMessages();
    dispatch(setSelectedFactoryId(factoryId));
  };

  const onDbSystemChange = (dbSystem: string) => {
    clearMessages();

    const definition = dbSystemParameters[dbSystem];

    dispatch(
      setSelectedFactoryConnectionField({
        key: "dbSystem",
        value: dbSystem,
      }),
    );

    dispatch(
      setSelectedFactoryConnectionField({
        key: "driverClass",
        value: definition?.driverClass ?? "",
      }),
    );

    dispatch(
      setSelectedFactoryConnectionField({
        key: "url",
        value: definition?.url ?? "",
      }),
    );

    dispatch(
      setSelectedFactoryConnectionField({
        key: "defaultCatalog",
        value: definition?.defaultCatalog ?? "",
      }),
    );

    dispatch(
      setSelectedFactoryConnectionField({
        key: "userName",
        value: definition?.userName ?? "admin",
      }),
    );

    dispatch(
      setSelectedFactoryConnectionField({
        key: "password",
        value: definition?.password ?? "admin",
      }),
    );
  };

  const onSave = async () => {
    if (!selectedFactoryId) return;

    clearMessages();

    try {
      await dispatch(
        saveFactoryDbConnectionSettings({
          factoryId: selectedFactoryId,
          dbSystem: selectedFactoryConnection.dbSystem,
          driverClass: resolvedDriverClass,
          url: resolvedUrl,
          defaultCatalog: resolvedDefaultCatalog,
          userName: resolvedUserName,
          password: resolvedPassword,
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
              defaultValue: "Saving factory DB settings failed.",
            }),
          t,
        ),
      });
    }
  };

  const onTestConnection = async () => {
    if (!selectedFactoryId) return;

    clearMessages();

    setLocalMessage({
      type: "info",
      text: t("messageTestingConnection", {
        defaultValue: "Teste Verbindung...",
      }),
    });

    try {
      const backendMessage = await dispatch(
        testFactoryDbConnection({
          factoryId: selectedFactoryId,
          dbSystem: selectedFactoryConnection.dbSystem,
          driverClass: resolvedDriverClass,
          url: resolvedUrl,
          defaultCatalog: resolvedDefaultCatalog,
          userName: resolvedUserName,
          password: resolvedPassword,
        }),
      ).unwrap();

      setLocalMessage({
        type: "success",
        text: translateBackendMessage(
          backendMessage || "Connection test successful.",
          t,
        ),
      });
    } catch (err: any) {
      setLocalMessage({
        type: "error",
        text: translateBackendMessage(
          err?.message ||
            t("messageConnectionTestError", {
              defaultValue: "Connection test failed.",
            }),
          t,
        ),
      });
    }
  };

  return (
    <Card style={styles.card} padding="md">
      <View style={styles.container}>
        <View style={styles.header}>
          <H2>{t("labelGeneralDatabaseConnectionSettings")}</H2>
          <View style={styles.separator} />
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

        <View style={styles.topSection}>
          <View style={styles.topFields}>
            <View style={styles.topField}>
              <View style={styles.inlineLabel}>
                <H4 style={styles.topLabel}>Factory-ID</H4>
                <AntDesign
                  name={selectedFactoryStateMeta.iconName}
                  size={14}
                  color={selectedFactoryStateMeta.color}
                />
              </View>

              <Dropdown
                size="sm"
                value={selectedFactoryId}
                options={factoryOptions}
                onChange={(value) => onFactoryChange(String(value))}
              />
            </View>

            <View style={styles.topField}>
              <H4 style={styles.topLabel}>{t("labelDatabaseSystem")}</H4>
              <Dropdown
                size="sm"
                value={selectedFactoryConnection.dbSystem}
                options={databaseSystemOptions}
                onChange={(value) => onDbSystemChange(String(value))}
                disabled={isFormDisabled}
              />
            </View>
          </View>
        </View>

        <View style={styles.settingsBox}>
          <FieldRow label={t("labelDatabaseName")}>
            <TextInput
              size="sm"
              value={resolvedDefaultCatalog}
              onChangeText={(value) => {
                clearMessages();
                dispatch(
                  setSelectedFactoryConnectionField({
                    key: "defaultCatalog",
                    value,
                  }),
                );
              }}
              disabled={isFormDisabled}
            />
          </FieldRow>

          <FieldRow label={t("labelResultingUrl")}>
            <TextInput
              size="sm"
              value={resolvedUrl}
              onChangeText={(value) => {
                clearMessages();
                dispatch(
                  setSelectedFactoryConnectionField({
                    key: "url",
                    value,
                  }),
                );
              }}
              disabled={isFormDisabled}
            />
          </FieldRow>

          <FieldRow label="Driver Class">
            <TextInput
              size="sm"
              value={resolvedDriverClass}
              onChangeText={(value) => {
                clearMessages();
                dispatch(
                  setSelectedFactoryConnectionField({
                    key: "driverClass",
                    value,
                  }),
                );
              }}
              disabled={isFormDisabled}
            />
          </FieldRow>

          <FieldRow label={t("labelUserName")}>
            <TextInput
              size="sm"
              value={resolvedUserName}
              onChangeText={(value) => {
                clearMessages();
                dispatch(
                  setSelectedFactoryConnectionField({
                    key: "userName",
                    value,
                  }),
                );
              }}
              disabled={isFormDisabled}
            />
          </FieldRow>

          <FieldRow label={t("labelPassword")}>
            <TextInput
              size="sm"
              value={resolvedPassword}
              onChangeText={(value) => {
                clearMessages();
                dispatch(
                  setSelectedFactoryConnectionField({
                    key: "password",
                    value,
                  }),
                );
              }}
              secureTextEntry
              disabled={isFormDisabled}
            />
          </FieldRow>
        </View>

        <View style={styles.actions}>
          <ActionButton
            label={t("labelTestConnection")}
            size="sm"
            onPress={onTestConnection}
            disabled={isFormDisabled || isSaving}
          />

          <ActionButton
            label={t("labelSave")}
            size="sm"
            variant="secondary"
            onPress={onSave}
            disabled={isSaving || isFormDisabled}
          />
        </View>
      </View>
    </Card>
  );
}

function FieldRow({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.fieldRow}>
      <View style={styles.fieldLabelWrap}>
        {typeof label === "string" ? (
          <ThemedText style={styles.fieldLabel}>{label}</ThemedText>
        ) : (
          label
        )}
      </View>

      <View style={styles.fieldInputWrap}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    width: "100%",
    minHeight: 640,
  },

  container: {
    gap: 18,
  },

  header: {
    gap: 12,
  },

  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
    opacity: 0.9,
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

  topSection: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  topFields: {
    flex: 1,
    flexDirection: "column",
    gap: 16,
  },

  topField: {
    flex: 1,
    gap: 8,
  },

  topLabel: {
    fontWeight: "700",
  },

  inlineLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  settingsBox: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 20,
    gap: 14,
    minHeight: 270,
  },

  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },

  fieldLabelWrap: {
    width: 180,
  },

  fieldLabel: {
    fontWeight: "700",
  },

  fieldInputWrap: {
    flex: 1,
  },

  statusRow: {
    marginTop: -2,
  },

  statusText: {
    opacity: 0.75,
  },

  actions: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 12,
    marginTop: 2,
  },
}));