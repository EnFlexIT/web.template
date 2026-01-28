import { View, Pressable } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useState } from "react";
import { useUnistyles } from "react-native-unistyles";
import { GeneralSettingsTab } from "./database/GeneralSettingsTab";
import { FactorySettingsTab } from "./database/FactorySettingsTab";
import { DerbyNetworkServerTab } from "./database/DerbyNetworkServerTab";
import { H4 } from "../../components/stylistic/H4";
import { H2 } from "../../components/stylistic/H2";
import { Screen } from "../../components/Screen";
type TabKey = "general" | "factory" | "derby";

export function DatabaseConnectionsSettings() {
  const [activeTab, setActiveTab] = useState<TabKey>("general");

  return (
    <Screen>
    <View style={styles.container}>
      {/* Header */}
      <View >
        <H2 >
          Database Connections & Settings
        </H2>
        <H4 >
          Configure database system and runtime behaviour.
        </H4>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <Tab
          label="General"
          active={activeTab === "general"}
          onPress={() => setActiveTab("general")}
        />
        <Tab
          label="Factory Settings"
          active={activeTab === "factory"}
          onPress={() => setActiveTab("factory")}
        />
        <Tab
          label="Derby Network Server"
          active={activeTab === "derby"}
          onPress={() => setActiveTab("derby")}
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === "general" && <GeneralSettingsTab />}
        {activeTab === "factory" && <FactorySettingsTab />}
        {activeTab === "derby" && <DerbyNetworkServerTab />}
      </View>
    </View>
    </Screen>
  );
}

function Tab({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const { theme } = useUnistyles();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.tab,
        {
          borderBottomColor: active
            ? theme.colors.highlight
            : theme.colors.border,
        },
      ]}
    >
      <H4 
        style={{
          fontWeight: active ? "600" : "400",
          color: active ? theme.colors.highlight : theme.colors.text,
        }}
      >
        {label}
      </H4>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    padding: 24,
    gap: 24,
    
  },
  header: {
    gap: 6,
  },
 
 
  tabs: {
    flexDirection: "row",
    gap: 24,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tab: {
    paddingBottom: 10,
    borderBottomWidth: 2,
  },
  content: {
    marginTop: 12,
  },
}));
