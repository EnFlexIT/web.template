import React from "react";
import { ActivityIndicator, Modal, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useTranslation } from "react-i18next";
import Feather from "@expo/vector-icons/Feather";

import { ThemedText } from "../../../components/themed/ThemedText";

type BackendUpdatePhase =
  | "installing"
  | "restarting"
  | "reconnecting"
  | "logout";

type Props = {
  visible: boolean;
  statusText?: string;
  phase?: BackendUpdatePhase;
};

export function BackendUpdateProgressDialog({
  visible,
  statusText,
  phase = "installing",
}: Props) {
  const { t } = useTranslation(["Update"]);

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
            <Feather name={current.icon} size={34} color="#2f80ed" />
          </View>

          <ThemedText style={s.title}>{current.title}</ThemedText>

          <ThemedText style={s.description}>
            {statusText ||
              t(
                "backend.updateDialog.description",
                "Bitte warten. Der Server wird aktualisiert.",
              )}
          </ThemedText>

          <ActivityIndicator size="large" />
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
}));