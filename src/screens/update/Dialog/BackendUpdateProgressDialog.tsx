import React from "react";
import { ActivityIndicator, Modal, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useTranslation } from "react-i18next";
import Feather from "@expo/vector-icons/Feather";

import { ThemedText } from "../../../components/themed/ThemedText";

type BackendUpdatePhase =
  | "installing"
  | "success"
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
      icon: "upload-cloud" as const,
      title: t(
        "backend.updateDialog.installing",
        "Konfiguration wird hochgeladen",
      ),
    },
    success: {
      icon: "check-circle" as const,
      title: t(
        "backend.updateDialog.success",
        "Konfiguration erfolgreich hochgeladen",
      ),
    },
    restarting: {
      icon: "refresh-cw" as const,
      title: t("backend.updateDialog.restarting", "Server wird neu gestartet"),
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
      title: t("backend.updateDialog.logout", "Anmeldung wird zurückgesetzt"),
    },
  };

  const current = phaseConfig[phase];
  const isSuccess = phase === "success";
  const iconColor = isSuccess ? "#22c55e" : "#2f80ed";

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.overlay}>
        <View style={s.dialog}>
          <View style={[s.iconContainer, isSuccess && s.successIconContainer]}>
            <Feather name={current.icon} size={34} color={iconColor} />
          </View>

          <ThemedText style={s.title}>{current.title}</ThemedText>

          <ThemedText style={s.description}>
            {statusText ||
              t(
                "backend.updateDialog.description",
                "Bitte warten. Der Server wird aktualisiert.",
              )}
          </ThemedText>

          {!isSuccess ? <ActivityIndicator size="large" /> : null}
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

  successIconContainer: {
    backgroundColor: "rgba(34,197,94,0.12)",
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