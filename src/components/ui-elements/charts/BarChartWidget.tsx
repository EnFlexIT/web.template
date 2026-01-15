import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Text } from "../../stylistic/Text";
import { BarChartProps } from "./types";

export function BarChartWidget({ data, height = 120 }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <View style={styles.wrapper}>
      {/* Chart Area */}
      <View style={[styles.container, { height }]}>
        {data.map((item, idx) => {
          const barHeight = (item.value / max) * height;

          return (
            <View key={idx} style={styles.barWrapper}>
              <View style={[styles.bar, { height: barHeight }]} />
            </View>
          );
        })}
      </View>

      {/* Labels */}
      <View style={styles.labelsRow}>
        {data.map((item, idx) => (
          <Text key={idx} style={styles.label}>
            {item.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  wrapper: {
    gap: 6,
  },

  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },

  barWrapper: {
    flex: 1,
    justifyContent: "flex-end",
  },

  bar: {
    width: "100%",
    borderRadius: 6,
    backgroundColor: theme.colors.highlight,
    opacity: 0.9,
  },

  labelsRow: {
    flexDirection: "row",
    gap: 8,
  },

  label: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    opacity: 0.75,
    color: theme.colors.text,
  },
}));
