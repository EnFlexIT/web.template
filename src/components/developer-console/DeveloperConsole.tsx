import React, {
  useEffect,
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
  closeDeveloperConsole,
  dockDeveloperConsole,
  persistDeveloperConsoleState,
  selectDeveloperConsole,
  toggleDeveloperConsole,
} from "../../redux/slices/developerConsoleSlice";

type DeveloperConsoleProps = {
  children: React.ReactNode;
  enabled?: boolean;
};

const DESKTOP_MIN_WIDTH = 1024;
const BOTTOM_PANEL_HEIGHT = 260;
const RIGHT_PANEL_WIDTH = 460;
const CONSOLE_HEADER_HEIGHT = 38;

/**
 * Verwaltet die WebSocket-Verbindung unabhängig
 * von der sichtbaren Console-Darstellung.
 *
 * Diese Komponente wird genau einmal in index.tsx
 * innerhalb des Redux-Providers eingebunden.
 */
export function DeveloperConsoleConnection() {
  const dispatch = useAppDispatch();

  const { width } =
    useWindowDimensions();

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

    void dispatch(
      connectLiveConsole(),
    );

    return () => {
      dispatch(
        disconnectLiveConsole(),
      );
    };
  }, [
    dispatch,
    isDesktop,
    isLoggedIn,
    serverBaseUrl,
  ]);

  return null;
}

export function DeveloperConsole({
  children,
  enabled = true,
}: DeveloperConsoleProps) {
  const { t } =
    useTranslation(["liveConsole"]);

  const dispatch =
    useAppDispatch();

  const { width } =
    useWindowDimensions();

  const {
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

  const isBusy =
    liveConsole.status ===
      "requesting-ticket" ||
    liveConsole.status ===
      "connecting" ||
    liveConsole.status ===
      "closing";

  /**
   * Speichert geöffnet/geschlossen und
   * die letzte Docking-Position.
   */
  useEffect(() => {
    persistDeveloperConsoleState({
      isOpen,
      placement,
    });
  }, [
    isOpen,
    placement,
  ]);

  /**
   * Windows / Linux:
   * Ctrl + Shift + L
   *
   * macOS:
   * Cmd + Shift + L
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

  function renderConsoleHeader() {
    return (
      <View style={s.consoleHeader}>
        <View style={s.headerTitleArea}>
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

          <View style={s.lineCountBadge}>
            <ThemedText
              style={s.lineCountText}
            >
              {liveConsole.lines.length}
            </ThemedText>
          </View>
        </View>

        <View style={s.headerActions}>
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
              s.headerButton,

              placement === "bottom" &&
                s.headerButtonActive,

              pressed &&
                s.buttonPressed,
            ]}
          >
            <ThemedText
              style={s.headerButtonText}
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
              s.headerButton,

              placement === "right" &&
                s.headerButtonActive,

              pressed &&
                s.buttonPressed,
            ]}
          >
            <ThemedText
              style={s.headerButtonText}
            >
              {t("dockRightShort", {
                defaultValue: "Rechts",
              })}
            </ThemedText>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t(
              "closeDeveloperConsole",
              {
                defaultValue:
                  "Developer Console schließen",
              },
            )}
            onPress={() => {
              dispatch(
                closeDeveloperConsole(),
              );
            }}
            style={({ pressed }) => [
              s.closeButton,
              pressed &&
                s.buttonPressed,
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

  if (
    !isAvailable ||
    !isOpen
  ) {
    return (
      <View style={s.fallbackContainer}>
        {children}
      </View>
    );
  }

  if (placement === "right") {
    return (
      <View style={s.workspaceRight}>
        <View style={s.screenArea}>
          {children}
        </View>

        <View style={s.rightDock}>
          {renderConsoleHeader()}

          <View style={s.rightPanel}>
            <LiveConsoleScreen embedded />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <View style={s.workspace}>
        <View style={s.screenArea}>
          {children}
        </View>
      </View>

      <View style={s.bottomDock}>
        {renderConsoleHeader()}

        <View style={s.bottomPanel}>
          <LiveConsoleScreen embedded />
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create((theme) => ({
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

  bottomDock: {
    width: "100%",

    borderTopWidth: 1,
    borderTopColor:
      theme.colors.border,

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

  consoleHeader: {
    width: "100%",
    height: CONSOLE_HEADER_HEIGHT,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    borderBottomWidth: 1,
    borderBottomColor:
      theme.colors.border,

    backgroundColor:
      theme.colors.card,
  },

  headerTitleArea: {
    flex: 1,
    minWidth: 0,
    height: "100%",

    flexDirection: "row",
    alignItems: "center",
    gap: 7,

    paddingHorizontal: 10,
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

  headerActions: {
    height: "100%",

    flexDirection: "row",
    alignItems: "center",
  },

  headerButton: {
    height: "100%",

    justifyContent: "center",

    paddingHorizontal: 12,

    borderLeftWidth: 1,
    borderLeftColor:
      theme.colors.border,

    backgroundColor:
      theme.colors.card,
  },

  headerButtonActive: {
    backgroundColor:
      theme.colors.background,
  },

  headerButtonText: {
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

  buttonPressed: {
    opacity: 0.55,
  },
}));