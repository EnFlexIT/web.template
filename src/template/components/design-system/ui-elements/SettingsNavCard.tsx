// src/components/ui-elements/Settings/SettingsNavCard.tsx
import React from "react";
import { View, Text } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Card } from "./Card";
import { Icon } from "../ui-elements/Icon/Icon";
type Props = {
  title: string;
  subtitle?: string;
  icon?: any; // falls dein Icon typed ist: IconName
  onPress: () => void;
};

export function SettingsNavCard({ title, subtitle, icon, onPress }: Props) {
  return (
    <Card onPress={onPress} padding="md" style={styles.card}>
      <View style={styles.row}>
        <View style={styles.left}>
          <View style={styles.titleRow}>
            {!!icon && <Icon name={icon} size={18} />}
            <Text style={styles.title}>{title}</Text>
          </View>

          {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>

        <Text style={styles.chevron}>›</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {},

  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  left: { flex: 1, gap: 4 },

  titleRow: { flexDirection: "row", alignItems: "center", gap: 10 },

  title: { color: theme.colors.text, fontSize: 16, fontWeight: "700" },
  subtitle: { color: theme.colors.text, opacity: 0.65, fontSize: 13 },

  chevron: { color: theme.colors.text, opacity: 0.5, fontSize: 22 },
}));