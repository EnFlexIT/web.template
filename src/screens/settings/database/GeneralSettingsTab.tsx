import React, { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Card } from "../../../components/ui-elements/Card";
import { Checkbox } from "../../../components/ui-elements/Checkbox";
import { Dropdown } from "../../../components/ui-elements/Dropdown";
import { TextInput } from "../../../components/ui-elements/TextInput";
import { ActionButton } from "../../../components/ui-elements/ActionButton";
import { H2 } from "../../../components/stylistic/H2";
import { H4 } from "../../../components/stylistic/H4";
import { ThemedText } from "../../../components/themed/ThemedText";
import { useAppDispatch } from "../../../hooks/useAppDispatch";
import { useAppSelector } from "../../../hooks/useAppSelector";
import {
  clearDbSettingsError,
  fetchDbSettings,
  fetchDbSystemParameters,
  fetchGeneralDbConnectionSettings,
  saveGeneralDbConnectionSettings,
  selectDbSettingsError,
  selectDbSettingsLoading,
  selectDbSettingsSaving,
  selectDbSystemParameters,
  selectDbSystems,
  selectGeneralConnection,
  setGeneralConnectionField,
} from "../../../redux/slices/dbSettingsSlice";
import { useTranslation } from "react-i18next";
type LocalMessage =
  | {
      type: "info" | "success";
      text: string;
    }
  | null;

type ParsedConnectionUrl = {
  host: string;
  port: string;
  catalog: string;
  params: string;
};

function splitUrlAndParams(url: string): { baseUrl: string; params: string } {
  if (!url) {
    return { baseUrl: "", params: "" };
  }

  const questionIndex = url.indexOf("?");
  const semicolonIndex = url.indexOf(";");

  if (questionIndex === -1 && semicolonIndex === -1) {
    return { baseUrl: url, params: "" };
  }

  if (
    questionIndex !== -1 &&
    (semicolonIndex === -1 || questionIndex < semicolonIndex)
  ) {
    return {
      baseUrl: url.slice(0, questionIndex),
      params: url.slice(questionIndex + 1),
    };
  }

  return {
    baseUrl: url.slice(0, semicolonIndex),
    params: url.slice(semicolonIndex + 1),
  };
}

function extractParamsDelimiter(mask: string, currentUrl: string): "?" | ";" {
  if (mask.includes("?")) return "?";
  if (mask.includes(";")) return ";";

  if (currentUrl.includes("?")) return "?";
  return ";";
}

function parseConnectionUrl(url: string): ParsedConnectionUrl {
  const { baseUrl, params } = splitUrlAndParams(url);

  const working = baseUrl.trim();
  let host = "";
  let port = "";
  let catalog = "";

  const protocolSplit = working.split("://");

  if (protocolSplit.length > 1) {
    const afterProtocol = protocolSplit.slice(1).join("://");
    const firstSlashIndex = afterProtocol.indexOf("/");

    if (firstSlashIndex !== -1) {
      const hostPortPart = afterProtocol.slice(0, firstSlashIndex);
      catalog = afterProtocol.slice(firstSlashIndex + 1);

      const lastColonIndex = hostPortPart.lastIndexOf(":");
      if (lastColonIndex !== -1) {
        host = hostPortPart.slice(0, lastColonIndex);
        port = hostPortPart.slice(lastColonIndex + 1);
      } else {
        host = hostPortPart;
      }
    } else {
      const lastColonIndex = afterProtocol.lastIndexOf(":");
      if (lastColonIndex !== -1) {
        host = afterProtocol.slice(0, lastColonIndex);
        port = afterProtocol.slice(lastColonIndex + 1);
      } else {
        host = afterProtocol;
      }
    }

    return {
      host,
      port,
      catalog,
      params,
    };
  }

  const jdbcPrefixMatch = working.match(/^jdbc:[^:]+:(.*)$/);
  if (jdbcPrefixMatch) {
    catalog = jdbcPrefixMatch[1];
  } else {
    catalog = working;
  }

  return {
    host: "",
    port: "",
    catalog,
    params,
  };
}

function buildConnectionUrlFromMask(args: {
  mask: string;
  currentUrl: string;
  host: string;
  port: string;
  catalog: string;
  params: string;
}): string {
  const { mask, currentUrl, host, port, catalog, params } = args;

  if (!mask) {
    const delimiter = extractParamsDelimiter(mask, currentUrl);

    if (host || port) {
      const base = `jdbc://${host}${port ? `:${port}` : ""}/${catalog}`;
      return params ? `${base}${delimiter}${params}` : base;
    }

    return params ? `${catalog}${delimiter}${params}` : catalog;
  }

  const delimiter = extractParamsDelimiter(mask, currentUrl);

  const splitByQuestion = mask.split("?");
  const splitBySemicolon = mask.split(";");

  let baseMask = mask;

  if (
    splitByQuestion.length > 1 &&
    splitByQuestion[0].length <= splitBySemicolon[0].length
  ) {
    baseMask = splitByQuestion[0];
  } else if (splitBySemicolon.length > 1) {
    baseMask = splitBySemicolon[0];
  }

  const builtBase = baseMask
    .replace(/\[HostOrIP\]/g, host)
    .replace(/\[Port\]/g, port)
    .replace(/\[Catalog\]/g, catalog);

  return params ? `${builtBase}${delimiter}${params}` : builtBase;
}

function inferVisibleFields(urlMask: string, currentUrl: string) {
  const source = `${urlMask} ${currentUrl}`;

  return {
    host: source.includes("[HostOrIP]") || source.includes("://"),
    port: source.includes("[Port]") || /:\d+/.test(currentUrl),
    catalog: true,
    params:
      urlMask.includes("?") ||
      urlMask.includes(";") ||
      currentUrl.includes("?") ||
      currentUrl.includes(";"),
    username: true,
    password: true,
  };
}

export function GeneralSettingsTab() {
  const dispatch = useAppDispatch();
  const {t}= useTranslation(["DataBase"])
  const dbSystems = useAppSelector(selectDbSystems);
  const dbSystemParameters = useAppSelector(selectDbSystemParameters);
  const generalConnection = useAppSelector(selectGeneralConnection);
  const isLoading = useAppSelector(selectDbSettingsLoading);
  const isSaving = useAppSelector(selectDbSettingsSaving);
  const error = useAppSelector(selectDbSettingsError);

  const [localMessage, setLocalMessage] = useState<LocalMessage>(null);

  useEffect(() => {
    dispatch(fetchDbSettings());
    dispatch(fetchDbSystemParameters());
    dispatch(fetchGeneralDbConnectionSettings());
  }, [dispatch]);

  useEffect(() => {
    if (!generalConnection.dbSystem && dbSystems.length > 0) {
      const fallbackDbSystem = dbSystems[0];
      const fallbackDefinition = dbSystemParameters[fallbackDbSystem];

      const parsedFallbackUrl = parseConnectionUrl(fallbackDefinition?.url ?? "");

      dispatch(
        setGeneralConnectionField({
          key: "dbSystem",
          value: fallbackDbSystem,
        }),
      );

      if (fallbackDefinition) {
        dispatch(
          setGeneralConnectionField({
            key: "driverClass",
            value: fallbackDefinition.driverClass ?? "",
          }),
        );

        dispatch(
          setGeneralConnectionField({
            key: "defaultCatalog",
            value: fallbackDefinition.defaultCatalog ?? "",
          }),
        );

        dispatch(
          setGeneralConnectionField({
            key: "userName",
            value: fallbackDefinition.userName ?? "",
          }),
        );

        dispatch(
          setGeneralConnectionField({
            key: "password",
            value: fallbackDefinition.password ?? "",
          }),
        );

        dispatch(
          setGeneralConnectionField({
            key: "url",
            value:
              buildConnectionUrlFromMask({
                mask: fallbackDefinition.urlMask ?? "",
                currentUrl: fallbackDefinition.url ?? "",
                host: parsedFallbackUrl.host,
                port: parsedFallbackUrl.port,
                catalog: fallbackDefinition.defaultCatalog ?? "",
                params: parsedFallbackUrl.params,
              }) ||
              fallbackDefinition.url ||
              "",
          }),
        );
      }
    }
  }, [dispatch, dbSystems, dbSystemParameters, generalConnection.dbSystem]);

  const databaseSystemOptions = useMemo<Record<string, string>>(() => {
    return dbSystems.reduce<Record<string, string>>((acc, system) => {
      acc[system] = system;
      return acc;
    }, {});
  }, [dbSystems]);

  const selectedDbSystemDefinition = useMemo(() => {
    return dbSystemParameters[generalConnection.dbSystem];
  }, [dbSystemParameters, generalConnection.dbSystem]);

  const parsedUrl = useMemo(() => {
    return parseConnectionUrl(generalConnection.url);
  }, [generalConnection.url]);

  const visibleFields = useMemo(() => {
    return inferVisibleFields(
      selectedDbSystemDefinition?.urlMask ?? "",
      generalConnection.url,
    );
  }, [selectedDbSystemDefinition?.urlMask, generalConnection.url]);

  const isFieldsEnabled = generalConnection.useForEveryFactory;

  const clearMessages = () => {
    if (error) {
      dispatch(clearDbSettingsError());
    }
    if (localMessage) {
      setLocalMessage(null);
    }
  };

  const updateConnection = (
    partial: Partial<{
      dbSystem: string;
      driverClass: string;
      url: string;
      defaultCatalog: string;
      userName: string;
      password: string;
    }>,
  ) => {
    Object.entries(partial).forEach(([key, value]) => {
      dispatch(
        setGeneralConnectionField({
          key: key as
            | "dbSystem"
            | "driverClass"
            | "url"
            | "defaultCatalog"
            | "userName"
            | "password",
          value: value ?? "",
        }),
      );
    });
  };

  const rebuildUrl = (partial: Partial<ParsedConnectionUrl>) => {
    const nextHost = partial.host ?? parsedUrl.host;
    const nextPort = partial.port ?? parsedUrl.port;
    const nextCatalog = partial.catalog ?? generalConnection.defaultCatalog;
    const nextParams = partial.params ?? parsedUrl.params;

    const nextUrl = buildConnectionUrlFromMask({
      mask: selectedDbSystemDefinition?.urlMask ?? "",
      currentUrl: generalConnection.url,
      host: nextHost,
      port: nextPort,
      catalog: nextCatalog,
      params: nextParams,
    });

    dispatch(
      setGeneralConnectionField({
        key: "url",
        value: nextUrl,
      }),
    );
  };

  const onChangeCheckbox = (value: boolean) => {
    clearMessages();

    dispatch(
      setGeneralConnectionField({
        key: "useForEveryFactory",
        value,
      }),
    );
  };

  const onChangeDbSystem = (value: string) => {
    clearMessages();

    const nextDefinition = dbSystemParameters[value];
    const parsedDefinitionUrl = parseConnectionUrl(nextDefinition?.url ?? "");

    const nextCatalog = nextDefinition?.defaultCatalog ?? "";
    const nextUserName = nextDefinition?.userName ?? "";
    const nextPassword = nextDefinition?.password ?? "";
    const nextDriverClass = nextDefinition?.driverClass ?? "";

    const nextUrl = buildConnectionUrlFromMask({
      mask: nextDefinition?.urlMask ?? "",
      currentUrl: nextDefinition?.url ?? "",
      host: parsedDefinitionUrl.host,
      port: parsedDefinitionUrl.port,
      catalog: nextCatalog,
      params: parsedDefinitionUrl.params,
    });

    updateConnection({
      dbSystem: value,
      driverClass: nextDriverClass,
      defaultCatalog: nextCatalog,
      userName: nextUserName,
      password: nextPassword,
      url: nextUrl || nextDefinition?.url || "",
    });
  };

  const onTestConnection = () => {
    setLocalMessage({
      type: "info",
      text: t("messageTestingConnection"),
    });
  };

  const onSave = async () => {
    clearMessages();

    await dispatch(saveGeneralDbConnectionSettings(generalConnection));

    setLocalMessage({
      type: "success",
      text: t("messageSettingsSaved"),
    });
  };

  return (
    <Card style={styles.card} padding="md">
      <View style={styles.container}>
        <View style={styles.header}>
          <H2>{t("labelGeneralDatabaseConnectionSettings")}</H2>
          <View style={styles.separator} />
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

        <Checkbox
          label={t("labelUseForEveryFactory")}
          value={generalConnection.useForEveryFactory}
          onChange={onChangeCheckbox}
        />

        <View
          style={[
            styles.contentArea,
            !isFieldsEnabled && styles.contentAreaDisabled,
          ]}
        >
          <View style={styles.topField}>
            <H4 style={styles.topLabel}>Database System</H4>
            <Dropdown
              size="sm"
              value={generalConnection.dbSystem}
              options={databaseSystemOptions}
              onChange={(value) => onChangeDbSystem(String(value))}
              disabled={!isFieldsEnabled}
            />
          </View>

          <View style={styles.settingsBox}>
            {visibleFields.host && (
              <FieldRow label={t("labelHostOrIP")}>
                <TextInput
                  size="sm"
                  value={parsedUrl.host}
                  onChangeText={(value) => {
                    clearMessages();
                    rebuildUrl({ host: value });
                  }}
                  disabled={!isFieldsEnabled}
                />
              </FieldRow>
            )}

            {visibleFields.port && (
              <FieldRow label="Port">
                <TextInput
                  size="sm"
                  value={parsedUrl.port}
                  keyboardType="numeric"
                  onChangeText={(value) => {
                    clearMessages();
                    const numericValue = value.replace(/[^\d]/g, "");
                    rebuildUrl({ port: numericValue });
                  }}
                  disabled={!isFieldsEnabled}
                />
              </FieldRow>
            )}

            {visibleFields.catalog && (
              <FieldRow label="Database">
                <TextInput
                  size="sm"
                  value={generalConnection.defaultCatalog}
                  onChangeText={(value) => {
                    clearMessages();
                    updateConnection({ defaultCatalog: value });
                    rebuildUrl({ catalog: value });
                  }}
                  disabled={!isFieldsEnabled}
                />
              </FieldRow>
            )}

            {visibleFields.params && (
              <FieldRow label="Add. URL-Params">
                <TextInput
                  size="sm"
                  value={parsedUrl.params}
                  onChangeText={(value) => {
                    clearMessages();
                    rebuildUrl({ params: value });
                  }}
                  disabled={!isFieldsEnabled}
                />
              </FieldRow>
            )}

            <FieldRow label={t("labelResultingUrl")}>
              <TextInput
                size="sm"
                value={generalConnection.url}
                onChangeText={(value) => {
                  clearMessages();
                  updateConnection({ url: value });
                }}
                disabled={!isFieldsEnabled}
              />
            </FieldRow>

            <FieldRow label="Driver Class">
              <TextInput
                size="sm"
                value={generalConnection.driverClass}
                onChangeText={(value) => {
                  clearMessages();
                  updateConnection({ driverClass: value });
                }}
                disabled={!isFieldsEnabled}
              />
            </FieldRow>

            {visibleFields.username && (
              <FieldRow label={t("labelUserName")}>
                <TextInput
                  size="sm"
                  value={generalConnection.userName}
                  onChangeText={(value) => {
                    clearMessages();
                    updateConnection({ userName: value });
                  }}
                  disabled={!isFieldsEnabled}
                />
              </FieldRow>
            )}

            {visibleFields.password && (
              <FieldRow label={t("labelPassword")}>
                <TextInput
                  size="sm"
                  value={generalConnection.password}
                  onChangeText={(value) => {
                    clearMessages();
                    updateConnection({ password: value });
                  }}
                  secureTextEntry
                  disabled={!isFieldsEnabled}
                />
              </FieldRow>
            )}
          </View>
        </View>

        <View style={styles.actions}>
          <ActionButton
            label={t("labelTestConnection")}
            size="sm"
            onPress={onTestConnection}
            disabled={!isFieldsEnabled || isSaving}
          />

          <ActionButton
            label={t("labelSave")}
            size="sm"
            variant="secondary"
            onPress={onSave}
            disabled={!isFieldsEnabled || isSaving}
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
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.fieldRow}>
      <View style={styles.fieldLabelWrap}>
        <ThemedText style={styles.fieldLabel}>{label}</ThemedText>
      </View>

      <View style={styles.fieldInputWrap}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    width: "100%",
    minHeight: 680,
  },

  container: {
    gap: 16,
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

  contentArea: {
    gap: 16,
  },

  contentAreaDisabled: {
    opacity: 0.6,
  },

  topField: {
    gap: 8,
    width: "100%",
    maxWidth: 560,
  },

  topLabel: {
    fontWeight: "700",
  },

  settingsBox: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 14,
    minHeight: 340,
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

  actions: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 12,
    paddingTop: 4,
  },
}));