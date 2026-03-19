import React, { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

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
  selectFactories,
  selectFactoryStates,
  selectDbSettingsLoading,
} from "../../../redux/slices/dbSettingsSlice";

type DatabaseSystem =
  | "derby_embedded"
  | "derby_network"
  | "mysql"
  | "mariadb";

const DATABASE_SYSTEMS: Record<DatabaseSystem, string> = {
  derby_embedded: "Apache Derby (Embedded)",
  derby_network: "Apache Derby (Network)",
  mysql: "MySQL",
  mariadb: "MariaDB",
};

export function FactorySettingsTab() {
  const dispatch = useAppDispatch();

  const factories = useAppSelector(selectFactories);
  const factoryStates = useAppSelector(selectFactoryStates);
  const isLoading = useAppSelector(selectDbSettingsLoading);

  const [factoryId, setFactoryId] = useState("");
  const [databaseSystem, setDatabaseSystem] =
    useState<DatabaseSystem>("derby_embedded");
  const [database, setDatabase] = useState("agentWorkbench");
  const [urlParams, setUrlParams] = useState("create=true");
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (factories.length === 0) {
      dispatch(fetchDbSettings());
    }
  }, [dispatch, factories.length]);

  useEffect(() => {
    if (!factoryId && factories.length > 0) {
      setFactoryId(factories[0]);
    }
  }, [factories, factoryId]);

  const factoryOptions = useMemo(() => {
    return factories.reduce<Record<string, string>>((acc, factory) => {
      acc[factory] = factory;
      return acc;
    }, {});
  }, [factories]);

  const selectedFactoryState = factoryId
    ? factoryStates[factoryId] ?? "NotAvailableYet"
    : "-";

  const resultingUrl = useMemo(() => {
    if (databaseSystem === "derby_embedded") {
      return `jdbc:derby:${database};${urlParams}`;
    }

    if (databaseSystem === "derby_network") {
      return `jdbc:derby://localhost:1527/${database};${urlParams}`;
    }

    if (databaseSystem === "mysql") {
      return `jdbc:mysql://localhost:3306/${database}?${urlParams}`;
    }

    return `jdbc:mariadb://localhost:3306/${database}?${urlParams}`;
  }, [databaseSystem, database, urlParams]);

  return (
    <Card style={styles.card} padding="md">
      <View style={styles.container}>
        <View style={styles.header}>
          <H2>Individual Database Connections & Settings</H2>
          <View style={styles.separator} />
        </View>

        {isLoading && <ThemedText>Loading...</ThemedText>}

        <View style={styles.topSection}>
          <View style={styles.topFields}>
            <View style={styles.topField}>
              <H4 style={styles.topLabel}>Factory-ID</H4>
              <Dropdown
                size="sm"
                value={factoryId}
                options={factoryOptions}
                onChange={(value) => setFactoryId(String(value))}
              />
            </View>

            <View style={styles.topField}>
              <H4 style={styles.topLabel}>Factory Status</H4>
              <Card padding="sm">
                <ThemedText>{selectedFactoryState}</ThemedText>
              </Card>
            </View>

            <View style={styles.topField}>
              <H4 style={styles.topLabel}>Database System</H4>
              <Dropdown
                size="sm"
                value={databaseSystem}
                options={DATABASE_SYSTEMS}
                onChange={(value) => setDatabaseSystem(value as DatabaseSystem)}
              />
            </View>
          </View>
        </View>

        <View style={styles.settingsBox}>
          <FieldRow label="Database">
            <TextInput
              size="sm"
              value={database}
              onChangeText={setDatabase}
            />
          </FieldRow>

          <FieldRow label="Add. URL-Params">
            <TextInput
              size="sm"
              value={urlParams}
              onChangeText={setUrlParams}
            />
          </FieldRow>

          <FieldRow label="Resulting URL">
            <TextInput
              size="sm"
              value={resultingUrl}
              onChangeText={() => {}}
              disabled
            />
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