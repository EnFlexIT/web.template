// src/components/ui-elements/Infobox.tsx
import React from "react";
import { View, StyleSheet as NativeStyleSheet, ViewStyle } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { ThemedText } from "../themed/ThemedText";

export type InfoboxTone = "info" | "success" | "warning" | "danger";

type InfoboxProps = {
  title: string;
  subtitle?: string;
  tone?: InfoboxTone;
  children?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
};


export function Infobox({
  title,
  subtitle,
  tone = "info",
  children,
  style,
}: InfoboxProps) {
  const { theme } = useUnistyles();

 
  const toneColor =
    tone === "success"
      ? "#2ecc71"
      : tone === "warning"
      ? "#f39c12"
      : tone === "danger"
      ? "#ff4d4f"
      : theme.colors.border; 


  const softBg = theme.colors.text + "08"; 

  return (
    <View
      style={[
        ui.box,
        {
          borderColor: toneColor,
          backgroundColor: softBg,
        },
        style,
      ]}
    >
      <View style={ui.headerRow}>
        <View
          style={[
            ui.badge,
            {
              backgroundColor: tone === "info" ? theme.colors.border : toneColor,
            },
          ]}
        />
        <View style={{ flex: 1 }}>
          <ThemedText style={ui.title}>{title}</ThemedText>
          {!!subtitle && <ThemedText >{subtitle}</ThemedText>}
        </View>
      </View>

      {!!children && <View style={ui.body}>{children}</View>}
    </View>
  );
}

const ui = NativeStyleSheet.create({
  box: {
    width: "100%",
    borderWidth: 1,
   
    padding: 14,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  badge: {
    width: 10,
    height: 10,

  },
  title: {
    fontSize: 14,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
  body: {
    marginTop: 10,
    gap: 6,
  },
});
