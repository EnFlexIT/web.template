import React, { useEffect, useMemo, useState } from "react";
import { FlatList, Modal, Pressable, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useTranslation } from "react-i18next";

import { ThemedText } from "../../components/themed/ThemedText";
import { ActionButton } from "../../components/ui-elements/ActionButton";
import { Card } from "../../components/ui-elements/Card";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { useAppSelector } from "../../hooks/useAppSelector";

import {
  logoutAsync,
  selectIp,
  setJwtForServer,
  normalizeBaseUrl,
  getJwtForServer,
  setIsLogoutDialogOpen,
  type AuthMethod,
} from "../../redux/slices/apiSlice";
import { setLogoutFlowActive } from "../../redux/slices/logoutFlowGuard";
import { selectServers } from "../../redux/slices/serverSlice";
import {
  checkServerAuthenticated,
  checkServerReachable,
} from "../login/serverCheck";

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
  authenticationMethod: AuthMethod;
};

const SERVER_STATUS_REFRESH_EVENT = "server-status-refresh";

export function LogoutDialog({ visible, onClose }: Props) {
  const dispatch = useAppDispatch();
  const currentIp = useAppSelector(selectIp);
  const serversState = useAppSelector(selectServers);
  const { t } = useTranslation(["Login"]);

  const [loading, setLoading] = useState(false);
  const [selectedServerIds, setSelectedServerIds] = useState<string[]>([]);
  const [loggedInServers, setLoggedInServers] = useState<LogoutServerItem[]>([]);
  const [serversLoaded, setServersLoaded] = useState(false);

  const servers = serversState?.servers ?? [];
  const currentNormalizedIp = normalizeBaseUrl(currentIp);

  useEffect(() => {
    setLogoutFlowActive(visible);
    dispatch(setIsLogoutDialogOpen(visible));

    return () => {
      setLogoutFlowActive(false);
      dispatch(setIsLogoutDialogOpen(false));
    };
  }, [dispatch, visible]);

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
      const entries = await Promise.all(
        servers.map(async (server) => {
          const normalized = normalizeBaseUrl(server.baseUrl);

          try {
            const reachable = await checkServerReachable(server.baseUrl);
            if (!reachable.ok) return null;

            const jwt = await getJwtForServer(server.baseUrl);
            const info = await checkServerAuthenticated(server.baseUrl, jwt);

            // JWT lokal vorhanden, aber serverseitig nicht mehr gültig
            if (jwt && !info.authenticated) {
              await setJwtForServer(server.baseUrl, null);
            }

            if (!info.authenticated) {
              return null;
            }

            return {
              id: server.id,
              name: server.name?.trim() || server.baseUrl,
              baseUrl: server.baseUrl,
              normalizedBaseUrl: normalized,
              isCurrent: normalized === currentNormalizedIp,
              authenticationMethod: info.authenticationMethod,
            } satisfies LogoutServerItem;
          } catch {
            return null;
          }
        }),
      );

      const allLoggedInServers = entries
        .filter((server): server is LogoutServerItem => server !== null)
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

  function handleClose() {
    if (loading) return;
    setLogoutFlowActive(false);
    dispatch(setIsLogoutDialogOpen(false));
    onClose();
  }

  function toggleSelectAll() {
    setLogoutFlowActive(true);

    if (allSelected) {
      setSelectedServerIds([]);
      return;
    }

    setSelectedServerIds(serversToRender.map((server) => server.id));
  }

  function toggleServer(serverId: string) {
    setLogoutFlowActive(true);

    setSelectedServerIds((prev) =>
      prev.includes(serverId)
        ? prev.filter((id) => id !== serverId)
        : [...prev, serverId],
    );
  }

  async function handleLogout() {
    if (loading) return;

    setLogoutFlowActive(true);
    setLoading(true);

    try {
      if (!hasMultipleLoggedInServers) {
        await dispatch(logoutAsync()).unwrap();

        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event(SERVER_STATUS_REFRESH_EVENT));
        }

        handleClose();
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

      // Für andere Server: lokalen Token löschen.
      // Das reicht für JWT und für OIDC-Bearer im lokalen Storage.
      for (const server of selectedOtherServers) {
        await setJwtForServer(server.baseUrl, null);
      }

      if (selectedCurrentServer) {
        // Aktueller Server: lokales Token + laufende Session sauber beenden
        await dispatch(logoutAsync()).unwrap();
      } else {
        dispatch(setIsLogoutDialogOpen(false));
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(SERVER_STATUS_REFRESH_EVENT));
      }

      handleClose();
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = hasMultipleLoggedInServers
    ? serversLoaded && !loading && selectedServerIds.length > 0
    : serversLoaded && !loading;

  const logoutLabel = loading ? t("Abmelden...") : t("Abmelden");

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <ThemedText style={styles.title}>{t("Abmelden")}</ThemedText>

          <ThemedText style={styles.body}>
            {hasMultipleLoggedInServers
              ? t("Wählen Sie aus, von welchen Servern Sie sich abmelden möchten.")
              : t("Möchten Sie sich vom aktuellen Server abmelden?")}
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
                    {t("Alle auswählen")}
                  </ThemedText>
                </Pressable>

                <View style={styles.divider} />

                <FlatList
                  data={serversToRender}
                  keyExtractor={(item) => item.id}
                  style={styles.scroll}
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator
                  nestedScrollEnabled
                  renderItem={({ item: server }) => {
                    const checked = selectedServerIds.includes(server.id);

                    return (
                      <Pressable
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

                          <ThemedText style={styles.serverAuth}>
                            {server.authenticationMethod === "oidc" ? "OIDC" : "JWT"}
                          </ThemedText>
                        </View>
                      </Pressable>
                    );
                  }}
                />
              </Card>
            </View>
          ) : null}

          <View style={styles.actions}>
            <ActionButton
              label={t("Abbrechen")}
              variant="secondary"
              onPress={handleClose}
              size="sm"
              disabled={loading}
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

  section: {
    gap: 10,
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
    flexGrow: 0,
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

  serverAuth: {
    fontSize: 11,
    opacity: 0.7,
    fontWeight: "600",
  },

  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 4,
  },
}));