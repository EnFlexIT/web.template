import React from "react";
import { ActivityIndicator, Modal, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useTranslation } from "react-i18next";
import Feather from "@expo/vector-icons/Feather";

import { ThemedText } from "../../../components/themed/ThemedText";

type Props = {
  visible: boolean;
  progress?: number;
  statusText?: string;
  phase?: "installing" | "restarting" | "reconnecting" | "logout";
};

export function BackendUpdateProgressDialog({
  visible,
  progress = 0,
  statusText,
  phase = "installing",
}: Props) {
  const { t } = useTranslation(["Update"]);

  const safeProgress = Math.max(0, Math.min(100, progress));

  const phaseConfig = {
    installing: {
      icon: "download-cloud" as const,
      title: t(
        "backend.updateDialog.installing",
        "Backend-Update wird installiert",
      ),
    },

    restarting: {
      icon: "refresh-cw" as const,
      title: t(
        "backend.updateDialog.restarting",
        "Server wird neu gestartet",
      ),
    },

    reconnecting: {
      icon: "wifi" as const,
      title: t(
        "backend.updateDialog.reconnecting",
        "Verbindung wird wiederhergestellt",
      ),
    },

    logout: {
      icon: "log-out" as const,
      title: t(
        "backend.updateDialog.logout",
        "Anmeldung wird zurückgesetzt",
      ),
    },
  };

  const current = phaseConfig[phase];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.overlay}>
        <View style={s.dialog}>
          <View style={s.iconContainer}>
            <Feather
              name={current.icon}
              size={34}
              color="#2f80ed"
            />
          </View>

          <ThemedText style={s.title}>
            {current.title}
          </ThemedText>

          <ThemedText style={s.description}>
            {statusText ||
              t(
                "backend.updateDialog.description",
                "Bitte warten. Der Server wird aktualisiert.",
              )}
          </ThemedText>

          <View style={s.progressOuter}>
            <View
              style={[
                s.progressInner,
                { width: `${safeProgress}%` },
              ]}
            />
          </View>

          <View style={s.progressRow}>
            <ActivityIndicator size="small" />

            <ThemedText style={s.progressText}>
              {safeProgress}%
            </ThemedText>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create((theme) => ({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  dialog: {
    width: "100%",
    maxWidth: 460,
    borderRadius: 12,
    padding: 24,
    gap: 16,
    alignItems: "center",
    backgroundColor: theme.colors.background,
  },

  iconContainer: {
    padding: 12,
    borderRadius: 999,
    backgroundColor: "rgba(47,128,237,0.08)",
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },

  description: {
    fontSize: 13,
    opacity: 0.75,
    textAlign: "center",
  },

  progressOuter: {
    width: "100%",
    height: 10,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.12)",
    overflow: "hidden",
  },

  progressInner: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#2f80ed",
  },

  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  progressText: {
    fontSize: 13,
    fontWeight: "700",
  },
}));