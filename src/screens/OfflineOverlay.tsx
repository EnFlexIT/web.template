// src/components/OfflineOverlay.tsx
import React, { useState } from "react";
import { Modal, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { useTranslation } from "react-i18next";

import { useAppDispatch } from "../hooks/useAppDispatch";
import { useAppSelector } from "../hooks/useAppSelector";

import {
  checkAlive,
  selectConnectivity,
} from "../redux/slices/connectivitySlice";

import {
  selectSelectedServer,
  selectServers,
} from "../redux/slices/serverSlice";

import {
  selectAuthenticationMethod,
  selectIp,
  selectIsLoggedIn,
} from "../redux/slices/apiSlice";

import { Infobox } from "../components/ui-elements/Infobox";
import { ActionButton } from "../components/ui-elements/ActionButton";
import { ThemedText } from "../components/themed/ThemedText";
import { ServerModal } from "../template/screens/login/ServerModal";

export function OfflineOverlay() {
  const dispatch = useAppDispatch();
  const { theme } = useUnistyles();
  const { t } = useTranslation(["NotAvailable"]);
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const authenticationMethod = useAppSelector(selectAuthenticationMethod);
  const { isOffline, checking } = useAppSelector(selectConnectivity);
  const serversState = useAppSelector(selectServers);
  const selectedServer = useAppSelector(selectSelectedServer);
  const selectedBaseUrl = useAppSelector(selectIp);
  const [serverModalVisible, setServerModalVisible] = useState(false);

  /*
   * Wichtig:
   * Auf Login/OIDC-Seiten kein OfflineOverlay anzeigen.
   * _Authenticated=false oder 303 ist nicht offline.
   */
  if (!isLoggedIn) {
    return null;
  }

  if (authenticationMethod === "oidc" && !isOffline) {
    return null;
  }

  if (!isOffline) {
    return null;
  }

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
                  
                    await dispatch(
                      checkAlive({
                        silent: false,
                      }),
                    ).unwrap();
                  }}
                />
              </View>

              <View style={styles.buttonWrap}>
                <ActionButton
                  variant="secondary"
                  label={t("changserver")}
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
});