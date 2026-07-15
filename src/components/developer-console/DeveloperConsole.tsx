import React, {
  useEffect,
  useState,
} from "react";

import {
  Platform,
  Pressable,
  useWindowDimensions,
  View,
} from "react-native";

import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native-unistyles";

import { ThemedText } from "../themed/ThemedText";
import { ConfirmDialog } from "../ui-elements/ConfirmDialog";

import { isMobileShellRuntime } from "../../util/runtime";

import { useAppDispatch } from "../../hooks/useAppDispatch";
import { useAppSelector } from "../../hooks/useAppSelector";

import { LiveConsoleScreen } from "../../screens/liveConsole/LiveConsoleScreen";

import {
  selectIp,
  selectIsLoggedIn,
} from "../../redux/slices/apiSlice";

import {
  connectLiveConsole,
  disconnectLiveConsole,
  selectLiveConsole,
} from "../../redux/slices/liveConsoleSlice";

import {
  dockDeveloperConsole,
  hideDeveloperConsole,
  selectDeveloperConsole,
  toggleDeveloperConsole,
} from "../../redux/slices/developerConsoleSlice";

type DeveloperConsoleProps = {
  children: React.ReactNode;
  enabled?: boolean;
};

type ConsoleBarPlacement =
  | "bottom"
  | "right";

const DESKTOP_MIN_WIDTH = 1024;
const BOTTOM_PANEL_HEIGHT = 260;
const RIGHT_PANEL_WIDTH = 460;
const CONSOLE_BAR_HEIGHT = 38;

/**
 * Verwaltet die WebSocket-Verbindung global.
 *
 * Diese Komponente wird nur einmal in index.tsx
 * innerhalb des Redux-Providers eingebunden.
 *
 * Dadurch bleibt die Verbindung auch bei einem
 * Screenwechsel bestehen.
 */
export function DeveloperConsoleConnection() {
  const dispatch = useAppDispatch();

  const { width } = useWindowDimensions();

  const serverBaseUrl =
    useAppSelector(selectIp);

  const isLoggedIn =
    useAppSelector(selectIsLoggedIn);

  const isDesktop =
    Platform.OS === "web" &&
    width >= DESKTOP_MIN_WIDTH &&
    !isMobileShellRuntime();

  useEffect(() => {
    if (
      !isDesktop ||
      !isLoggedIn ||
      !serverBaseUrl
    ) {
      return;
    }

    void dispatch(connectLiveConsole());

    return () => {
      dispatch(disconnectLiveConsole());
    };
  }, [
    dispatch,
    isDesktop,
    isLoggedIn,
    serverBaseUrl,
  ]);

  return null;
}

/**
 * Globale Darstellung der Developer Console.
 *
 * Die Komponente steuert:
 *
 * - geöffnet / minimiert
 * - unten / rechts angedockt
 * - vollständiges Ausblenden
 * - Shortcut
 * - Bestätigungsdialog
 *
 * Die WebSocket-Verbindung wird nicht hier,
 * sondern in DeveloperConsoleConnection verwaltet.
 */
export function DeveloperConsole({
  children,
  enabled = true,
}: DeveloperConsoleProps) {
  const { t } =
    useTranslation(["liveConsole"]);

  const dispatch = useAppDispatch();

  const { width } =
    useWindowDimensions();

  const [
    closeDialogVisible,
    setCloseDialogVisible,
  ] = useState(false);

  const {
    isVisible,
    isOpen,
    placement,
  } = useAppSelector(
    selectDeveloperConsole,
  );

  const liveConsole =
    useAppSelector(selectLiveConsole);

  const isDesktop =
    Platform.OS === "web" &&
    width >= DESKTOP_MIN_WIDTH &&
    !isMobileShellRuntime();

  const isAvailable =
    enabled && isDesktop;

  const isBottomOpen =
    isVisible &&
    isOpen &&
    placement === "bottom";

  const isRightOpen =
    isVisible &&
    isOpen &&
    placement === "right";

  const isBusy =
    liveConsole.status ===
      "requesting-ticket" ||
    liveConsole.status ===
      "connecting" ||
    liveConsole.status ===
      "closing";

  /**
   * Windows / Linux:
   * Ctrl + Shift + L
   *
   * macOS:
   * Cmd + Shift + L
   *
   * Der Shortcut kann eine vollständig
   * ausgeblendete Konsole wieder anzeigen.
   */
  useEffect(() => {
    if (
      !isAvailable ||
      typeof window === "undefined"
    ) {
      return;
    }

    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      const modifierPressed =
        event.ctrlKey ||
        event.metaKey;

      const isShortcut =
        modifierPressed &&
        event.shiftKey &&
        event.key.toLowerCase() === "l";

      if (!isShortcut) {
        return;
      }

      event.preventDefault();

      dispatch(
        toggleDeveloperConsole(),
      );
    };

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [
    dispatch,
    isAvailable,
  ]);

  function renderConsoleBar(
    barPlacement: ConsoleBarPlacement,
  ) {
    return (
      <View
        style={[
          s.consoleBar,

          barPlacement === "bottom"
            ? s.consoleBarBottom
            : s.consoleBarRight,
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            isOpen
              ? t(
                  "minimizeDeveloperConsole",
                  {
                    defaultValue:
                      "Developer Console minimieren",
                  },
                )
              : t(
                  "openDeveloperConsole",
                  {
                    defaultValue:
                      "Developer Console öffnen",
                  },
                )
          }
          onPress={() => {
            dispatch(
              toggleDeveloperConsole(),
            );
          }}
          style={({ pressed }) => [
            s.titleButton,
            pressed && s.pressed,
          ]}
        >
          <View style={s.consoleIcon}>
            <ThemedText
              style={s.consoleIconText}
            >
              {">_"}
            </ThemedText>
          </View>

          <ThemedText
            style={s.title}
            numberOfLines={1}
          >
            {t("developerConsole", {
              defaultValue:
                "Developer Console",
            })}
          </ThemedText>

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

          <View
            style={s.lineCountBadge}
          >
            <ThemedText
              style={s.lineCountText}
            >
              {liveConsole.lines.length}
            </ThemedText>
          </View>

          <ThemedText
            style={s.openIndicator}
          >
            {isOpen ? "▼" : "▲"}
          </ThemedText>
        </Pressable>

        <View style={s.barActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t(
              "dockBottom",
              {
                defaultValue:
                  "Unten andocken",
              },
            )}
            onPress={() => {
              dispatch(
                dockDeveloperConsole(
                  "bottom",
                ),
              );
            }}
            style={({ pressed }) => [
              s.dockButton,

              placement === "bottom" &&
                s.dockButtonActive,

              pressed && s.pressed,
            ]}
          >
            <ThemedText
              style={s.dockButtonText}
            >
              {t("dockBottomShort", {
                defaultValue: "Unten",
              })}
            </ThemedText>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t(
              "dockRight",
              {
                defaultValue:
                  "Rechts andocken",
              },
            )}
            onPress={() => {
              dispatch(
                dockDeveloperConsole(
                  "right",
                ),
              );
            }}
            style={({ pressed }) => [
              s.dockButton,

              placement === "right" &&
                s.dockButtonActive,

              pressed && s.pressed,
            ]}
          >
            <ThemedText
              style={s.dockButtonText}
            >
              {t("dockRightShort", {
                defaultValue: "Rechts",
              })}
            </ThemedText>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t(
              "hideDeveloperConsole",
              {
                defaultValue:
                  "Developer Console ausblenden",
              },
            )}
            onPress={() => {
              setCloseDialogVisible(true);
            }}
            style={({ pressed }) => [
              s.closeButton,
              pressed && s.pressed,
            ]}
          >
            <ThemedText
              style={s.closeButtonText}
            >
              ×
            </ThemedText>
          </Pressable>
        </View>
      </View>
    );
  }

  /**
   * Auf Mobile, Tablet oder im Login
   * bleibt das normale Layout unverändert.
   */
  if (!isAvailable) {
    return (
      <View
        style={s.fallbackContainer}
      >
        {children}
      </View>
    );
  }

  /**
   * Die Developer Console wurde über X
   * vollständig ausgeblendet.
   *
   * Wiederherstellung:
   *
   * - Ctrl/Cmd + Shift + L
   * - Unten andocken im LiveConsoleScreen
   * - Rechts andocken im LiveConsoleScreen
   */
  if (!isVisible) {
    return (
      <View
        style={s.fallbackContainer}
      >
        {children}
      </View>
    );
  }

  return (
    <View style={s.root}>
      {isRightOpen ? (
        <View style={s.workspaceRight}>
          <View style={s.screenArea}>
            {children}
          </View>

          <View style={s.rightDock}>
            {renderConsoleBar("right")}

            <View style={s.rightPanel}>
              <LiveConsoleScreen
                embedded
              />
            </View>
          </View>
        </View>
      ) : (
        <>
          <View style={s.workspace}>
            <View style={s.screenArea}>
              {children}
            </View>
          </View>

          {renderConsoleBar("bottom")}

          {isBottomOpen ? (
            <View style={s.bottomPanel}>
              <LiveConsoleScreen
                embedded
              />
            </View>
          ) : null}
        </>
      )}

    <ConfirmDialog
  visible={closeDialogVisible}
  title={t("hideConsoleTitle")}
  description={t("hideConsoleDescription")}
  icon="x-circle"
  variant="warning"
  confirmLabel={t("hideConsoleConfirm")}
  cancelLabel={t("cancel")}
  onConfirm={() => {
    setCloseDialogVisible(false);
    dispatch(hideDeveloperConsole());
  }}
  onCancel={() => {
    setCloseDialogVisible(false);
  }}
  onClose={() => {
    setCloseDialogVisible(false);
  }}
/>
    </View>
  );
}

const s = StyleSheet.create(
  (theme) => ({
    root: {
      flex: 1,
      width: "100%",
      minHeight: 0,
      overflow: "hidden",

      backgroundColor:
        theme.colors.background,
    },

    fallbackContainer: {
      flex: 1,
      width: "100%",
      minHeight: 0,
    },

    workspace: {
      flex: 1,
      width: "100%",
      minHeight: 0,
      overflow: "hidden",
    },

    workspaceRight: {
      flex: 1,
      width: "100%",
      minWidth: 0,
      minHeight: 0,

      flexDirection: "row",
      overflow: "hidden",
    },

    screenArea: {
      flex: 1,
      minWidth: 0,
      minHeight: 0,
      overflow: "hidden",
    },

    rightDock: {
      width: RIGHT_PANEL_WIDTH,
      minWidth: 380,
      maxWidth: 560,
      minHeight: 0,

      borderLeftWidth: 1,
      borderLeftColor:
        theme.colors.border,

      backgroundColor:
        theme.colors.background,
    },

    rightPanel: {
      flex: 1,
      minWidth: 0,
      minHeight: 0,

      backgroundColor:
        theme.colors.background,
    },

    bottomPanel: {
      width: "100%",
      height: BOTTOM_PANEL_HEIGHT,
      minHeight: 0,

      backgroundColor:
        theme.colors.background,
    },

    consoleBar: {
      width: "100%",
      height: CONSOLE_BAR_HEIGHT,

      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",

      backgroundColor:
        theme.colors.card,
    },

    consoleBarBottom: {
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor:
        theme.colors.border,
    },

    consoleBarRight: {
      borderBottomWidth: 1,
      borderBottomColor:
        theme.colors.border,
    },

    titleButton: {
      flex: 1,
      minWidth: 0,
      height: "100%",

      flexDirection: "row",
      alignItems: "center",
      gap: 7,

      paddingHorizontal: 12,
    },

    consoleIcon: {
      width: 22,
      height: 22,

      justifyContent: "center",
      alignItems: "center",

      borderWidth: 1,
      borderColor:
        theme.colors.border,
      borderRadius: 4,

      backgroundColor:
        theme.colors.background,
    },

    consoleIconText: {
      fontSize: 10,
      fontWeight: "700",
    },

    title: {
      flexShrink: 1,
      fontSize: 12,
      fontWeight: "700",
    },

    statusDot: {
      width: 7,
      height: 7,
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

    lineCountBadge: {
      minWidth: 22,
      height: 18,

      justifyContent: "center",
      alignItems: "center",

      paddingHorizontal: 5,

      borderRadius: 9,
      borderWidth: 1,
      borderColor:
        theme.colors.border,

      backgroundColor:
        theme.colors.background,
    },

    lineCountText: {
      fontSize: 10,
      lineHeight: 12,
    },

    openIndicator: {
      fontSize: 9,
      opacity: 0.6,
    },

    barActions: {
      height: "100%",

      flexDirection: "row",
      alignItems: "center",
    },

    dockButton: {
      height: "100%",

      justifyContent: "center",

      paddingHorizontal: 12,

      borderLeftWidth: 1,
      borderLeftColor:
        theme.colors.border,

      backgroundColor:
        theme.colors.card,
    },

    dockButtonActive: {
      backgroundColor:
        theme.colors.background,
    },

    dockButtonText: {
      fontSize: 11,
    },

    closeButton: {
      width: 38,
      height: "100%",

      justifyContent: "center",
      alignItems: "center",

      borderLeftWidth: 1,
      borderLeftColor:
        theme.colors.border,

      backgroundColor:
        theme.colors.card,
    },

    closeButtonText: {
      fontSize: 20,
      lineHeight: 21,
    },

    pressed: {
      opacity: 0.55,
    },
  }),
);