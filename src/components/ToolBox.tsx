// src/components/ToolBox.tsx
import React, { useCallback, useEffect, useState } from "react";
import AntDesign_ from "@expo/vector-icons/AntDesign";
import Feather_ from "@expo/vector-icons/Feather";
import { Platform, Pressable, View } from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";

import { useAppDispatch } from "../hooks/useAppDispatch";
import { useAppSelector } from "../hooks/useAppSelector";

import {
  logout,
  selectJwt,
} from "../redux/slices/apiSlice";

import {
  logoutBaseMode,
  selectBaseMode,
} from "../redux/slices/baseModeSlice";

import { selectThemeInfo, setTheme } from "../redux/slices/themeSlice";
import { refreshJwtIfNeeded } from "../redux/slices/apiRefreshThunks";

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

export function ToolBox({ isLoggedIn, isBaseMode }: ToolBoxProps) {
  const dispatch = useAppDispatch();
  const jwt = useAppSelector(selectJwt);
  const { baseModeLoggedIn } = useAppSelector(selectBaseMode);

  const showLogout =
    isLoggedIn || (isBaseMode === true && baseModeLoggedIn === true);

  const isWeb = Platform.OS === "web";

  const onAutoLogout = useCallback(() => {
    if (isLoggedIn) {
      dispatch(logout());
      return;
    }
    if (isBaseMode === true && baseModeLoggedIn === true) {
      dispatch(logoutBaseMode());
    }
  }, [dispatch, isLoggedIn, isBaseMode, baseModeLoggedIn]);

  // Wird bei User-Aktivität getriggert
const onUserActive = useCallback(() => {
  console.log("ACTIVE ✅");
  dispatch(refreshJwtIfNeeded({ thresholdMs: 2 * 60 * 1000, cooldownMs: 10 * 1000 }));
}, [dispatch]);

  const { secondsLeft, warning } = useJwtSessionTimerWeb({
    enabled: isWeb && showLogout,
    jwt,
    warnMs: 30_000, // 30 Sekunden vorher Warnung
    onLogout: onAutoLogout,
    onUserActive,
  });

  const [popupOpen, setPopupOpen] = useState(false);

  useEffect(() => {
    if (!isWeb || !showLogout) return;

    if (warning) setPopupOpen(true);
    if (!warning) setPopupOpen(false);
  }, [warning, isWeb, showLogout]);

  const stayLoggedIn = useCallback(() => {
    onUserActive(); 
    setPopupOpen(false);
  }, [onUserActive]);

  const manualLogout = useCallback(() => {
    setPopupOpen(false);
    onAutoLogout();
  }, [onAutoLogout]);

  return (
    <View style={[styles.toolBoxContainer]}>
      <ColorSwitcher />

      {isWeb && showLogout ? (
        <View style={styles.timerWrap}>
          <Pressable onPress={() => setPopupOpen((v) => !v)}>
            <Feather
              name={warning ? "alert-triangle" : "clock"}
              size={22}
              style={[styles.color, warning ? styles.warningIcon : undefined]}
            />
          </Pressable>

          <Text style={[styles.timerText, warning ? styles.warningText : undefined]}>
            {formatMMSS(secondsLeft)}
          </Text>

          {popupOpen ? (
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

      {showLogout ? (
        <AntDesign
          onPress={() => {
            if (isLoggedIn) dispatch(logout());
            else dispatch(logoutBaseMode());
          }}
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
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    zIndex: 999,
  },
  popupTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 6,
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
    borderRadius: 10,
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
