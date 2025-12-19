import { View, Pressable } from "react-native";
import { Text } from "../stylistic/Text";
import { StyleSheet } from "react-native-unistyles";
import { useUnistyles } from "react-native-unistyles";
import { useState } from "react";

interface DropdownProps<T extends string> {
  value: T;
  options: Record<T, string>;
  onChange: (value: T) => void;
}

export function Dropdown<T extends string>({
  value,
  options,
  onChange,
}: DropdownProps<T>) {
  const { theme } = useUnistyles();
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.wrapper}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={[
          styles.button,
          { borderColor: theme.colors.border },
        ]}
      >
        <Text>{options[value]}</Text>
        <Text style={{ opacity: 0.6 }}>
          {open ? "▲" : "▼"}
        </Text>
      </Pressable>

      {open && (
        <View
          style={[
            styles.menu,
            {
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.card,
            },
          ]}
        >
          {(Object.keys(options) as T[]).map((key) => {
            const active = key === value;
            return (
              <Pressable
                key={key}
                onPress={() => {
                  onChange(key);
                  setOpen(false);
                }}
                style={[
                  styles.item,
                  active && {
                    backgroundColor:
                      theme.colors.background,
                  },
                ]}
              >
                <Text
                  style={{
                    color: active
                      ? theme.colors.highlight
                      : theme.colors.text,
                  }}
                >
                  {options[key]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
    flex: 1,
  },
  button: {
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  menu: {
    marginTop: 6,
    borderWidth: 1,
    borderRadius: 6,
    overflow: "hidden",
  },
  item: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
});
