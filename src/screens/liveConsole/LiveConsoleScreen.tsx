import React, {
  useEffect,
  useMemo,
  useRef,
} from "react";

import {
  Platform,
  ScrollView,
  View,
} from "react-native";

import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native-unistyles";

import { Card } from "../../components/ui-elements/Card";
import { ActionButton } from "../../components/ui-elements/ActionButton";
import { ThemedText } from "../../components/themed/ThemedText";
import { H3 } from "../../components/stylistic/H3";

import { useAppDispatch } from "../../hooks/useAppDispatch";
import { useAppSelector } from "../../hooks/useAppSelector";

import { selectIp } from "../../redux/slices/apiSlice";

import {
  clearLines,
  connectLiveConsole,
  disconnectLiveConsole,
  selectLiveConsole,
  setFollowOutput,
  type LiveConsoleStatus,
} from "../../redux/slices/liveConsoleSlice";

function getStatusTranslationKey(
  status: LiveConsoleStatus,
): string {
  switch (status) {
    case "requesting-ticket":
      return "statusPreparing";

    case "connecting":
      return "statusConnecting";

    case "connected":
      return "statusConnected";

    case "closing":
      return "statusClosing";

    case "closed":
      return "statusClosed";

    case "error":
      return "statusError";

    case "idle":
    default:
      return "statusIdle";
  }
}

export function LiveConsoleScreen() {
  const { t } = useTranslation(["LiveConsole"]);

  const dispatch = useAppDispatch();

  const serverBaseUrl =
    useAppSelector(selectIp);

  const liveConsole =
    useAppSelector(selectLiveConsole);

  const scrollRef =
    useRef<ScrollView | null>(null);

  const consoleText = useMemo(() => {
    return liveConsole.lines
      .map((line) => line.text)
      .join("\n");
  }, [liveConsole.lines]);

  const isBusy =
    liveConsole.status === "requesting-ticket" ||
    liveConsole.status === "connecting" ||
    liveConsole.status === "closing";

  /**
   * Vollautomatischer Ablauf:
   *
   * 1. Screen wird geöffnet.
   * 2. Ticket wird im Slice angefordert.
   * 3. WebSocket-Verbindung wird aufgebaut.
   * 4. Logs werden angezeigt.
   *
   * Bei einem Serverwechsel wird automatisch
   * eine neue Verbindung aufgebaut.
   *
   * Beim Verlassen des Screens wird der
   * WebSocket geschlossen.
   */
  useEffect(() => {
    if (!serverBaseUrl) {
      return;
    }

    void dispatch(connectLiveConsole());

    return () => {
      dispatch(disconnectLiveConsole());
    };
  }, [dispatch, serverBaseUrl]);

  function getEmptyText(): string {
    switch (liveConsole.status) {
      case "requesting-ticket":
        return t("preparing");

      case "connecting":
        return t("connecting");

      case "connected":
        return t("waitingForLogs");

      case "error":
        return t("noLogsBecauseOfError");

      case "closed":
        return t("connectionClosed");

      case "idle":
      case "closing":
      default:
        return t("empty");
    }
  }

  return (
    <View style={s.container}>
      <Card>
        <View style={s.content}>
          <View style={s.headerRow}>
            <View style={s.titleBox}>
              

            </View>

            <View style={s.statusBox}>
              <View
                style={[
                  s.statusDot,

                  liveConsole.status === "connected" &&
                    s.statusDotConnected,

                  liveConsole.status === "error" &&
                    s.statusDotError,

                  isBusy &&
                    s.statusDotBusy,
                ]}
              />

              <ThemedText style={s.statusText}>
                {t(
                  getStatusTranslationKey(
                    liveConsole.status,
                  ),
                )}
              </ThemedText>
            </View>
          </View>

          <View style={s.toolbar}>
            <ActionButton
              label={t("reconnect")}
              variant="secondary"
              size="sm"
              disabled={isBusy}
              onPress={() => {
                void dispatch(
                  connectLiveConsole(),
                );
              }}
            />

            <ActionButton
              label={t("clear")}
              variant="secondary"
              size="sm"
              disabled={
                liveConsole.lines.length === 0
              }
              onPress={() => {
                dispatch(clearLines());
              }}
            />

            <ActionButton
              label={
                liveConsole.followOutput
                  ? t("autoScrollOn")
                  : t("autoScrollOff")
              }
              variant="secondary"
              size="sm"
              onPress={() => {
                dispatch(
                  setFollowOutput(
                    !liveConsole.followOutput,
                  ),
                );
              }}
            />
          </View>

          {liveConsole.error ? (
            <View style={s.errorBox}>
              <ThemedText style={s.errorText}>
                {liveConsole.error}
              </ThemedText>
            </View>
          ) : null}

          <View style={s.consoleFrame}>
            <ScrollView
              ref={scrollRef}
              style={s.consoleScroll}
              contentContainerStyle={
                s.consoleContent
              }
              onContentSizeChange={() => {
                if (
                  liveConsole.followOutput
                ) {
                  scrollRef.current?.scrollToEnd({
                    animated: false,
                  });
                }
              }}
            >
              <ThemedText
                selectable
                style={s.consoleText}
              >
                {consoleText || getEmptyText()}
              </ThemedText>
            </ScrollView>
          </View>

          <View style={s.footerRow}>
            <ThemedText style={s.footerText}>
              {t("lineCount", {
                count:
                  liveConsole.lines.length,
              })}
            </ThemedText>

            {liveConsole.closeCode &&
            liveConsole.closeCode !== 1000 ? (
              <ThemedText style={s.footerText}>
                {t("closeCode", {
                  code:
                    liveConsole.closeCode,
                })}
              </ThemedText>
            ) : null}
          </View>
        </View>
      </Card>
    </View>
  );
}

const s = StyleSheet.create((theme) => ({
  container: {
    padding: 24,
    width: "100%",
    maxWidth: 1200,
  },

  content: {
    gap: 16,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 16,
  },

  titleBox: {
    flex: 1,
    minWidth: 280,
    gap: 5,
  },

  description: {
    fontSize: 13,
    opacity: 0.72,
  },

  statusBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 999,
  },

  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 999,
    backgroundColor: "#7b8794",
  },

  statusDotConnected: {
    backgroundColor: "#22c55e",
  },

  statusDotBusy: {
    backgroundColor: "#f59e0b",
  },

  statusDotError: {
    backgroundColor: "#ef4444",
  },

  statusText: {
    fontSize: 13,
    fontWeight: "700",
  },

  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },

  errorBox: {
    borderWidth: 1,
    borderColor:
      "rgba(239,68,68,0.55)",
    backgroundColor:
      "rgba(239,68,68,0.08)",
    borderRadius: 8,
    padding: 12,
  },

  errorText: {
    color: "#ef4444",
    fontSize: 13,
  },

  consoleFrame: {
    minHeight: 460,
    maxHeight: 650,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#0b0f14",
  },

  consoleScroll: {
    flex: 1,
  },

  consoleContent: {
    padding: 16,
    minHeight: 458,
  },

  consoleText: {
    color: "#d8e2ec",

    fontFamily: Platform.select({
      web: [
        "ui-monospace",
        "SFMono-Regular",
        "Menlo",
        "Monaco",
        "Consolas",
        "monospace",
      ].join(", "),
      default: "monospace",
    }),

    fontSize: 12,
    lineHeight: 18,
  },

  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 10,
  },

  footerText: {
    fontSize: 12,
    opacity: 0.65,
  },
}));