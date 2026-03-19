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
  fetchDbSettings,
  selectDbSystems,
  selectDbSettingsLoading,
} from "../../../redux/slices/dbSettingsSlice";

export function GeneralSettingsTab() {
  const dispatch = useAppDispatch();

  const dbSystems = useAppSelector(selectDbSystems);
  const isLoading = useAppSelector(selectDbSettingsLoading);

  const [useForEveryConnection, setUseForEveryConnection] = useState(false);
  const [databaseSystem, setDatabaseSystem] = useState("");
  const [database, setDatabase] = useState("agentWorkbench");
  const [urlParams, setUrlParams] = useState("create=true");
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (dbSystems.length === 0) {
      dispatch(fetchDbSettings());
    }
  }, [dispatch, dbSystems.length]);

  useEffect(() => {
    if (!databaseSystem && dbSystems.length > 0) {
      setDatabaseSystem(dbSystems[0]);
    }
  }, [dbSystems, databaseSystem]);

  const databaseSystemOptions = useMemo(() => {
    return dbSystems.reduce<Record<string, string>>((acc, system) => {
      acc[system] = system;
      return acc;
    }, {});
  }, [dbSystems]);

  const resultingUrl = useMemo(() => {
    const system = databaseSystem.toLowerCase();

    if (system.includes("derby") && system.includes("network")) {
      return `jdbc:derby://localhost:1527/${database};${urlParams}`;
    }

    if (system.includes("derby")) {
      return `jdbc:derby:${database};${urlParams}`;
    }

    if (system.includes("mysql")) {
      return `jdbc:mysql://localhost:3306/${database}?${urlParams}`;
    }

    if (system.includes("mariadb")) {
      return `jdbc:mariadb://localhost:3306/${database}?${urlParams}`;
    }

    if (system.includes("postgres")) {
      return `jdbc:postgresql://localhost:5432/${database}?${urlParams}`;
    }

    return database;
  }, [databaseSystem, database, urlParams]);

  return (
    <Card style={styles.card} padding="md">
      <View style={styles.container}>
        <View style={styles.header}>
          <H2>General Database Connection Settings</H2>
          <View style={styles.separator} />
        </View>

        {isLoading && <ThemedText>Loading...</ThemedText>}

        <Checkbox
          label="Use settings below for every database connection"
          value={useForEveryConnection}
          onChange={setUseForEveryConnection}
        />

        <View style={styles.sectionTitleWrap}>
          <H4 style={styles.sectionTitle}>Database Settings</H4>
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
            <TextInput
              size="sm"
              value={userName}
              onChangeText={setUserName}
            />
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
              console.log("Test general DB connection");
            }}
            disabled
          />
          <ActionButton
            label="Save"
            size="sm"
            variant="secondary"
            onPress={() => {
              console.log("Save general DB settings");
            }}
            disabled
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

  sectionTitleWrap: {
    marginTop: -4,
  },

  sectionTitle: {
    fontWeight: "700",
    opacity: 0.75,
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
    gap: 12,
    height: 300,
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
    marginTop: -2,
  },
}));