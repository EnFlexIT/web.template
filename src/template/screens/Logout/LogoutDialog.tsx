import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  View,
} from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useTranslation } from "react-i18next";

import { ThemedText } from "../../../components/themed/ThemedText";
import { ActionButton } from "../../../components/ui-elements/ActionButton";
import { Card } from "../../../components/ui-elements/Card";
import { useAppDispatch } from "../../../hooks/useAppDispatch";
import { useAppSelector } from "../../../hooks/useAppSelector";

import {
  logoutAsync,
  selectIp,
  selectIsLoggedIn,
  selectAuthenticationMethod,
  normalizeBaseUrl,
  setIsLogoutDialogOpen,
} from "../../../redux/slices/apiSlice";

import {
  getLoggedInServers,
  logoutSelectedServers,
  type LogoutServerItem,
} from "../../../core/authentication/logout/logoutServers";

import { setLogoutFlowActive } from "../../../core/authentication/logout/logoutFlowGuard";
import { selectServers } from "../../../redux/slices/serverSlice";
import { setServerStatus } from "../../../redux/slices/serverStatusSlice";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function LogoutDialog({
  visible,
  onClose,
}: Props) {
  const dispatch = useAppDispatch();

  const currentIp = useAppSelector(selectIp);
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const authenticationMethod = useAppSelector(
    selectAuthenticationMethod,
  );
  const serversState = useAppSelector(selectServers);

  const { t } = useTranslation(["Login"]);

  const [loading, setLoading] = useState(false);
  const [selectedServerIds, setSelectedServerIds] =
    useState<string[]>([]);
  const [loggedInServers, setLoggedInServers] = useState<
    LogoutServerItem[]
  >([]);
  const [serversLoaded, setServersLoaded] =
    useState(false);

  const servers = serversState?.servers ?? [];
  const currentNormalizedIp = normalizeBaseUrl(currentIp);

  function markServerLoggedOut(
    serverId: string | null | undefined,
  ): void {
    if (!serverId) return;

    dispatch(
      setServerStatus({
        serverId,
        status: {
          tone: "yellow",
          subtitle: t("erreichbarNichtEinloggt"),
        },
      }),
    );
  }

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

    void getLoggedInServers({
      servers,
      currentIp,
      isLoggedIn,
      authenticationMethod,
    })
      .then((result) => {
        if (!mounted) return;

        setLoggedInServers(result);

        const currentItem = result.find(
          (server) => server.isCurrent,
        );

        setSelectedServerIds(
          currentItem ? [currentItem.id] : [],
        );

        setServersLoaded(true);
      })
      .catch((error) => {
        if (!mounted) return;

        console.error(
          "[LOGOUT] Could not determine logged-in servers",
          error,
        );

        setLoggedInServers([]);
        setSelectedServerIds([]);
        setServersLoaded(true);
      });

    return () => {
      mounted = false;
    };
  }, [
    visible,
    servers,
    currentIp,
    isLoggedIn,
    authenticationMethod,
  ]);

  const hasMultipleLoggedInServers =
    loggedInServers.length > 1;

  const serversToRender =
    useMemo<LogoutServerItem[]>(() => {
      if (!hasMultipleLoggedInServers) {
        return [];
      }

      return loggedInServers;
    }, [
      hasMultipleLoggedInServers,
      loggedInServers,
    ]);

  const allSelected =
    serversToRender.length > 0 &&
    serversToRender.every((server) =>
      selectedServerIds.includes(server.id),
    );

  const someSelected =
    selectedServerIds.length > 0 && !allSelected;

  function handleClose(): void {
    if (loading) return;

    setLogoutFlowActive(false);
    dispatch(setIsLogoutDialogOpen(false));
    onClose();
  }

  function toggleSelectAll(): void {
    if (loading) return;

    setLogoutFlowActive(true);

    if (allSelected) {
      setSelectedServerIds([]);
      return;
    }

    setSelectedServerIds(
      serversToRender.map((server) => server.id),
    );
  }

  function toggleServer(serverId: string): void {
    if (loading) return;

    setLogoutFlowActive(true);

    setSelectedServerIds((previousIds) =>
      previousIds.includes(serverId)
        ? previousIds.filter((id) => id !== serverId)
        : [...previousIds, serverId],
    );
  }

  async function handleLogout(): Promise<void> {
    if (loading) return;

    setLogoutFlowActive(true);
    dispatch(setIsLogoutDialogOpen(true));
    setLoading(true);

    try {
      if (!hasMultipleLoggedInServers) {
        const currentServer =
          loggedInServers.find(
            (server) => server.isCurrent,
          ) ??
          servers.find(
            (server) =>
              normalizeBaseUrl(server.baseUrl) ===
              currentNormalizedIp,
          );

        await dispatch(logoutAsync()).unwrap();

        markServerLoggedOut(
          currentServer?.id ?? "local",
        );

        handleClose();
        return;
      }

      const {
        selectedCurrentServer,
        loggedOutOtherServers,
      } = await logoutSelectedServers({
        loggedInServers,
        selectedServerIds,
      });

      if (
        !selectedCurrentServer &&
        loggedOutOtherServers.length === 0
      ) {
        return;
      }

      for (const server of loggedOutOtherServers) {
        markServerLoggedOut(server.id);
      }

      if (selectedCurrentServer) {
        await dispatch(logoutAsync()).unwrap();

        markServerLoggedOut(
          selectedCurrentServer.id,
        );
      } else {
        dispatch(setIsLogoutDialogOpen(false));
      }

      handleClose();
    } catch (error) {
      console.error("[LOGOUT] Logout failed", error);
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = hasMultipleLoggedInServers
    ? serversLoaded &&
      !loading &&
      selectedServerIds.length > 0
    : serversLoaded && !loading;

  const logoutLabel = loading
    ? t("Abmelden...")
    : t("Abmelden");

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      <Pressable
        nativeID="no-session-extend-logout-backdrop"
        style={styles.backdrop}
        onPress={handleClose}
      >
        <Pressable
          nativeID="no-session-extend-logout-dialog"
          style={styles.card}
          onPress={() => {}}
        >
          <ThemedText style={styles.title}>
            {t("Abmelden")}
          </ThemedText>

          <ThemedText style={styles.body}>
            {hasMultipleLoggedInServers
              ? t(
                  "Wählen Sie aus, von welchen Servern Sie sich abmelden möchten.",
                )
              : t(
                  "Möchten Sie sich vom aktuellen Server abmelden?",
                )}
          </ThemedText>

          {hasMultipleLoggedInServers ? (
            <View style={styles.section}>
              <Card
                style={styles.listCard}
                padding="sm"
              >
                <Pressable
                  nativeID="no-session-extend-logout-select-all"
                  style={styles.selectAllRow}
                  onPress={toggleSelectAll}
                >
                  <View
                    style={[
                      styles.checkbox,
                      (allSelected || someSelected) &&
                        styles.checkboxChecked,
                    ]}
                  >
                    {allSelected ? (
                      <ThemedText
                        style={styles.checkmark}
                      >
                        ✓
                      </ThemedText>
                    ) : someSelected ? (
                      <View style={styles.partialMark} />
                    ) : null}
                  </View>

                  <ThemedText
                    style={styles.selectAllText}
                  >
                    {t("Alle auswählen")}
                  </ThemedText>
                </Pressable>

                <View style={styles.divider} />

                <FlatList
                  data={serversToRender}
                  keyExtractor={(item) => item.id}
                  style={styles.scroll}
                  contentContainerStyle={
                    styles.scrollContent
                  }
                  showsVerticalScrollIndicator
                  nestedScrollEnabled
                  renderItem={({ item: server }) => {
                    const checked =
                      selectedServerIds.includes(
                        server.id,
                      );

                    return (
                      <Pressable
                        nativeID={`no-session-extend-logout-server-${server.id}`}
                        style={styles.row}
                        onPress={() =>
                          toggleServer(server.id)
                        }
                      >
                        <View
                          style={[
                            styles.checkbox,
                            checked &&
                              styles.checkboxChecked,
                          ]}
                        >
                          {checked ? (
                            <ThemedText
                              style={styles.checkmark}
                            >
                              ✓
                            </ThemedText>
                          ) : null}
                        </View>

                        <View
                          style={
                            styles.serverTextWrap
                          }
                        >
                          <ThemedText
                            style={styles.serverName}
                          >
                            {server.name}
                          </ThemedText>

                          <ThemedText
                            style={styles.serverUrl}
                          >
                            ({server.baseUrl})
                          </ThemedText>

                          <ThemedText
                            style={styles.serverAuth}
                          >
                            {server.authenticationMethod ===
                            "oidc"
                              ? "OIDC"
                              : "JWT"}
                          </ThemedText>
                        </View>
                      </Pressable>
                    );
                  }}
                />
              </Card>
            </View>
          ) : null}

          <View
            nativeID="no-session-extend-logout-actions"
            style={styles.actions}
          >
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