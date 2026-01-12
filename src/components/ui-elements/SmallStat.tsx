// src/components/ui-elements/Stat/SmallStat.tsx
import React from "react";
import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Card } from "./Card";

type SmallStatProps = {
  label: string;
  value: string;
  icon?: string;
};

export function SmallStat({ label, value, icon }: SmallStatProps) {
  return (
    <Card style={styles.card} padding="sm">
      <View style={styles.top}>
        {!!icon && <Text style={styles.icon}>{icon}</Text>}
        <Text style={styles.label}>{label}</Text>
      </View>

      <Text style={styles.value}>{value}</Text>
    </Card>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    flex: 1,
    borderRadius: 16,
    minHeight: 80,
  },

  top: { flexDirection: "row", alignItems: "center", gap: 8 },
  icon: { fontSize: 16 },
  label: { color: theme.colors.text, fontSize: 14, fontWeight: "700", opacity: 0.9 },
  value: { marginTop: 6, color: theme.colors.text, fontSize: 20, fontWeight: "800" },
}));
