// src/components/ui-elements/Stat/MetricCard.tsx
import React from "react";
import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Card } from "./Card";

type MetricCardProps = {
  title: string;
  subtitle?: string;
  value: string;
  icon?: string;
};

export function MetricCard({ title, subtitle, value, icon }: MetricCardProps) {
  return (
    <Card style={styles.card} padding="sm">
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      <View style={styles.valueRow}>
        {!!icon && <Text style={styles.icon}>{icon}</Text>}
        <Text style={styles.value}>{value}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: { flex: 1 },

  header: { gap: 2 },
  title: { color: theme.colors.text, fontSize: 16, fontWeight: "700" },
  subtitle: { color: theme.colors.text, opacity: 0.65, fontSize: 13 },

  valueRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  icon: { fontSize: 18 },
  value: { color: theme.colors.text, fontSize: 22, fontWeight: "800" },
}));
