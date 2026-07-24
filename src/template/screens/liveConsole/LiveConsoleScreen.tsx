import React, {
  useMemo,
  useRef,
} from "react";

import {
  Platform,
  ScrollView,
  View,
} from "react-native";

import {
  useTranslation,
} from "react-i18next";

import {
  StyleSheet,
} from "react-native-unistyles";

import {
  Card,
} from "../../components/ui-elements/Card";

import {
  ActionButton,
} from "../../components/ui-elements/ActionButton";

import {
  ThemedText,
} from "../../components/themed/ThemedText";

import {
  useAppDispatch,
} from "../../hooks/useAppDispatch";

import {
  useAppSelector,
} from "../../hooks/useAppSelector";

import {
  useThemedScrollbarWeb,
} from "../../hooks/useThemedScrollbarWeb";

import {
  clearLines,
  connectLiveConsole,
  selectLiveConsole,
  setFollowOutput,
  type LiveConsoleStatus,
} from "../../redux/slices/liveConsoleSlice";

import {
  dockDeveloperConsole,
} from "../../redux/slices/developerConsoleSlice";

type LiveConsoleScreenProps = {
  embedded?: boolean;
};

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

export function LiveConsoleScreen({
  embedded = false,
}: LiveConsoleScreenProps) {
  const { t } =
    useTranslation(["liveConsole"]);

  const dispatch =
    useAppDispatch();

  const liveConsole =
    useAppSelector(
      selectLiveConsole,
    );

  const scrollRef =
    useRef<ScrollView | null>(
      null,
    );

  /*
   * Die CSS-Regel des Hooks wirkt auf alle Scrollflächen
   * innerhalb des Views mit dieser nativeID.
   *
   * Dadurch werden sowohl die normale Live-Konsole als auch
   * die eingebettete Developer Console angepasst.
   */
  const scrollbarNativeId =
    useThemedScrollbarWeb(
      embedded
        ? "developer-console-scrollbar"
        : "live-console-scrollbar",
    );

  const consoleText =
    useMemo(() => {
      return liveConsole.lines
        .map((line) => line.text)
        .join("\n");
    }, [liveConsole.lines]);

  const isBusy =
    liveConsole.status ===
      "requesting-ticket" ||
    liveConsole.status ===
      "connecting" ||
    liveConsole.status ===
      "closing";

  function getEmptyText(): string {
    switch (liveConsole.status) {
      case "requesting-ticket":
        return t("preparing");

      case "connecting":
        return t("connecting");

      case "connected":
        return t(
          "waitingForLogs",
        );

      case "error":
        return t(
          "noLogsBecauseOfError",
        );

      case "closed":
        return t(
          "connectionClosed",
        );

      case "idle":
      case "closing":
      default:
        return t("empty");
    }
  }

  const content = (
    <View
      style={[
        s.content,
        embedded &&
          s.contentEmbedded,
      ]}
    >
      {!embedded ? (
        <View style={s.headerRow}>
          <View style={s.statusBox}>
            <View
              style={[
                s.statusDot,

                liveConsole.status ===
                  "connected" &&
                  s.statusDotConnected,

                liveConsole.status ===
                  "error" &&
                  s.statusDotError,

                isBusy &&
                  s.statusDotBusy,
              ]}
            />

            <ThemedText
              style={s.statusText}
            >
              {t(
                getStatusTranslationKey(
                  liveConsole.status,
                ),
              )}
            </ThemedText>
          </View>
        </View>
      ) : null}

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
            liveConsole.lines
              .length === 0
          }
          onPress={() => {
            dispatch(
              clearLines(),
            );
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

        {!embedded ? (
          <>
            <ActionButton
              label={t(
                "dockBottom",
              )}
              variant="secondary"
              size="sm"
              onPress={() => {
                dispatch(
                  dockDeveloperConsole(
                    "bottom",
                  ),
                );
              }}
            />

            <ActionButton
              label={t(
                "dockRight",
              )}
              variant="secondary"
              size="sm"
              onPress={() => {
                dispatch(
                  dockDeveloperConsole(
                    "right",
                  ),
                );
              }}
            />
          </>
        ) : null}
      </View>

      {liveConsole.error ? (
        <View style={s.errorBox}>
          <ThemedText
            style={s.errorText}
          >
            {liveConsole.error}
          </ThemedText>
        </View>
      ) : null}

      <View
        nativeID={
          scrollbarNativeId
        }
        style={[
          s.consoleFrame,
          embedded &&
            s.consoleFrameEmbedded,
        ]}
      >
        <ScrollView
          ref={scrollRef}
          style={s.consoleScroll}
          contentContainerStyle={[
            s.consoleContent,

            embedded &&
              s.consoleContentEmbedded,
          ]}
          showsVerticalScrollIndicator
          showsHorizontalScrollIndicator
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => {
            if (
              liveConsole.followOutput
            ) {
              scrollRef.current
                ?.scrollToEnd({
                  animated: false,
                });
            }
          }}
        >
          <ThemedText
            selectable
            style={s.consoleText}
          >
            {consoleText ||
              getEmptyText()}
          </ThemedText>
        </ScrollView>
      </View>
    </View>
  );

  return (
    <View
      style={[
        s.container,
        embedded &&
          s.containerEmbedded,
      ]}
    >
      {embedded ? (
        content
      ) : (
        <Card>{content}</Card>
      )}
    </View>
  );
}

const s = StyleSheet.create(
  (theme) => ({
    container: {
      padding: 24,
      width: "100%",
      maxWidth: 1200,
    },

    containerEmbedded: {
      flex: 1,
      width: "100%",
      maxWidth: "100%",
      minHeight: 0,
      padding: 8,
    },

    content: {
      gap: 16,
    },

    contentEmbedded: {
      flex: 1,
      minHeight: 0,
      gap: 8,
    },

    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "flex-end",
      flexWrap: "wrap",
      gap: 16,
    },

    statusBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderWidth: 1,
      borderColor:
        theme.colors.border,
      borderRadius: 999,
    },

    statusDot: {
      width: 9,
      height: 9,
      borderRadius: 999,
      backgroundColor:
        "#7b8794",
    },

    statusDotConnected: {
      backgroundColor:
        "#22c55e",
    },

    statusDotBusy: {
      backgroundColor:
        "#f59e0b",
    },

    statusDotError: {
      backgroundColor:
        "#ef4444",
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
      borderColor:
        theme.colors.border,
      borderRadius: 10,
      overflow: "hidden",
      backgroundColor:
        "#0b0f14",
    },

    consoleFrameEmbedded: {
      flex: 1,
      minWidth: 0,
      minHeight: 0,
      maxHeight: "100%",
      marginHorizontal: 8,
      marginBottom: 8,
      marginTop: 0,
      borderRadius: 6,
      borderColor:
        theme.colors.border,
    },

    consoleScroll: {
      flex: 1,
      minHeight: 0,
    },

    consoleContent: {
      padding: 16,
      minHeight: 458,
    },

    consoleContentEmbedded: {
      minHeight: 0,
      padding: 10,
    },

    consoleText: {
      color: "#d8e2ec",

      fontFamily:
        Platform.select({
          web: [
            "ui-monospace",
            "SFMono-Regular",
            "Menlo",
            "Monaco",
            "Consolas",
            "monospace",
          ].join(", "),

          default:
            "monospace",
        }),

      fontSize: 12,
      lineHeight: 18,
    },
  }),
);