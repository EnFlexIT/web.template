import React from "react";
import { Switch, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

interface TableSwitchCellProps {
  value: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}

export function TableSwitchCell({
  value,
  onChange,
  disabled = false,
}: TableSwitchCellProps) {
  const { theme } = useUnistyles();

  return (
    <View style={styles.container}>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{
          false: theme.colors.highlight,
          true: theme.colors.highlight,
        }}
        thumbColor={value ? "rgb(0, 122, 255)" : "rgb(0, 122, 255)"}

        
      />
    </View>
  );
}

const styles = StyleSheet.create(() => ({
  container: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
}));
