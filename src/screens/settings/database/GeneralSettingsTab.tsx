import React, { useMemo, useState } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useUnistyles } from "react-native-unistyles";

import { H4 } from "../../../components/stylistic/H4";
import { TextInput } from "../../../components/ui-elements/TextInput";
import { Checkbox } from "../../../components/ui-elements/Checkbox";
import { Dropdown } from "../../../components/ui-elements/Dropdown";
import { ActionButton } from "../../../components/ui-elements/ActionButton";
import { Card } from "../../../components/ui-elements/Card";
import { ThemedText } from "../../../components/themed/ThemedText";
import { H2 } from "../../../components/stylistic/H2";

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

export function GeneralSettingsTab() {
  const { theme } = useUnistyles();

  const [applyAll, setApplyAll] = useState(false);
  const [dbSystem, setDbSystem] = useState<DatabaseSystem>("derby_embedded");
  const [database, setDatabase] = useState("agentWorkbench");
  const [params, setParams] = useState("create=true");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const resultingUrl = useMemo(() => {
    if (dbSystem === "derby_embedded") {
      return `jdbc:derby:${database};${params}`;
    }

    if (dbSystem === "derby_network") {
      return `jdbc:derby://localhost:1527/${database};${params}`;
    }

    if (dbSystem === "mysql") {
      return `jdbc:mysql://localhost:3306/${database}?${params}`;
    }

    if (dbSystem === "mariadb") {
      return `jdbc:mariadb://localhost:3306/${database}?${params}`;
    }

    return "";
  }, [dbSystem, database, params]);

  return (
    <Card style={styles.outerCard} padding="md">
      <View style={styles.container}>
        <H2 style={styles.mainTitle}>
          General Database Connection Settings
        </H2>
         <View style={styles.separator} />

        <View style={styles.checkboxRow}>
          <Checkbox
            value={applyAll}
            onChange={setApplyAll}
            label="Use settings below for every database connection"
          />
        </View>

        <ThemedText style={styles.sectionTitle}>Database Settings</ThemedText>

        <View style={styles.systemRow}>
          <View style={styles.leftLabelWrap}>
            <ThemedText style={styles.leftLabel}>Database System:</ThemedText>
          </View>

          <View style={styles.rightFieldWrap}>
            <Dropdown
              size="sm"
              value={dbSystem}
              options={DATABASE_SYSTEMS}
              onChange={(value) => setDbSystem(value as DatabaseSystem)}
            />
          </View>
        </View>

        <View
          style={[
            styles.settingsBox,
            {
              borderColor: theme.colors.border,
           
            },
          ]}
        >
          <FieldRow label="Database">
            <TextInput
              size="sm"
              value={database}
              onChangeText={setDatabase}
              placeholder="Database"
            />
          </FieldRow>

          <FieldRow label="Add. URL-Params.">
            <TextInput
              size="sm"
              value={params}
              onChangeText={setParams}
              placeholder="create=true"
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
              value={username}
              onChangeText={setUsername}
              placeholder=""
            />
          </FieldRow>

          <FieldRow label="Password">
            <TextInput
              size="sm"
              value={password}
              onChangeText={setPassword}
              placeholder=""
              secureTextEntry
            />
          </FieldRow>
        </View>

        <View style={styles.buttonRow}>
         

          <ActionButton
            size="sm"
            label="Test Connection"
            onPress={() => {
              console.log("Test Connection", {
                applyAll,
                dbSystem,
                database,
                params,
                username,
                password,
              });
            }}
          />

           <ActionButton
            size="sm"
            label="Save"
            variant="secondary"
            onPress={() => {
              console.log("Save Settings", {
                applyAll,
                dbSystem,
                database,
                params,
                username,
                password,
              });
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
      <View style={styles.leftLabelWrap}>
        <ThemedText style={styles.fieldLabel}>{label}</ThemedText>
      </View>

      <View style={styles.rightFieldWrap}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  outerCard: {
    width: "100%",
    height: 505,
  },

  container: {
    gap: 18,
  },

  mainTitle: {
   
    fontWeight: "700",
  },

  checkboxRow: {
    marginTop: 2,
  },

  sectionTitle: {
  
    fontWeight: "700",
   
   
  },

  systemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginTop: 4,
  },

  settingsBox: {
    marginTop: 2,
    borderWidth: 1,
    paddingTop: 10,
    paddingBottom: 26,
    paddingHorizontal: 10,
    gap: 10,
    Height: 400,
  
  },

  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },

  leftLabelWrap: {
    width: 190,
    justifyContent: "center",
  },

  rightFieldWrap: {
    flex: 1,
  },

  leftLabel: {
   
    fontWeight: "700",
   
  },

  fieldLabel: {
   
    fontWeight: "700",
   
  },

  buttonRow: {
    flexDirection: "row",
    
    alignItems: "center",
    marginTop: -5,
    
    gap: 15,
  },
    separator: {
    height: 1,
    backgroundColor: theme.colors.border,
    opacity: 0.9,
  },
}));