// src/components/OfflineOverlay.tsx
import React, { useState } from "react";
import { Modal, Pressable, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { useTranslation } from "react-i18next";

import { useAppDispatch } from "../hooks/useAppDispatch";
import { useAppSelector } from "../hooks/useAppSelector";
import {
  checkAlive,
  dismissBackOnline,
  selectConnectivity,
} from "../redux/slices/connectivitySlice";
import {
  selectSelectedServer,
  selectServers,
} from "../redux/slices/serverSlice";
import { selectIp } from "../redux/slices/apiSlice";

import { Infobox } from "../components/ui-elements/Infobox";
import { ActionButton } from "../components/ui-elements/ActionButton";
import { ThemedText } from "../components/themed/ThemedText";
import { ServerModal } from "../screens/login/ServerModal";

export function OfflineOverlay() {
  const dispatch = useAppDispatch();
  const { theme } = useUnistyles();
  const { t } = useTranslation(["NotAvailable"]);

  const { isOffline, showBackOnline, checking } =
    useAppSelector(selectConnectivity);

  const serversState = useAppSelector(selectServers);
  const selectedServer = useAppSelector(selectSelectedServer);
  const selectedBaseUrl = useAppSelector(selectIp);

  const [serverModalVisible, setServerModalVisible] = useState(false);

  const showOffline = isOffline;
  const showOnline = showBackOnline && !isOffline;

  if (!showOffline && !showOnline) return null;

  if (showOffline) {
    return (
      <>
        <Modal transparent visible animationType="fade">
          <View style={styles.backdrop}>
            <Infobox
              tone="danger"
              title={t("offlineTitle")}
              style={[
                styles.box,
                {
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <ThemedText>{t("OfflineMessage")}</ThemedText>

              <View style={styles.buttonRow}>
                <View style={styles.buttonWrap}>
                  <ActionButton
                    variant="primary"
                    label={checking ? t("checking") : t("refresh")}
                    size="xs"
                    disabled={checking}
                    onPress={async () => {
                      const res = await dispatch(checkAlive()).unwrap();
                      if (res?.isOnline && typeof window !== "undefined") {
                        window.location.reload();
                      }
                    }}
                  />
                </View>

                <View style={styles.buttonWrap}>
                  <ActionButton
                    variant="secondary"
                    label={t("changeServer", "Server ändern")}
                    size="xs"
                    onPress={() => setServerModalVisible(true)}
                  />
                </View>
              </View>
            </Infobox>
          </View>
        </Modal>

        <ServerModal
          visible={serverModalVisible}
          onClose={() => setServerModalVisible(false)}
          servers={serversState?.servers ?? []}
          selectedServerId={selectedServer?.id ?? ""}
          selectedBaseUrl={selectedBaseUrl ?? ""}
        />
      </>
    );
  }

  return (
    <Modal transparent visible animationType="fade">
      <Pressable
        style={styles.backdrop}
        onPress={() => dispatch(dismissBackOnline())}
      >
        <Infobox
          tone="success"
          title={t("onlineTitle")}
          style={[
            styles.box,
            {
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <ThemedText>{t("onlineMessage")}</ThemedText>

          <View style={styles.singleButtonRow}>
            <ActionButton
              variant="primary"
              label="OK"
              size="xs"
              onPress={() => dispatch(dismissBackOnline())}
            />
          </View>
        </Infobox>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.80)",
    paddingHorizontal: 16,
  },

  box: {
    width: 500,
    maxWidth: "100%",
    minHeight: 120,
  },

  buttonRow: {
    marginTop: 8,
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },

  buttonWrap: {
    minWidth: 140,
  },

  singleButtonRow: {
    marginTop: 8,
  },
});