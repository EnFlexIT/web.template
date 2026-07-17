import React from "react";
import {
  ActivityIndicator,
  Modal,
  View,
} from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useTranslation } from "react-i18next";
import Feather from "@expo/vector-icons/Feather";

import { ThemedText } from "../../../components/themed/ThemedText";
import { ActionButton } from "../../../components/ui-elements/ActionButton";

export type UpdateProgressPhase =
  | "installing"
  | "success"
  | "restarting"
  | "reconnecting"
  | "logout"
  | "error";

type Props = {
  visible: boolean;
  statusText?: string;
  phase?: UpdateProgressPhase;
  onClose?: () => void;
};

export function UpdateProgressDialog({
  visible,
  statusText,
  phase = "installing",
  onClose,
}: Props) {
  const { t } = useTranslation(["Update"]);

  const phaseConfig = {
    installing: {
      icon: "download-cloud" as const,
      title: t(
        "updateDialog.installing",
        "Update wird installiert",
      ),
    },

    success: {
      icon: "check-circle" as const,
      title: t(
        "updateDialog.success",
        "Update erfolgreich installiert",
      ),
    },

    restarting: {
      icon: "refresh-cw" as const,
      title: t(
        "updateDialog.restarting",
        "Anwendung wird neu gestartet",
      ),
    },

    reconnecting: {
      icon: "wifi" as const,
      title: t(
        "updateDialog.reconnecting",
        "Verbindung wird wiederhergestellt",
      ),
    },

    logout: {
      icon: "log-out" as const,
      title: t(
        "updateDialog.logout",
        "Abmeldung wird vorbereitet",
      ),
    },

    error: {
      icon: "alert-circle" as const,
      title: t(
        "updateDialog.error",
        "Update konnte nicht abgeschlossen werden",
      ),
    },
  };

  const current = phaseConfig[phase];

  const isSuccess = phase === "success";
  const isError = phase === "error";

  const iconColor = isSuccess
    ? "#22c55e"
    : isError
      ? "#dc2626"
      : "#2f80ed";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      <View style={s.overlay}>
        <View style={s.dialog}>
          <View
            style={[
              s.iconContainer,
              isSuccess && s.successIconContainer,
              isError && s.errorIconContainer,
            ]}
          >
            <Feather
              name={current.icon}
              size={34}
              color={iconColor}
            />
          </View>

          <ThemedText style={s.title}>
            {current.title}
          </ThemedText>

          <ThemedText style={s.description}>
            {statusText ||
              t(
                "updateDialog.description",
                "Bitte warten. Die Anwendung wird aktualisiert.",
              )}
          </ThemedText>

          {!isSuccess && !isError ? (
            <ActivityIndicator size="large" />
          ) : null}

          {isError && onClose ? (
            <ActionButton
              label={t(
                "updateDialog.close",
                "Schließen",
              )}
              variant="secondary"
              size="sm"
              onPress={onClose}
            />
          ) : null}
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

  errorIconContainer: {
    backgroundColor: "rgba(220,38,38,0.12)",
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },

  description: {
    fontSize: 13,
    lineHeight: 19,
    opacity: 0.75,
    textAlign: "center",
  },
}));