import React, { useEffect, useMemo, useState } from "react";
import { View, Pressable } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { ActionButton } from "../../components/ui-elements/ActionButton";
import { Dropdown } from "../../components/ui-elements/Dropdown";
import { TextInput } from "../../components/ui-elements/TextInput";
import { Card } from "../../components/ui-elements/Card";
import { H4 } from "../../components/stylistic/H4";
import { ThemedText } from "../../components/themed/ThemedText";
import { Checkbox } from "../../components/ui-elements/Checkbox";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { useAppSelector } from "../../hooks/useAppSelector";
import {
  addEmbeddedSystemAgent,
  clearExecSettingsError,
  fetchExecSettings,
  fetchProjects,
  fetchProjectSetups,
  removeEmbeddedSystemAgent,
  saveExecSettings,
  selectExecSettings,
  selectExecSettingsError,
  selectExecSettingsLoading,
  selectExecSettingsProjects,
  selectExecSettingsProjectSetups,
  selectExecSettingsSaving,
  setEmbeddedSystemAgentField,
  setExecSettingsField,
} from "../../redux/slices/execSettingsSlice";

type StartMode = "application" | "background" | "service";
type LocalAddressMode = "jade" | "ip";
type RunAsMode = "service" | "embedded";

function mapBackendStartModeToUi(value: string): StartMode {
  switch (value) {
    case "APPLICATION":
    case "Application":
      return "application";
    case "BACKGROUND_SYSTEM":
    case "Background System":
      return "background";
    case "SERVICE_EMBEDDED_SYSTEM_AGENT":
    case "Service / Embedded System Agent":
      return "service";
    default:
      return "application";
  }
}

function mapUiStartModeToBackend(value: StartMode): string {
  switch (value) {
    case "application":
      return "APPLICATION";
    case "background":
      return "BACKGROUND_SYSTEM";
    case "service":
      return "SERVICE_EMBEDDED_SYSTEM_AGENT";
    default:
      return "APPLICATION";
  }
}

function mapBackendLocalModeToUi(value: string): LocalAddressMode {
  switch (value) {
    case "ConfiguredByIPAddress":
      return "ip";
    case "ConfiguredByJADE":
    default:
      return "jade";
  }
}

function mapUiLocalModeToBackend(value: LocalAddressMode): string {
  switch (value) {
    case "ip":
      return "ConfiguredByIPAddress";
    case "jade":
    default:
      return "ConfiguredByJADE";
  }
}

function splitServerMasterUrl(value: string): {
  protocol: string;
  host: string;
} {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    return {
      protocol: "HTTP",
      host: "",
    };
  }

  const match = normalized.match(/^([a-zA-Z]+):\/\/(.+)$/);

  if (!match) {
    return {
      protocol: "HTTP",
      host: normalized,
    };
  }

  return {
    protocol: match[1].toUpperCase(),
    host: match[2],
  };
}

function buildServerMasterUrl(protocol: string, host: string): string {
  const normalizedHost = String(host ?? "").trim();
  if (!normalizedHost) return "";
  return `${protocol.toLowerCase()}://${normalizedHost}`;
}

function toOptions(values: string[], currentValue?: string): Record<string, string> {
  const options: Record<string, string> = {
    "": "",
  };

  values.forEach((value) => {
    options[value] = value;
  });

  if (currentValue && !options[currentValue]) {
    options[currentValue] = currentValue;
  }

  return options;
}

export function ProgramStartTab() {
  const dispatch = useAppDispatch();

  const settings = useAppSelector(selectExecSettings);
  const projects = useAppSelector(selectExecSettingsProjects);
  const projectSetups = useAppSelector(selectExecSettingsProjectSetups);
  const isLoading = useAppSelector(selectExecSettingsLoading);
  const isSaving = useAppSelector(selectExecSettingsSaving);
  const error = useAppSelector(selectExecSettingsError);

  const [selectedAgentIndex, setSelectedAgentIndex] = useState<number | null>(
    null,
  );

  useEffect(() => {
    dispatch(fetchExecSettings());
    dispatch(fetchProjects());
  }, [dispatch]);

  useEffect(() => {
    if (settings.embeddedSystemProject) {
      dispatch(fetchProjectSetups(settings.embeddedSystemProject));
    }
  }, [dispatch, settings.embeddedSystemProject]);

  const startMode = mapBackendStartModeToUi(settings.startAs);
  const localAddressMode = mapBackendLocalModeToUi(settings.localMtpCreation);

  const serverMasterUrlParts = splitServerMasterUrl(settings.serverMasterUrl);
  const urlProtocol = serverMasterUrlParts.protocol;
  const serverIp = serverMasterUrlParts.host;

  const port = String(settings.serverMasterPort ?? "");
  const mtpPort = String(settings.serverMasterPortMtp ?? "");
  const localIp = settings.localMtpUrl ?? "";
  const localMtpPort = String(settings.localMtpPort ?? "");
  const mtpProtocol = settings.localMtpProtocol ?? "HTTP";

  const isApplicationMode = startMode === "application";
  const isBackgroundMode = startMode === "background";
  const isServiceMode = startMode === "service";
  const useIpAddress = localAddressMode === "ip";

  const isMainServerDisabled = !isApplicationMode || isLoading || isSaving;

  const backgroundInitializeAtStartup = settings.bgSystemAutoInit;

  const runAsMode: RunAsMode =
    settings.deviceSystemExecMode === "AGENT" ? "embedded" : "service";

  const projectOptions = useMemo(
    () => toOptions(projects, settings.embeddedSystemProject),
    [projects, settings.embeddedSystemProject],
  );

  const serviceSetupOptions = useMemo(
    () => toOptions(projectSetups, settings.serviceSetup),
    [projectSetups, settings.serviceSetup],
  );

  const clearError = () => {
    if (error) {
      dispatch(clearExecSettingsError());
    }
  };

  const onChangeStartMode = (value: StartMode) => {
    clearError();
    dispatch(
      setExecSettingsField({
        key: "startAs",
        value: mapUiStartModeToBackend(value),
      }),
    );
  };

  const onChangeUrlProtocol = (value: string) => {
    clearError();
    dispatch(
      setExecSettingsField({
        key: "serverMasterProtocol",
        value,
      }),
    );
    dispatch(
      setExecSettingsField({
        key: "serverMasterUrl",
        value: buildServerMasterUrl(value, serverIp),
      }),
    );
  };

  const onChangeServerIp = (value: string) => {
    clearError();
    dispatch(
      setExecSettingsField({
        key: "serverMasterUrl",
        value: buildServerMasterUrl(urlProtocol, value),
      }),
    );
  };

  const onChangePort = (value: string) => {
    clearError();
    dispatch(
      setExecSettingsField({
        key: "serverMasterPort",
        value: Number(value.replace(/[^\d]/g, "")) || 0,
      }),
    );
  };

  const onChangeMtpPort = (value: string) => {
    clearError();
    dispatch(
      setExecSettingsField({
        key: "serverMasterPortMtp",
        value: Number(value.replace(/[^\d]/g, "")) || 0,
      }),
    );
  };

  const onChangeLocalAddressMode = (value: LocalAddressMode) => {
    clearError();
    dispatch(
      setExecSettingsField({
        key: "localMtpCreation",
        value: mapUiLocalModeToBackend(value),
      }),
    );
  };

  const onChangeLocalIp = (value: string) => {
    clearError();
    dispatch(
      setExecSettingsField({
        key: "localMtpUrl",
        value,
      }),
    );
  };

  const onChangeLocalMtpPort = (value: string) => {
    clearError();
    dispatch(
      setExecSettingsField({
        key: "localMtpPort",
        value: Number(value.replace(/[^\d]/g, "")) || 0,
      }),
    );
  };

  const onChangeMtpProtocol = (value: string) => {
    clearError();
    dispatch(
      setExecSettingsField({
        key: "localMtpProtocol",
        value,
      }),
    );
  };

  const onSave = async () => {
    clearError();
    await dispatch(saveExecSettings(settings));
  };

  const protocolOptions = {
    HTTP: "HTTP",
    HTTPS: "HTTPS",
  };

  const mtpProtocolOptions = {
    HTTP: "HTTP",
    HTTPS: "HTTPS",
  };

  return (
    <Card padding="sm" contentStyle={styles.container}>
      {!!error && (
        <Card padding="sm" style={styles.errorCard}>
          <ThemedText>{error}</ThemedText>
        </Card>
      )}

      <View style={styles.topRow}>
        <View style={styles.startModeBlock}>
          <ThemedText style={styles.startModeTitle}>
            Agent.Workbench - Start as:
          </ThemedText>

          <View style={styles.radioGroup}>
            <RadioRow
              label="Application"
              selected={startMode === "application"}
              onPress={() => onChangeStartMode("application")}
            />
            <RadioRow
              label="Background System (Master / Slave)"
              selected={startMode === "background"}
              onPress={() => onChangeStartMode("background")}
            />
            <RadioRow
              label="Service / Embedded System Agent"
              selected={startMode === "service"}
              onPress={() => onChangeStartMode("service")}
            />
          </View>
        </View>

        <ActionButton
          onPress={onSave}
          label={isSaving ? "Saving..." : "Apply"}
          size="sm"
          disabled={isLoading || isSaving}
        />
      </View>

      <Section title="Agent.Workbench Main Server (server.master)">
        <FieldRow label="URL / IP">
          <View style={styles.inlineInputRow}>
            <View style={styles.protocolWrap}>
              <Dropdown
                size="sm"
                value={urlProtocol}
                options={protocolOptions}
                onChange={(value) => onChangeUrlProtocol(String(value))}
                disabled={isMainServerDisabled}
              />
            </View>

            <ThemedText>://</ThemedText>

            <View style={styles.flex}>
              <TextInput
                size="sm"
                value={serverIp}
                onChangeText={onChangeServerIp}
                disabled={isMainServerDisabled}
              />
            </View>
          </View>
        </FieldRow>

        <FieldRow label="Port">
          <View style={styles.inlineHintRow}>
            <View style={styles.smallInputWrap}>
              <TextInput
                size="sm"
                value={port}
                onChangeText={onChangePort}
                disabled={isMainServerDisabled}
              />
            </View>
            <ThemedText style={styles.hintText}>
              1099 = "myServer:1099/JADE"
            </ThemedText>
          </View>
        </FieldRow>

        <FieldRow label="Port-MTP">
          <View style={styles.inlineHintRow}>
            <View style={styles.smallInputWrap}>
              <TextInput
                size="sm"
                value={mtpPort}
                onChangeText={onChangeMtpPort}
                disabled={isMainServerDisabled}
              />
            </View>
            <ThemedText style={styles.hintText}>
              7778 = "http://myServer:7778/acc"
            </ThemedText>
          </View>
        </FieldRow>
      </Section>

      <Section title="Own local MTP-Address">
        <View style={styles.localModeArea}>
          <View style={styles.leftLocalMode}>
            <View style={styles.radioInlineGroup}>
              <RadioRow
                label="Use JADE-Automatic"
                selected={localAddressMode === "jade"}
                onPress={() => onChangeLocalAddressMode("jade")}
              />
              <RadioRow
                label="Use IP-Address"
                selected={localAddressMode === "ip"}
                onPress={() => onChangeLocalAddressMode("ip")}
              />
            </View>

            <FieldRow label="IP">
              <TextInput
                size="sm"
                value={localIp}
                onChangeText={onChangeLocalIp}
                disabled={!useIpAddress || isLoading || isSaving}
                placeholder="Auto-Configuration"
              />
            </FieldRow>
          </View>

          <View style={styles.rightLocalMode}>
            <FieldRow label="MTP-Port">
              <View style={styles.smallInputWrap}>
                <TextInput
                  size="sm"
                  value={localMtpPort}
                  onChangeText={onChangeLocalMtpPort}
                  disabled={!useIpAddress || isLoading || isSaving}
                />
              </View>
            </FieldRow>
          </View>
        </View>
      </Section>

      <Section title="">
        <FieldRow label="MTP-Protocol">
          <View style={styles.protocolWrap}>
            <Dropdown
              size="sm"
              value={mtpProtocol}
              options={mtpProtocolOptions}
              onChange={(value) => onChangeMtpProtocol(String(value))}
              disabled={isLoading || isSaving}
            />
          </View>
        </FieldRow>
      </Section>

      {isBackgroundMode && (
        <Section title="Agent.Workbench Background System - Configuration">
          <Checkbox
            label="Automatically initialize background system at startup"
            value={backgroundInitializeAtStartup}
            onChange={(value) => {
              clearError();
              dispatch(
                setExecSettingsField({
                  key: "bgSystemAutoInit",
                  value: Boolean(value),
                }),
              );
            }}
          />

          <View style={styles.databaseStatusBox}>
            <ThemedText style={styles.sectionTitle}>
              [Optional] Database for the 'server.master'
            </ThemedText>
            <ThemedText style={styles.successText}>
              SessionFactory '{settings.factoryId || "de.enflexit.awb.bgSystem.db"}':
              Successfully Initialized
            </ThemedText>
          </View>
        </Section>
      )}

      {isServiceMode && (
        <Section title="Agent.Workbench - Service / Embedded System Agent">
          <FieldRow label="Project">
            <Dropdown
              size="sm"
              value={settings.embeddedSystemProject}
              options={projectOptions}
              onChange={(value) => {
                clearError();
                dispatch(
                  setExecSettingsField({
                    key: "embeddedSystemProject",
                    value: String(value),
                  }),
                );
                dispatch(
                  setExecSettingsField({
                    key: "serviceSetup",
                    value: "",
                  }),
                );
              }}
              disabled={isLoading || isSaving}
            />
          </FieldRow>

          <FieldRow label="Run as">
            <View style={styles.radioInlineGroup}>
              <RadioRow
                label="Service"
                selected={runAsMode === "service"}
                onPress={() => {
                  clearError();
                  dispatch(
                    setExecSettingsField({
                      key: "deviceSystemExecMode",
                      value: "SETUP",
                    }),
                  );
                }}
              />
              <RadioRow
                label="Embedded System Agent"
                selected={runAsMode === "embedded"}
                onPress={() => {
                  clearError();
                  dispatch(
                    setExecSettingsField({
                      key: "deviceSystemExecMode",
                      value: "AGENT",
                    }),
                  );
                }}
              />
            </View>
          </FieldRow>

          <FieldRow label="Service - Setup">
            <Dropdown
              size="sm"
              value={settings.serviceSetup}
              options={serviceSetupOptions}
              onChange={(value) => {
                clearError();
                dispatch(
                  setExecSettingsField({
                    key: "serviceSetup",
                    value: String(value),
                  }),
                );
              }}
              disabled={isLoading || isSaving || !settings.embeddedSystemProject}
            />
          </FieldRow>

          <View style={styles.embeddedHeader}>
            <ThemedText style={styles.sectionTitle}>
              Embedded System Agents
            </ThemedText>

            <View style={styles.tableActions}>
              <ActionButton
                label="+"
                size="sm"
                onPress={() => {
                  clearError();
                  dispatch(addEmbeddedSystemAgent());
                  setSelectedAgentIndex(settings.embeddedSystemAgents.length);
                }}
                disabled={isLoading || isSaving}
              />
              <ActionButton
                label="-"
                size="sm"
                onPress={() => {
                  if (selectedAgentIndex == null) return;
                  clearError();
                  dispatch(removeEmbeddedSystemAgent(selectedAgentIndex));
                  setSelectedAgentIndex(null);
                }}
                disabled={isLoading || isSaving || selectedAgentIndex == null}
              />
            </View>
          </View>

          <View style={styles.agentTable}>
            <View style={styles.tableHeader}>
              <ThemedText style={styles.tableCell}>Agent Name</ThemedText>
              <ThemedText style={styles.tableCell}>Agent Class</ThemedText>
            </View>

            {settings.embeddedSystemAgents.length === 0 ? (
              <View style={styles.tableEmptyRow}>
                <ThemedText style={styles.hintText}>
                  No agents configured.
                </ThemedText>
              </View>
            ) : (
              settings.embeddedSystemAgents.map((agent, index) => (
                <Pressable
                  key={index}
                  onPress={() => setSelectedAgentIndex(index)}
                  style={[
                    styles.tableEditRow,
                    selectedAgentIndex === index && styles.tableRowSelected,
                  ]}
                >
                  <View style={styles.tableInputCell}>
                    <TextInput
                      size="sm"
                      value={agent.agentName}
                      onChangeText={(value) => {
                        clearError();
                        dispatch(
                          setEmbeddedSystemAgentField({
                            index,
                            key: "agentName",
                            value,
                          }),
                        );
                      }}
                      disabled={isLoading || isSaving}
                    />
                  </View>

                  <View style={styles.tableInputCell}>
                    <TextInput
                      size="sm"
                      value={agent.className}
                      onChangeText={(value) => {
                        clearError();
                        dispatch(
                          setEmbeddedSystemAgentField({
                            index,
                            key: "className",
                            value,
                          }),
                        );
                      }}
                      disabled={isLoading || isSaving}
                    />
                  </View>
                </Pressable>
              ))
            )}
          </View>
        </Section>
      )}
    </Card>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card padding="md" style={styles.section}>
      {!!title && <H4 style={styles.sectionTitle}>{title}</H4>}
      <View style={styles.sectionBody}>{children}</View>
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
      <View style={styles.fieldContent}>{children}</View>
    </View>
  );
}

function RadioRow({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.radioRow}>
      <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
        {selected && <View style={styles.radioInner} />}
      </View>
      <ThemedText>{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    gap: 14,
  },

  flex: {
    flex: 1,
  },

  errorCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 12,
  },

  startModeBlock: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    flex: 1,
  },

  startModeTitle: {
    fontWeight: "700",
    paddingTop: 2,
  },

  section: {
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  sectionTitle: {
    fontWeight: "700",
    marginBottom: 8,
  },

  sectionBody: {
    gap: 12,
  },

  radioGroup: {
    gap: 8,
  },

  radioInlineGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 18,
  },

  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  radioOuter: {
    width: 16,
    height: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  radioOuterSelected: {
    borderColor: theme.colors.primary ?? theme.colors,
  },

  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: theme.colors.primary ?? theme.colors,
  },

  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },

  fieldLabelWrap: {
    width: 140,
  },

  fieldLabel: {
    fontWeight: "700",
  },

  fieldContent: {
    flex: 1,
  },

  inlineInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  inlineHintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  protocolWrap: {
    width: 120,
  },

  smallInputWrap: {
    width: 110,
  },

  hintText: {
    opacity: 0.75,
  },

  localModeArea: {
    flexDirection: "row",
    gap: 20,
  },

  leftLocalMode: {
    flex: 1,
    gap: 14,
  },

  rightLocalMode: {
    width: 240,
    justifyContent: "flex-start",
  },

  databaseStatusBox: {
    borderTopWidth: 1,
    borderColor: theme.colors.border,
    paddingTop: 16,
    marginTop: 8,
    gap: 6,
  },

  successText: {
    fontWeight: "700",
  },

  embeddedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },

  tableActions: {
    flexDirection: "row",
    gap: 6,
  },

  agentTable: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 110,
  },

  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },

  tableCell: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontWeight: "700",
  },

  tableEmptyRow: {
    padding: 12,
  },

  tableEditRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },

  tableRowSelected: {
    opacity: 0.85,
  },

  tableInputCell: {
    flex: 1,
    padding: 6,
  },
}));