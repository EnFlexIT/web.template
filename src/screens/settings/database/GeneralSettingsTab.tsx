import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useUnistyles } from "react-native-unistyles";
import { useMemo, useState } from "react";
import { H4 } from "../../../components/stylistic/H4";
import { TextInput } from "../../../components/ui-elements/TextInput";
import { Checkbox } from "../../../components/ui-elements/Checkbox";
import { Dropdown } from "../../../components/ui-elements/Dropdown";
import { ActionButton } from "../../../components/ui-elements/ActionButton";
import { Screen } from "../../../components/Screen";

type DatabaseSystem = "derby_embedded" | "derby_network" | "mysql" | "MairaDB";

const DATABASE_SYSTEMS: Record<DatabaseSystem, string> = {
  derby_embedded: "Apache Derby (Embedded)",
  derby_network: "Apache Derby (Network)",
  mysql: "MySQL",
  MairaDB: "MairaDB",
};

export function GeneralSettingsTab() {
  const { theme } = useUnistyles();

  const [applyAll, setApplyAll] = useState(true);
  const [dbSystem, setDbSystem] = useState<DatabaseSystem>("derby_embedded");
  const [database, setDatabase] = useState("ems");
  const [params, setParams] = useState("create=true");

  const resultingUrl = useMemo(() => {
    if (dbSystem === "derby_embedded") return `jdbc:derby:${database};${params}`;
    if (dbSystem === "derby_network")
      return `jdbc:derby://localhost:1527/${database};${params}`;
    if (dbSystem === "mysql")
      return `jdbc:mysql://localhost:3306/${database}?${params}`;
    if (dbSystem === "MairaDB")
      return `jdbc:MairaDB://localhost:5432/${database}?${params}`;
    return "";
  }, [dbSystem, database, params]);

  return (
    <Screen>
      <View style={styles.container}>
        {/* Apply to all */}
        <Checkbox
          value={applyAll}
          onChange={setApplyAll}
          label="Use settings below for every database connection"
        />

        {/* Database system */}
        <H4 style={styles.sectionTitle}>Database System</H4>
        <Dropdown  size="sm"value={dbSystem} options={DATABASE_SYSTEMS} onChange={setDbSystem} />

        {/* Database */}
        <Field label="Database">
          <TextInput
            size="sm"
            value={database}
            onChangeText={setDatabase}
            placeholder="e.g. ems"
          />
        </Field>

        {/* Params */}
        <Field label="Add. URL-Params.">
          <TextInput
            size="sm"
            value={params}
            onChangeText={setParams}
            placeholder="e.g. create=true"
          />
        </Field>

        {/* Resulting URL */}
        <Field label="Resulting URL">
          <TextInput
            size="sm"
            value={resultingUrl}
            onChangeText={() => {}}
            disabled
          />
        </Field>

        {/* Buttons */}
        <View style={styles.buttons}>
          <ActionButton
            size="sm"
            label="Test Connection"
            onPress={() => {
              console.log("Test Connection", { applyAll, dbSystem, database, params });
            }}
          />

          <ActionButton
            size="sm"
            label="Save"
            variant="secondary"
            onPress={() => {
              console.log("Save Settings", { applyAll, dbSystem, database, params });
            }}
          />
        </View>
      </View>
    </Screen>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <H4 style={{ opacity: 0.8 }}>{label}</H4>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  sectionTitle: {
    marginTop: 6,
  },
  buttons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
});
