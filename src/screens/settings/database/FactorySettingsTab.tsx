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

import { useAppDispatch } from "../../../hooks/useAppDispatch";
import { useAppSelector } from "../../../hooks/useAppSelector";
import {
  fetchDbSettings,
  selectDbSettingsLoading,
  selectDbSystems,
  selectFactories,
  selectFactoryStates,
} from "../../../redux/slices/dbSettingsSlice";

const AntDesign = withUnistyles(AntDesign_);

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

export function FactorySettingsTab() {
  const dispatch = useAppDispatch();

  const dbSystems = useAppSelector(selectDbSystems);
  const factories = useAppSelector(selectFactories);
  const factoryStates = useAppSelector(selectFactoryStates);
  const isLoading = useAppSelector(selectDbSettingsLoading);

  const [factoryId, setFactoryId] = useState<string>("");
  const [databaseSystem, setDatabaseSystem] = useState<string>("");
  const [database, setDatabase] = useState<string>("agentWorkbench");
  const [urlParams, setUrlParams] = useState<string>("");
  const [user, setUser] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  useEffect(() => {
    if (factories.length === 0 || dbSystems.length === 0) {
      dispatch(fetchDbSettings());
    }
  }, [dispatch, factories.length, dbSystems.length]);

  useEffect(() => {
    if (!factoryId && factories.length > 0) {
      setFactoryId(factories[0]);
    }
  }, [factories, factoryId]);

  useEffect(() => {
    if (!databaseSystem && dbSystems.length > 0) {
      setDatabaseSystem(dbSystems[0]);
    }
  }, [dbSystems, databaseSystem]);

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

  const selectedFactoryState = factoryId
    ? factoryStates[factoryId] ?? "NotAvailableYet"
    : "NotAvailableYet";

  const selectedFactoryStateMeta = useMemo(() => {
    return getFactoryStateMeta(selectedFactoryState);
  }, [selectedFactoryState]);

  return (
    <Card style={styles.card} padding="md">
      <View style={styles.container}>
        <View style={styles.header}>
          <H2>Individual Database Connections & Settings</H2>
          <View style={styles.separator} />
        </View>

        {isLoading ? <ThemedText>Loading...</ThemedText> : null}

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
                value={factoryId}
                options={factoryOptions}
                onChange={(value) => setFactoryId(String(value))}
              />
            </View>
            <View style={styles.topField}>
              <H4 style={styles.topLabel}>Database System</H4>
              <Dropdown
                size="sm"
                value={databaseSystem}
                options={databaseSystemOptions}
                onChange={(value) => setDatabaseSystem(String(value))}
              />
            </View>
          </View>
        </View>

        <View style={styles.settingsBox}>
          <FieldRow
            label={
              <View style={styles.inlineLabel}>
                <ThemedText style={styles.fieldLabel}>Database</ThemedText>
              
              </View>
            }
          >
            <TextInput size="sm" value={database} onChangeText={setDatabase} />
          </FieldRow>

          <FieldRow label="Add. URL-Params">
            <TextInput size="sm" value={urlParams} onChangeText={setUrlParams} />
          </FieldRow>

          <FieldRow label="Resulting URL">
            <TextInput size="sm" value="-" onChangeText={() => {}} disabled />
          </FieldRow>

          <FieldRow label="User Name">
            <TextInput size="sm" value={user} onChangeText={setUser} />
          </FieldRow>

          <FieldRow label="Password">
            <TextInput
              size="sm"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </FieldRow>
        </View>

        <View style={styles.actions}>
          <ActionButton
            label="Test Connection"
            size="sm"
            onPress={() => {
              console.log("Test factory DB connection for:", factoryId);
            }}
          />
          <ActionButton
            label="Save"
            size="sm"
            variant="secondary"
            onPress={() => {
              console.log("Save factory DB settings for:", factoryId);
            }}
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
    height: 600,
  },

  container: {
    gap: 20,
  },

  header: {
    gap: 12,
  },

  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
    opacity: 0.9,
  },

  topSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginVertical: -15,
  },

  topFields: {
    flex: 1,
    flexDirection: "column",
    gap: 10,
    marginBottom: 10,
  },

  topField: {
    flex: 1,
    gap: 8,
  },

  topLabel: {
    fontWeight: "700",
  },

  statusBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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
    paddingBottom: 24,
    gap: 12,
    height: 245,
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
    marginTop: -10,
  },
}));