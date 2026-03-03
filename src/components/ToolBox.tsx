// src/components/ToolBox.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AntDesign_ from "@expo/vector-icons/AntDesign";
import Feather_ from "@expo/vector-icons/Feather";
import { Platform, Pressable, View } from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";

import { useUpdateNotifierWeb } from "../hooks/useUpdateNotifierWeb";
import { useAppDispatch } from "../hooks/useAppDispatch";
import { useAppSelector } from "../hooks/useAppSelector";

import { logout, selectJwt } from "../redux/slices/apiSlice";
import { logoutBaseMode, selectBaseMode } from "../redux/slices/baseModeSlice";
import { selectThemeInfo, setTheme } from "../redux/slices/themeSlice";
import { renewJwtIfNeeded } from "../redux/slices/apiRefreshThunks";

import { useJwtSessionTimerWeb } from "../hooks/useJwtSessionTimerWeb";
import { Text } from "./stylistic/Text";

const Feather = withUnistyles(Feather_);
const AntDesign = withUnistyles(AntDesign_);

type ToolBoxProps = {
  isLoggedIn: boolean;
  isBaseMode?: boolean;
};

function formatMMSS(totalSeconds: number) {
  const mm = Math.floor(totalSeconds / 60);
  const ss = totalSeconds % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

function ColorSwitcher() {
  const themeInfo = useAppSelector(selectThemeInfo);
  const dispatch = useAppDispatch();
  const currentTheme = themeInfo.theme;

  return (
    <Feather
      onPress={() =>
        dispatch(
          setTheme({
            adaptive: false,
            theme: currentTheme === "dark" ? "light" : "dark",
          })
        )
      }
      name={currentTheme === "dark" ? "moon" : "sun"}
      size={24}
      style={[styles.color]}
    />
  );
}

type OpenPopup = "session" | "update" | null;

export function ToolBox({ isLoggedIn, isBaseMode }: ToolBoxProps) {
  const dispatch = useAppDispatch();
  const jwt = useAppSelector(selectJwt);
  const { baseModeLoggedIn } = useAppSelector(selectBaseMode);

  const isWeb = Platform.OS === "web";

  const showLogout =
    isLoggedIn || (isBaseMode === true && baseModeLoggedIn === true);

  const update = useUpdateNotifierWeb({ intervalMs: 5 * 60 * 1000 });

  // ✅ nur ein Popup gleichzeitig
  const [openPopup, setOpenPopup] = useState<OpenPopup>(null);

  // Refs für "click outside"
  const sessionWrapRef = useRef<View>(null);
  const updateWrapRef = useRef<View>(null);

  const onAutoLogout = useCallback(() => {
    if (isLoggedIn) {
      dispatch(logout());
      return;
    }
    if (isBaseMode === true && baseModeLoggedIn === true) {
      dispatch(logoutBaseMode());
    }
  }, [dispatch, isLoggedIn, isBaseMode, baseModeLoggedIn]);
const onHeartbeat = useCallback(() => {
  dispatch(
    renewJwtIfNeeded({
      force: true,          
      cooldownMs: 10_000,   
    })
  );
}, [dispatch]);

const { secondsLeft, warning } = useJwtSessionTimerWeb({
  enabled: isWeb && showLogout,
  jwt,
  warnMs: 30_000,
  onLogout: onAutoLogout,
  onHeartbeat, 
});

  useEffect(() => {
    if (!isWeb) return;
    if (update.updateAvailable) setOpenPopup("update");
  }, [update.updateAvailable, isWeb]);

  // Wenn warning aktiv und Session angezeigt werden soll: Session-Popup öffnen (und Update schließen)
  useEffect(() => {
    if (!isWeb || !showLogout) return;
    if (warning) setOpenPopup("session");
    if (!warning && openPopup === "session") setOpenPopup(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warning, isWeb, showLogout]);

  // Click-outside schließt Popups (Web)
  useEffect(() => {
    if (!isWeb) return;

    const handler = (ev: MouseEvent | TouchEvent) => {
      const target = ev.target as Node | null;
      if (!target) return;

      // @ts-expect-error: RN Web host nodes have `contains`
      const inSession = sessionWrapRef.current?.contains?.(target) ?? false;
      // @ts-expect-error: RN Web host nodes have `contains`
      const inUpdate = updateWrapRef.current?.contains?.(target) ?? false;

      if (!inSession && !inUpdate) {
        setOpenPopup(null);
      }
    };

    document.addEventListener("mousedown", handler, true);
    document.addEventListener("touchstart", handler, true);
    return () => {
      document.removeEventListener("mousedown", handler, true);
      document.removeEventListener("touchstart", handler, true);
    };
  }, [isWeb]);

  const stayLoggedIn = useCallback(() => {
    onHeartbeat();
    setOpenPopup(null);
  }, [onHeartbeat]);

  const manualLogout = useCallback(() => {
    setOpenPopup(null);
    onAutoLogout();
  }, [onAutoLogout]);

  const toggleSessionPopup = useCallback(() => {
    setOpenPopup((v) => (v === "session" ? null : "session"));
  }, []);

  const toggleUpdatePopup = useCallback(() => {
    setOpenPopup((v) => (v === "update" ? null : "update"));
  }, []);

  const updateTitle = useMemo(() => {
    return update.updateAvailable ? "Update verfügbar" : "Keine Updates";
  }, [update.updateAvailable]);

  const updateBody = useMemo(() => {
    if (update.updateAvailable) {
      return "Eine neue Version ist verfügbar. Bitte speichere deine Arbeit und lade dann neu.";
    }
    return "Keine Updates verfügbar. Du bist auf dem aktuellen Stand.";
  }, [update.updateAvailable]);

  return (
    <View style={[styles.toolBoxContainer]}>
      <ColorSwitcher />

      {/* SESSION / TIMER */}
      {isWeb && showLogout ? (
        <View style={styles.timerWrap} ref={sessionWrapRef}>
          <Pressable onPress={toggleSessionPopup}>
            <Feather
              name={warning ? "alert-triangle" : "clock"}
              size={22}
              style={[styles.color, warning ? styles.warningIcon : undefined]}
            />
          </Pressable>

          <Text
            style={[
              styles.timerText,
              warning ? styles.warningText : undefined,
            ]}
          >
            {formatMMSS(secondsLeft)}
          </Text>

          {openPopup === "session" ? (
            <View style={styles.popup}>
              <Text style={styles.popupTitle}>Sind Sie noch da?</Text>

              <Text style={styles.popupBody}>
                Sie werden in{" "}
                <Text style={styles.popupCountdown}>
                  {formatMMSS(secondsLeft)}
                </Text>{" "}
                automatisch abgemeldet.
              </Text>

             
            </View>
          ) : null}
        </View>
      ) : null}

     

      {/* LOGOUT ICON */}
      {showLogout ? (
        <AntDesign
          onPress={manualLogout}
          name="logout"
          size={24}
          style={[styles.color]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  toolBoxContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 20,
    alignItems: "center",
  },
  color: {
    color: theme.colors.text,
  },
  timerWrap: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timerText: {
    fontSize: 14,
    opacity: 0.85,
  },
  warningIcon: {
    opacity: 1,
  },
  warningText: {
    opacity: 1,
    fontWeight: "700",
  },
  popup: {
    position: "absolute",
    right: 0,
    top: 32,
    minWidth: 280,
    maxWidth: 340,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    shadowColor: "#000",
    shadowOpacity: 0.12,
   
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    zIndex: 999,
  },
  popupTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 6,
  },
  badgeDot: {
    position: "absolute",
    right: -2,
    top: -2,
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "red",
    borderWidth: 2,
    borderColor: theme.colors.background,
  },
  popupBody: {
    fontSize: 13,
    opacity: 0.85,
    marginBottom: 10,
  },
  popupCountdown: {
    fontWeight: "800",
  },
  popupButtons: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
  },
  btn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
 
    borderWidth: 1,
  },
  btnPrimary: {
    borderColor: theme.colors.highlight,
    backgroundColor: theme.colors.highlight,
  },
  btnPrimaryText: {
    color: "#fff",
    fontWeight: "700",
  },
  btnGhost: {
    borderColor: theme.colors.border,
    backgroundColor: "transparent",
  },
  btnGhostText: {
    color: theme.colors.text,
    fontWeight: "600",
  },
}));