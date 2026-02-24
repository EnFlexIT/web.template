// src/components/OfflineOverlay.tsx
import React from "react";
import { ActivityIndicator, Modal, Pressable, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { useAppDispatch } from "../hooks/useAppDispatch";
import { useAppSelector } from "../hooks/useAppSelector";
import {checkAlive,dismissBackOnline,selectConnectivity,} from "../redux/slices/connectivitySlice";
import { useTranslation } from "react-i18next";

import { Infobox } from "../components/ui-elements/Infobox";
import { ActionButton } from "../components/ui-elements/ActionButton";
import { ThemedText } from "../components/themed/ThemedText";

export function OfflineOverlay() {
  const dispatch = useAppDispatch();
  const { theme } = useUnistyles();
  const { t } = useTranslation(["NotAvailable"]);

  const { isOffline, showBackOnline, checking } =
    useAppSelector(selectConnectivity);

  const showOffline = isOffline;
  const showOnline = showBackOnline && !isOffline;

  if (!showOffline && !showOnline) return null;

 

  if (showOffline) {
    return (
      
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
            <ThemedText>
             
              {t("OfflineMessage")}
            </ThemedText>
            <View style={styles.indicatorSlot}>
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
          </Infobox>
        </View>
      </Modal>
      
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
          <ThemedText>
            {t("onlineMessage")}
          </ThemedText>
          <View style={styles.indicatorSlot}>
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
  },
  box: {
    width: 500,
    minHeight: 120,
  },
  indicatorSlot: {
    marginTop: 5,
   
  },
});