import React, { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { ScrollView } from "react-native-gesture-handler";

import { ThemedText } from "../../components/themed/ThemedText";
import { ActionButton } from "../../components/ui-elements/ActionButton";
import { Card } from "../../components/ui-elements/Card";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { useAppSelector } from "../../hooks/useAppSelector";

import {
  logoutAsync,
  selectIp,
  loadJwtByServer,
  setJwtForServer,
  normalizeBaseUrl,
} from "../../redux/slices/apiSlice";
import { selectServers } from "../../redux/slices/serverSlice";

type Props = {
  visible: boolean;
  onClose: () => void;
};

type LogoutServerItem = {
  id: string;
  name: string;
  baseUrl: string;
  normalizedBaseUrl: string;
  isCurrent: boolean;
};

const SERVER_STATUS_REFRESH_EVENT = "server-status-refresh";

export function LogoutDialog({ visible, onClose }: Props) {
  const dispatch = useAppDispatch();
  const currentIp = useAppSelector(selectIp);
  const serversState = useAppSelector(selectServers);

  const [loading, setLoading] = useState(false);
  const [selectedServerIds, setSelectedServerIds] = useState<string[]>([]);
  const [loggedInServers, setLoggedInServers] = useState<LogoutServerItem[]>([]);
  const [serversLoaded, setServersLoaded] = useState(false);

  const servers = serversState?.servers ?? [];
  const currentNormalizedIp = normalizeBaseUrl(currentIp);

  useEffect(() => {
    if (!visible) {
      setSelectedServerIds([]);
      setLoggedInServers([]);
      setServersLoaded(false);
      return;
    }

    let mounted = true;

    setServersLoaded(false);

    (async () => {
      const jwtMap = await loadJwtByServer();

      const allLoggedInServers = servers
        .filter((server) => {
          const normalized = normalizeBaseUrl(server.baseUrl);
          return !!jwtMap[normalized];
        })
        .map<LogoutServerItem>((server) => {
          const normalized = normalizeBaseUrl(server.baseUrl);

          return {
            id: server.id,
            name: server.name?.trim() || server.baseUrl,
            baseUrl: server.baseUrl,
            normalizedBaseUrl: normalized,
            isCurrent: normalized === currentNormalizedIp,
          };
        })
        .sort((a, b) => {
          if (a.isCurrent) return -1;
          if (b.isCurrent) return 1;
          return a.name.localeCompare(b.name);
        });

      if (!mounted) return;

      setLoggedInServers(allLoggedInServers);

      const currentServer = allLoggedInServers.find((server) => server.isCurrent);

      setSelectedServerIds(currentServer ? [currentServer.id] : []);
      setServersLoaded(true);
    })();

    return () => {
      mounted = false;
    };
  }, [visible, servers, currentNormalizedIp]);

  const hasMultipleLoggedInServers = loggedInServers.length > 1;

  const serversToRender = useMemo<LogoutServerItem[]>(() => {
    if (!hasMultipleLoggedInServers) return [];
    return loggedInServers;
  }, [hasMultipleLoggedInServers, loggedInServers]);

  const allSelected =
    serversToRender.length > 0 &&
    serversToRender.every((server) => selectedServerIds.includes(server.id));

  const someSelected = selectedServerIds.length > 0 && !allSelected;

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedServerIds([]);
      return;
    }

    setSelectedServerIds(serversToRender.map((server) => server.id));
  }

  function toggleServer(serverId: string) {
    setSelectedServerIds((prev) =>
      prev.includes(serverId)
        ? prev.filter((id) => id !== serverId)
        : [...prev, serverId],
    );
  }

  async function handleLogout() {
    if (loading) return;

    setLoading(true);

    try {
      if (!hasMultipleLoggedInServers) {
        await dispatch(logoutAsync()).unwrap();

        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event(SERVER_STATUS_REFRESH_EVENT));
        }

        onClose();
        return;
      }

      const selectedServers = loggedInServers.filter((server) =>
        selectedServerIds.includes(server.id),
      );

      if (selectedServers.length === 0) {
        return;
      }

      const selectedCurrentServer = selectedServers.find((server) => server.isCurrent);
      const selectedOtherServers = selectedServers.filter((server) => !server.isCurrent);

      for (const server of selectedOtherServers) {
        await setJwtForServer(server.baseUrl, null);
      }

      if (selectedCurrentServer) {
        await dispatch(logoutAsync()).unwrap();
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(SERVER_STATUS_REFRESH_EVENT));
      }

      onClose();
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = hasMultipleLoggedInServers
    ? serversLoaded && !loading && selectedServerIds.length > 0
    : serversLoaded && !loading;

  const logoutLabel = loading ? "Abmelden..." : "Abmelden";

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <ThemedText style={styles.title}>Abmelden</ThemedText>

          <ThemedText style={styles.body}>
            {hasMultipleLoggedInServers
              ? "Wähle aus, von welchen Servern du dich abmelden möchtest."
              : "Möchtest du dich vom aktuellen Server abmelden?"}
          </ThemedText>

          {hasMultipleLoggedInServers ? (
            <View style={styles.section}>
              <Card style={styles.listCard} padding="sm">
                <Pressable style={styles.selectAllRow} onPress={toggleSelectAll}>
                  <View
                    style={[
                      styles.checkbox,
                      (allSelected || someSelected) && styles.checkboxChecked,
                    ]}
                  >
                    {allSelected ? (
                      <ThemedText style={styles.checkmark}>✓</ThemedText>
                    ) : someSelected ? (
                      <View style={styles.partialMark} />
                    ) : null}
                  </View>

                  <ThemedText style={styles.selectAllText}>
                    Alle auswählen
                  </ThemedText>
                </Pressable>

                <View style={styles.divider} />

                <ScrollView
                  style={styles.scroll}
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator
                >
                  {serversToRender.map((server) => {
                    const checked = selectedServerIds.includes(server.id);

                    return (
                      <Pressable
                        key={server.id}
                        style={styles.row}
                        onPress={() => toggleServer(server.id)}
                      >
                        <View
                          style={[
                            styles.checkbox,
                            checked && styles.checkboxChecked,
                          ]}
                        >
                          {checked ? (
                            <ThemedText style={styles.checkmark}>✓</ThemedText>
                          ) : null}
                        </View>

                        <View style={styles.serverTextWrap}>
                          <ThemedText style={styles.serverName}>
                            {server.name}
                          </ThemedText>

                          <ThemedText style={styles.serverUrl}>
                            ({server.baseUrl})
                          </ThemedText>
                        </View>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </Card>
            </View>
          ) : null}

          <View style={styles.actions}>
            <ActionButton
              label="Abbrechen"
              variant="secondary"
              onPress={onClose}
              size="sm"
            />
            <ActionButton
              label={logoutLabel}
              variant="secondary"
              onPress={handleLogout}
              size="sm"
              disabled={!canSubmit}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create((theme) => ({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.30)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  card: {
    width: 480,
    maxWidth: "100%",
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
    borderWidth: 1,
    padding: 18,
    gap: 16,
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
  },

  body: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.9,
  },

  currentInfo: {
    gap: 4,
  },

  currentInfoLabel: {
    fontSize: 12,
    fontWeight: "700",
    opacity: 0.7,
  },

  currentInfoValue: {
    fontSize: 13,
  },

  section: {
    gap: 10,
  },

  linkLike: {
    fontSize: 14,
    textDecorationLine: "underline",
  },

  listCard: {
    marginTop: 4,
    maxHeight: 280,
  },

  selectAllRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingBottom: 8,
  },

  selectAllText: {
    fontSize: 13,
    fontWeight: "600",
  },

  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    opacity: 0.8,
    marginBottom: 8,
  },

  scroll: {
    maxHeight: 210,
  },

  scrollContent: {
    gap: 8,
    paddingBottom: 4,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 2,
    paddingHorizontal: 2,
  },

  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  checkboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },

  checkmark: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 10,
  },

  partialMark: {
    width: 8,
    height: 2,
    backgroundColor: "#fff",
  },

  serverTextWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    flexWrap: "wrap",
  },

  serverName: {
    fontSize: 14,
    fontWeight: "500",
  },

  serverUrl: {
    fontSize: 11,
    opacity: 0.6,
  },

  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 4,
  },
}));