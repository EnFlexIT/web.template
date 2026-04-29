import React, { useEffect, useMemo, useState } from "react";
import { View, Pressable, Modal } from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import AntDesign_ from "@expo/vector-icons/AntDesign";

import { ActionButton } from "../../components/ui-elements/ActionButton";
import { Dropdown } from "../../components/ui-elements/Dropdown";
import { TextInput } from "../../components/ui-elements/TextInput";
import { Card } from "../../components/ui-elements/Card";
import { H4 } from "../../components/stylistic/H4";
import { ThemedText } from "../../components/themed/ThemedText";
import {
  SelectableList,
  SelectableItem,
} from "../../components/ui-elements/SelectableList";

import { useAppDispatch } from "../../hooks/useAppDispatch";
import { useAppSelector } from "../../hooks/useAppSelector";

import {
  fetchDbSettings,
  selectFactories,
  selectFactoryStates,
} from "../../redux/slices/dbSettingsSlice";

import {
  addEmbeddedSystemAgent,
  clearExecSettingsError,
  fetchAvailableExecAgents,
  fetchExecSettings,
  fetchProjects,
  fetchProjectSetups,
  removeEmbeddedSystemAgent,
  saveExecSettings,
  selectAvailableExecAgents,
  selectExecSettings,
  selectExecSettingsError,
  selectExecSettingsLoading,
  selectExecSettingsProjects,
  selectExecSettingsProjectSetups,
  selectExecSettingsSaving,
  selectLocalIpSelections,
  setEmbeddedSystemAgentField,
  setExecSettingsField,
} from "../../redux/slices/execSettingsSlice";

const AntDesign = withUnistyles(AntDesign_);

type StartMode = "application" | "service" | "SERVER";
type LocalAddressMode = "jade" | "ip";
type RunAsMode = "service" | "embedded";

type FactoryStateMeta = {
  label: string;
  color: string;
  iconName: React.ComponentProps<typeof AntDesign>["name"];
};

function mapBackendStartModeToUi(value: string): StartMode {
  switch (value) {
    case "APPLICATION":
    case "Application":
      return "application";
    case "BACKGROUND_SYSTEM":
    case "SERVER":
      return "SERVER";
    case "DEVICE_SYSTEM":
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
    case "SERVER":
      return "SERVER";
    case "service":
      return "DEVICE_SYSTEM";
    default:
      return "APPLICATION";
  }
}

function mapBackendLocalModeToUi(value: string): LocalAddressMode {
  switch (value) {
    case "ConfiguredByIPandPort":
      return "ip";
    case "ConfiguredByJADE":
    default:
      return "jade";
  }
}

function mapUiLocalModeToBackend(value: LocalAddressMode): string {
  switch (value) {
    case "ip":
      return "ConfiguredByIPandPort";
    case "jade":
    default:
      return "ConfiguredByJADE";
  }
}

function mapDeviceModeToUi(value: string): RunAsMode {
  switch (value) {
    case "AGENT":
      return "embedded";
    case "SETUP":
    default:
      return "service";
  }
}

function mapUiToDeviceMode(value: RunAsMode): string {
  switch (value) {
    case "embedded":
      return "AGENT";
    case "service":
    default:
      return "SETUP";
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

function extractIpAddress(value: string): string {
  const match = String(value ?? "").match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/);
  return match?.[0] ?? String(value ?? "");
}

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

export function ProgramStartTab() {
  const dispatch = useAppDispatch();

  const factories = useAppSelector(selectFactories);
  const factoryStates = useAppSelector(selectFactoryStates);

  const settings = useAppSelector(selectExecSettings);
  const projects = useAppSelector(selectExecSettingsProjects);
  const projectSetups = useAppSelector(selectExecSettingsProjectSetups);
  const availableAgents = useAppSelector(selectAvailableExecAgents);
  const localIpSelections = useAppSelector(selectLocalIpSelections);

  const isLoading = useAppSelector(selectExecSettingsLoading);
  const isSaving = useAppSelector(selectExecSettingsSaving);
  const error = useAppSelector(selectExecSettingsError);

  const [selectedAgentIndex, setSelectedAgentIndex] = useState<number | null>(
    null,
  );
  const [isAgentModalVisible, setIsAgentModalVisible] = useState(false);
  const [selectedAgentClass, setSelectedAgentClass] = useState("");
  const [newAgentName, setNewAgentName] = useState("");

  const [isIpModalVisible, setIsIpModalVisible] = useState(false);
  const [selectedIp, setSelectedIp] = useState("");

  useEffect(() => {
    dispatch(fetchExecSettings());
    dispatch(fetchProjects());
    dispatch(fetchAvailableExecAgents());
    dispatch(fetchDbSettings());
  }, [dispatch]);

  useEffect(() => {
    if (settings.embeddedSystemProject) {
      dispatch(fetchProjectSetups(settings.embeddedSystemProject));
    }
  }, [dispatch, settings.embeddedSystemProject]);

  const startMode = mapBackendStartModeToUi(settings.startAs);
  const localAddressMode = mapBackendLocalModeToUi(settings.localMtpCreation);

  const serverMasterUrlParts = splitServerMasterUrl(settings.serverMasterUrl);
  const urlProtocol = settings.serverMasterProtocol || serverMasterUrlParts.protocol;
  const serverIp = extractIpAddress(serverMasterUrlParts.host);

  const port = String(settings.serverMasterPort ?? "");
  const mtpPort = String(settings.serverMasterPortMtp ?? "");

  const localIpRaw = settings.localMtpUrl ?? "";
  const localIp = extractIpAddress(localIpRaw);
  const localMtpPort = String(settings.localMtpPort ?? "");
  const mtpProtocol = settings.localMtpProtocol ?? "HTTP";

  const isBackgroundMode = startMode === "SERVER";
  const isServiceMode = startMode === "service";
  const useIpAddress = localAddressMode === "ip";
  const hasSelectedProject = !!settings.embeddedSystemProject;

  const runAsMode = mapDeviceModeToUi(settings.deviceSystemExecMode);

const isEmbeddedMode = runAsMode === "embedded";
const isServiceRunMode = runAsMode === "service";
  const projectOptions = useMemo(
    () => toOptions(projects, settings.embeddedSystemProject),
    [projects, settings.embeddedSystemProject],
  );

  const serviceSetupOptions = useMemo(
    () => toOptions(projectSetups, settings.serviceSetup),
    [projectSetups, settings.serviceSetup],
  );

  const availableAgentItems = useMemo<SelectableItem<string>[]>(() => {
    return availableAgents.map((agent) => ({
      id: agent.className,
      label: agent.className,
    }));
  }, [availableAgents]);

  const localIpItems = useMemo<SelectableItem<string>[]>(() => {
    return localIpSelections.map((ip) => ({
      id: ip,
      label: ip,
    }));
  }, [localIpSelections]);

  const backgroundFactoryId =
    settings.factoryId || factories[0] || "de.enflexit.awb.bgSystem.db";

  const backgroundFactoryState =
    factoryStates[backgroundFactoryId] ?? "NotAvailableYet";

  const backgroundFactoryStateMeta = getFactoryStateMeta(backgroundFactoryState);

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
  };

  const onChangeServerIp = (value: string) => {
    clearError();
    dispatch(
      setExecSettingsField({
        key: "serverMasterUrl",
        value: extractIpAddress(value),
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
        value: extractIpAddress(value),
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

    await dispatch(
      saveExecSettings({
        ...settings,
        serverMasterUrl: extractIpAddress(settings.serverMasterUrl ?? ""),
        localMtpUrl: extractIpAddress(settings.localMtpUrl ?? ""),
      }),
    );
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
              selected={startMode === "SERVER"}
              onPress={() => onChangeStartMode("SERVER")}
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
                disabled={isLoading || isSaving}
              />
            </View>

            <ThemedText>://</ThemedText>

            <View style={styles.flex}>
              <TextInput
                size="sm"
                value={serverIp}
                onChangeText={onChangeServerIp}
                disabled={isLoading || isSaving}
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
                disabled={isLoading || isSaving}
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
                disabled={isLoading || isSaving}
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

              <View style={styles.ipAddressOptionRow}>
                <RadioRow
                  label="Use IP-Address"
                  selected={localAddressMode === "ip"}
                  onPress={() => onChangeLocalAddressMode("ip")}
                />
                <ActionButton
                label="✎"
                size="sm"
                variant="secondary"
                onPress={() => {
                    clearError();

                    setSelectedIp(
                    localIp || localIpSelections[0] || "",
                    );

                    setIsIpModalVisible(true);
                }}
                disabled={!useIpAddress || isLoading || isSaving}
                />
                            </View>
            </View>
            <View style={ styles.inlineInputRow}>
            <ThemedText> IP</ThemedText>
              <TextInput
                size="sm"
                value={localIp}
                onChangeText={onChangeLocalIp}
                disabled={!useIpAddress || isLoading || isSaving}
                placeholder="Auto-Configuration"
              />
            </View>
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
        <View style={styles.databaseStatusBox}>
          <View style={styles.databaseStatusBody}>
            <AntDesign
              name={backgroundFactoryStateMeta.iconName}
              size={16}
              color={backgroundFactoryStateMeta.color}
            />

            <ThemedText style={styles.successText}>
              SessionFactory '{backgroundFactoryId}':{" "}
              {backgroundFactoryStateMeta.label}
            </ThemedText>
          </View>
        </View>
      )}

      {isServiceMode && (
        <Section title="Agent.Workbench - Service / Embedded System Agent">
          <FieldRow label="Project">
            <Dropdown
              size="sm"
              value={settings.embeddedSystemProject}
              options={projectOptions}
              onChange={(value) => {
                const nextProject = String(value);

                clearError();

                dispatch(
                  setExecSettingsField({
                    key: "embeddedSystemProject",
                    value: nextProject,
                  }),
                );

                dispatch(
                  setExecSettingsField({
                    key: "serviceSetup",
                    value: "",
                  }),
                );

                setSelectedAgentIndex(null);

                if (nextProject) {
                  dispatch(fetchProjectSetups(nextProject));
                }
              }}
              disabled={isLoading || isSaving}
            />
          </FieldRow>

          <View style={!hasSelectedProject && styles.disabledArea}>
            <FieldRow label="Run as">
              <View style={styles.radioInlineGroup}>
                <RadioRow
                  label="Service"
                  selected={runAsMode === "service"}
                  disabled={!hasSelectedProject}
                  onPress={() => {
                    if (!hasSelectedProject) return;

                    clearError();
                    dispatch(
                      setExecSettingsField({
                        key: "deviceSystemExecMode",
                        value: mapUiToDeviceMode("service"),
                      }),
                    );
                  }}
                />

                <RadioRow
                  label="Embedded System Agent"
                  selected={runAsMode === "embedded"}
                  disabled={!hasSelectedProject}
                  onPress={() => {
                    if (!hasSelectedProject) return;

                    clearError();
                    dispatch(
                      setExecSettingsField({
                        key: "deviceSystemExecMode",
                        value: mapUiToDeviceMode("embedded"),
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
                if (!hasSelectedProject || isEmbeddedMode) return;

                clearError();
                dispatch(
                    setExecSettingsField({
                    key: "serviceSetup",
                    value: String(value),
                    }),
                );
                }}
                disabled={isLoading || isSaving || !hasSelectedProject || isEmbeddedMode}
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
                    if (!hasSelectedProject) return;

                    clearError();
                    setNewAgentName("");
                    setSelectedAgentClass("");
                    dispatch(fetchAvailableExecAgents());
                    setIsAgentModalVisible(true);
                  }}
                  disabled={
                    isLoading ||
                    isSaving ||
                    !isEmbeddedMode ||
                    !hasSelectedProject
                  }
                />

                <ActionButton
                  label="-"
                  size="sm"
                  onPress={() => {
                    if (!hasSelectedProject) return;
                    if (selectedAgentIndex == null) return;

                    clearError();
                    dispatch(removeEmbeddedSystemAgent(selectedAgentIndex));
                    setSelectedAgentIndex(null);
                  }}
                  disabled={
                    isLoading ||
                    isSaving ||
                    !isEmbeddedMode ||
                    !hasSelectedProject ||
                    selectedAgentIndex == null
                  }
                />
              </View>
            </View>

            <View
              style={[
                styles.agentTable,
                (!isEmbeddedMode || !hasSelectedProject) && styles.disabledArea,
              ]}
            >
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
                    onPress={() => {
                      if (!hasSelectedProject || !isEmbeddedMode) return;
                      setSelectedAgentIndex(index);
                    }}
                    disabled={!hasSelectedProject || !isEmbeddedMode}
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
                          if (!hasSelectedProject) return;

                          clearError();
                          dispatch(
                            setEmbeddedSystemAgentField({
                              index,
                              key: "agentName",
                              value,
                            }),
                          );
                        }}
                        disabled={
                          isLoading ||
                          isSaving ||
                          !isEmbeddedMode ||
                          !hasSelectedProject
                        }
                      />
                    </View>

                    <View style={styles.tableInputCell}>
                      <TextInput
                        size="sm"
                        value={agent.className}
                        onChangeText={(value) => {
                          if (!hasSelectedProject) return;

                          clearError();
                          dispatch(
                            setEmbeddedSystemAgentField({
                              index,
                              key: "className",
                              value,
                            }),
                          );
                        }}
                        disabled={
                          isLoading ||
                          isSaving ||
                          !isEmbeddedMode ||
                          !hasSelectedProject
                        }
                      />
                    </View>
                  </Pressable>
                ))
              )}
            </View>
          </View>

          <Modal
            visible={isAgentModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setIsAgentModalVisible(false)}
          >
            <View style={styles.modalBackdrop}>
              <View style={styles.modalCard}>
                <H4 style={styles.sectionTitle}>Class-Selector</H4>

                <ThemedText style={styles.fieldLabel}>
                  Please select the agent that you want to start:
                </ThemedText>

                <TextInput
                  size="sm"
                  value={newAgentName}
                  onChangeText={setNewAgentName}
                  placeholder="Agent name"
                />

                <View style={styles.modalActions}>
                  <ActionButton
                    label="Apply"
                    size="sm"
                    onPress={() => {
                      if (!selectedAgentClass) return;

                      const nextAgentName =
                        newAgentName.trim() ||
                        selectedAgentClass.split(".").pop() ||
                        "Agent";

                      dispatch(
                        addEmbeddedSystemAgent({
                          agentName: nextAgentName,
                          className: selectedAgentClass,
                        }),
                      );

                      setSelectedAgentIndex(
                        settings.embeddedSystemAgents.length,
                      );
                      setIsAgentModalVisible(false);
                      setSelectedAgentClass("");
                      setNewAgentName("");
                    }}
                    disabled={!selectedAgentClass}
                  />

                  <ActionButton
                    label="Cancel"
                    size="sm"
                    variant="secondary"
                    onPress={() => {
                      setIsAgentModalVisible(false);
                      setSelectedAgentClass("");
                      setNewAgentName("");
                    }}
                  />
                </View>

                <View style={styles.modalSeparator} />

                <ThemedText style={styles.fieldLabel}>
                  Search & Select Class extends jade.core.Agent
                </ThemedText>

                <SelectableList
                  items={availableAgentItems}
                  value={selectedAgentClass}
                  onChange={setSelectedAgentClass}
                  maxHeight={420}
                  minVisibleRows={8}
                  size="xs"
                  variant="secondary"
                  showSearch
                  emptyText="Keine Agent-Klassen geladen."
                />
              </View>
            </View>
          </Modal>
        </Section>
      )}

      <Modal
        visible={isIpModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setIsIpModalVisible(false);
          setSelectedIp("");
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <H4 style={styles.sectionTitle}>IP-Selector</H4>

            <ThemedText style={styles.fieldLabel}>
              Please select the local IP address:
            </ThemedText>

            <SelectableList
              items={localIpItems}
              value={selectedIp}
              onChange={setSelectedIp}
              maxHeight={320}
              minVisibleRows={5}
              size="xs"
              variant="secondary"
              showSearch
              emptyText="Keine lokalen IP-Adressen geladen."
            />

            <View style={styles.modalActions}>
              <ActionButton
                label="Apply"
                size="sm"
                onPress={() => {
                  if (!selectedIp) return;

                  dispatch(
                    setExecSettingsField({
                      key: "localMtpUrl",
                      value: extractIpAddress(selectedIp),
                    }),
                  );

                  setIsIpModalVisible(false);
                  setSelectedIp("");
                }}
                disabled={!selectedIp}
              />

              <ActionButton
                label="Cancel"
                size="sm"
                variant="secondary"
                onPress={() => {
                  setIsIpModalVisible(false);
                  setSelectedIp("");
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  disabled = false,
  onPress,
}: {
  label: string;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={styles.radioRow}
    >
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

  ipAddressOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
    borderColor: theme.colors.primary,
  },

  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
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

  disabledArea: {
    opacity: 0.45,
  },

  databaseStatusBox: {
    borderTopWidth: 1,
    borderColor: theme.colors.border,
    paddingTop: 16,
    marginTop: 8,
    gap: 6,
  },

  databaseStatusBody: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  modalCard: {
    width: "90%",
    maxWidth: 900,
    maxHeight: "90%",
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    padding: 16,
    gap: 12,
  },

  modalActions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
  },

  modalSeparator: {
    height: 1,
    backgroundColor: theme.colors.border,
    opacity: 0.9,
    marginVertical: 4,
  },
}));