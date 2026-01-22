import { View, TextInput } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useUnistyles } from "react-native-unistyles";
import { useMemo, useState } from "react";
import { H2 } from "../../../components/stylistic/H2";
import { H4 } from "../../../components/stylistic/H4";
//ui-elements
import { Checkbox } from "../../../components/ui-elements/Checkbox";
import { Dropdown } from "../../../components/ui-elements/Dropdown";
import { ActionButton } from "../../../components/ui-elements/ActionButton";

type DatabaseSystem =
  | "derby_embedded"
  | "derby_network"
  | "mysql"
  | "MairaDB";

const DATABASE_SYSTEMS: Record<DatabaseSystem, string> = {
  derby_embedded: "Apache Derby (Embedded)",
  derby_network: "Apache Derby (Network)",
  mysql: "MySQL",
  MairaDB: "MairaDB",
};

export function GeneralSettingsTab() {
  const { theme } = useUnistyles();

  // UI State
  const [applyAll, setApplyAll] = useState(true);
  const [dbSystem, setDbSystem] =
    useState<DatabaseSystem>("derby_embedded");

  const [database, setDatabase] = useState("ems");
  const [params, setParams] = useState("create=true");

  // Resulting URL (demo logic)
  const resultingUrl = useMemo(() => {
    if (dbSystem === "derby_embedded")
      return `jdbc:derby:${database};${params}`;
    if (dbSystem === "derby_network")
      return `jdbc:derby://localhost:1527/${database};${params}`;
    if (dbSystem === "mysql")
      return `jdbc:mysql://localhost:3306/${database}?${params}`;
    if (dbSystem === "MairaDB")
      return `jdbc:MairaDB://localhost:5432/${database}?${params}`;
    return "";
  }, [dbSystem, database, params]);

  return (
    <View style={styles.container}>
      {/* Apply to all */}
      <Checkbox
        value={applyAll}
        onChange={setApplyAll}
        label="Use settings below for every database connection"
      />


      {/* Database system */}
      <H2 >Database System</H2>
        <Dropdown
          value={dbSystem}
          options={DATABASE_SYSTEMS}
          onChange={setDbSystem}
        />
      

      {/* Database */}
      <Field label="Database">
        <TextInput
          value={database}
          onChangeText={setDatabase}
          style={[
            styles.input,
            { borderColor: theme.colors.border },
          ]}
        />
      </Field>

      {/* Params */}
      <Field label="Add. URL-Params.">
        <TextInput
          value={params}
          onChangeText={setParams}
          style={[
            styles.input,
            { borderColor: theme.colors.border },
          ]}
        />
      </Field>

      {/* Resulting URL */}
      <Field label="Resulting URL">
        <TextInput
          value={resultingUrl}
          editable={false}
          style={[
            styles.input,
            {
              borderColor: theme.colors.border,
              opacity: 0.6,
            },
          ]}
        />
      </Field>

      {/* Buttons */}
      <View style={styles.buttons}>
        <ActionButton
          label="Test Connection"
          onPress={() => {
            console.log("Test Connection", {
              applyAll,
              dbSystem,
              database,
              params,
            });
          }}
        />

        <ActionButton
          label="Save"
          variant="primary"
          onPress={() => {
            console.log("Save Settings", {
              applyAll,
              dbSystem,
              database,
              params,
            });
          }}
        />
      </View>
    </View>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ gap: 6 }}>
      <H4 style={{ opacity: 0.8 }}>
        {label}
      </H4>
      {children}
    </View>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.row}>
      <H4 >{label}</H4>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16, },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  input: {
    borderWidth: 1,
    padding: 10,
  },
  buttons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
});
