// src/components/layout/Footer.tsx
import React from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { ThemedText } from "./themed/ThemedText";
import { useAppSelector } from "../hooks/useAppSelector";
import { selectApi } from "../redux/slices/apiSlice";
import { selectConnectivity } from "../redux/slices/connectivitySlice";
import { getAppEnvironment } from "../util/appEnvironment";

function getHostLabel(ip: string): string {
  if (!ip) return "Kein Server";

  try {
    const url = new URL(ip);
    return url.host;
  } catch {
    return ip.replace(/^https?:\/\//, "");
  }
}

export function Footer() {
  const { ip, isBaseMode } = useAppSelector(selectApi);
  const { isOffline } = useAppSelector(selectConnectivity);

  const env = getAppEnvironment();
  const host = getHostLabel(ip);
  const deviceMode = isBaseMode ? "Base Application" : "USER MODE";
  const status = isOffline ? "Offline" : "Online";

  return (
    <View style={styles.footer}>
      <View style={[styles.badge, styles[getEnvStyleKey(env)]]}>
        <ThemedText style={styles.badgeText}>{env}</ThemedText>
      </View>
     <ThemedText style={styles.text}>{deviceMode}</ThemedText>
     <ThemedText style={styles.separator}>|</ThemedText>
      <ThemedText style={styles.text}>{host}</ThemedText>   
      <ThemedText style={styles.separator}>|</ThemedText>
      <ThemedText style={styles.text}>{status}</ThemedText>
    </View>
  );
}

function getEnvStyleKey(env: "DEV" | "TEST" | "PROD") {
  switch (env) {
    case "TEST":
      return "testBadge";
   
    case "DEV":
    default:
      return "devBadge";
  }
}

const styles = StyleSheet.create((theme) => ({
  footer: {
    minHeight: 42,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    flexWrap: "wrap",
  },

  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },

  devBadge: {
    backgroundColor: "#F59E0B",
  },

  testBadge: {
    backgroundColor: "#3B82F6",
  },

  prodBadge: {
    backgroundColor: "#6B7280",
  },

  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
  },

  text: {
    fontSize: 12,
  },

  separator: {
    fontSize: 12,
    opacity: 0.6,
  },
}));