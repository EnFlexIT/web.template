import { View, Pressable } from "react-native";
import { Text } from "../../components/stylistic/Text";
import { StyleSheet } from "react-native-unistyles";
import { useState } from "react";
import { useUnistyles } from "react-native-unistyles";
import { GeneralSettingsTab } from "./database/GeneralSettingsTab";
import { FactorySettingsTab } from "./database/FactorySettingsTab";
import { DerbyNetworkServerTab } from "./database/DerbyNetworkServerTab";

type TabKey = "general" | "factory" | "derby";

export function DatabaseConnectionsSettings() {
  const { theme } = useUnistyles();
  const [activeTab, setActiveTab] = useState<TabKey>("general");

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          Database Connections & Settings
        </Text>
        <Text style={styles.subtitle}>
          Configure database system and runtime behaviour.
        </Text>
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
      <Text
        style={{
          fontWeight: active ? "600" : "400",
          color: active ? theme.colors.highlight : theme.colors.text,
        }}
      >
        {label}
      </Text>
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
  title: {
    fontSize: 22,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
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
