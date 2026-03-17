// src/components/ServerSwitchOverlay.tsx
import React from "react";
import { ActivityIndicator, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { ThemedText } from "../components/themed/ThemedText";
import { useAppSelector } from "../hooks/useAppSelector";
import { selectIsSwitchingServer } from "../redux/slices/apiSlice";

export function ServerSwitchOverlay() {
  const isSwitchingServer = useAppSelector(selectIsSwitchingServer);

  if (!isSwitchingServer) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <ActivityIndicator />
        <ThemedText>Server wird gewechselt…</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  overlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(0,0,0,0.20)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  card: {
    minWidth: 220,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
}));