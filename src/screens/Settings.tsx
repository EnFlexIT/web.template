import { View } from "react-native";
import { Text } from "../components/stylistic/Text";
import { Card } from "../components/ui-elements/Card";
import { StyleSheet } from "react-native-unistyles";
import { useUnistyles } from "react-native-unistyles";
import { useLinkTo } from "@react-navigation/native";

export function SettingsScreen() {
  const linkTo = useLinkTo();
  const { theme } = useUnistyles();
  const colors: any = theme.colors;

  const descriptionColor =
    colors.textMuted ?? colors.subText ?? colors.textSecondary ?? theme.colors.text;

  return (
    <View style={{ flex: 1, padding: 24, gap: 24 }}>
      {/* Header */}
      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 22, fontWeight: "600" }}>Settings</Text>
        <Text style={{ fontSize: 14, opacity: 0.7 }}>
          Configure system behaviour and upcoming features.
        </Text>
      </View>

      {/* Cards */}
      <View style={{ gap: 12 }}>
        <Card onPress={() => linkTo("/3010")} contentStyle={styles.cardContent}>
          <Text style={styles.title}>Database Connections & Settings</Text>
          <Text style={[styles.description, { color: descriptionColor }]}>
            Configure database system, connection parameters and credentials.
          </Text>
        </Card>

        <Card contentStyle={styles.cardContent}>
          <Text style={styles.title}>Operating Mode</Text>
          <Text style={[styles.description, { color: descriptionColor }]}>
            Configure server and runtime behaviour.
          </Text>
        </Card>

        <Card contentStyle={styles.cardContent}>
          <Text style={styles.title}>Feature Handling</Text>
          <Text style={[styles.description, { color: descriptionColor }]}>
            Enable or disable system features.
          </Text>
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create(() => ({
  cardContent: {
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  description: {
    fontSize: 13,
    opacity: 0.8,
  },
}));
