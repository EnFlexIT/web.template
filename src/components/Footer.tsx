import React, { useMemo } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { ThemedText } from "./themed/ThemedText";
import { Dropdown } from "./ui-elements/Dropdown";
import { useAppSelector } from "../hooks/useAppSelector";
import { useAppDispatch } from "../hooks/useAppDispatch";

import {
  selectIp,
  selectIsBaseMode,
  switchServer,
} from "../redux/slices/apiSlice";

import { selectConnectivity } from "../redux/slices/connectivitySlice";
import {
  selectSelectedServer,
  selectServers,
  selectServer,
} from "../redux/slices/serverSlice";

import { getAppEnvironment } from "../util/appEnvironment";

export function Footer() {
  const dispatch = useAppDispatch();

  const ip = useAppSelector(selectIp);
  const isBaseMode = useAppSelector(selectIsBaseMode);
  const { isOffline } = useAppSelector(selectConnectivity);

  const env = getAppEnvironment();
  const selectedServer = useAppSelector(selectSelectedServer);
  const serversState = useAppSelector(selectServers);

  const deviceMode = isBaseMode ? "Base Application" : "User Mode";
  const status = isOffline ? "Offline" : "Online";

  const serverOptions = useMemo(() => {
    const entries = (serversState?.servers ?? []).map((server) => [
      server.id,
      server.name?.trim() || server.baseUrl,
    ]);

    return Object.fromEntries(entries) as Record<string, string>;
  }, [serversState?.servers]);

  async function handleServerChange(serverId: string) {
    const server = serversState?.servers?.find((s) => s.id === serverId);
    if (!server) return;

    dispatch(selectServer(serverId));
    await dispatch(switchServer(server.baseUrl));
  }

  return (
    <View style={styles.footer}>
      <View style={[styles.badge, styles[getEnvStyleKey(env)]]}>
        <ThemedText style={styles.badgeText}>{env}</ThemedText>
      </View>

      <ThemedText style={styles.separator}>|</ThemedText>
      <ThemedText style={styles.text}>{deviceMode}</ThemedText>

      <ThemedText style={styles.separator}>|</ThemedText>

      <View style={styles.serverDropdownWrap}>
      <Dropdown
          value={selectedServer?.id ?? "local"}
          options={serverOptions}
          onChange={handleServerChange}
          size="xs"
          appearance="menu"
          menuWidth={140}
      />
      </View>

      <ThemedText style={styles.separator}>|</ThemedText>
      <ThemedText style={styles.text}>{status}</ThemedText>
    </View>
  );
}

function getEnvStyleKey(env: "DEV" | "TEST" | "PROD") {
  switch (env) {
    case "TEST":
      return "testBadge";
    case "PROD":
      return "prodBadge";
    case "DEV":
    default:
      return "devBadge";
  }
}

const styles = StyleSheet.create((theme) => ({
  footer: {
    minHeight: 25,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
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
   
  },

  text: {
  
  },

  separator: {
    
    opacity: 0.6,
  },

  serverDropdownWrap: {
    minWidth: 100,
    maxWidth: 230,
  },
}));