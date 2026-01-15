// src/components/ui-elements/charts/ChartCard.tsx
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Text } from "../../stylistic/Text";
import { ThemedView } from "../../themed/ThemedView";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function ChartCard({ title, subtitle, children }: ChartCardProps) {
  return (
    <ThemedView style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      <View style={styles.content}>{children}</View>
    </ThemedView>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  header: {
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 12,
    opacity: 0.7,
    color: theme.colors.text,
  },
  content: {
    marginTop: 8,
  },
}));
