import React from "react";
import { View, ViewStyle } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useUnistyles } from "react-native-unistyles";
import { Tab } from "./Tab";

export type TabsBarItem<TKey extends string = string> = {
  key: TKey;
  label: string;
  disabled?: boolean;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  testID?: string;
};

export type TabsBarProps<TKey extends string = string> = {
  items: ReadonlyArray<TabsBarItem<TKey>>;
  activeKey: TKey;
  onChange: (key: TKey) => void;

  style?: ViewStyle;
  gap?: number; // default 24
};

export function TabsBar<TKey extends string = string>({
  items,
  activeKey,
  onChange,
  style,
  gap = 24,
}: TabsBarProps<TKey>) {
  const { theme } = useUnistyles();

  return (
    <View
      style={[
        styles.tabs,
        { borderBottomColor: theme.colors.border, gap },
        style,
      ]}
    >
      {items.map((it) => (
        <Tab
          key={it.key}
          label={it.label}
          active={it.key === activeKey}
          disabled={it.disabled}
          onPress={() => onChange(it.key)}
          leftSlot={it.leftSlot}
          rightSlot={it.rightSlot}
          testID={it.testID}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
});