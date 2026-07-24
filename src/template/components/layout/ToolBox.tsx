// src/components/ToolBox.tsx

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import AntDesign_ from "@expo/vector-icons/AntDesign";
import Feather_ from "@expo/vector-icons/Feather";
import { Platform, Pressable, View } from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";

import { useAppDispatch } from "../../../hooks/useAppDispatch";
import { useAppSelector } from "../../../hooks/useAppSelector";

import {
  logoutAsync,
  selectAuthenticationMethod,
  selectJwt,
} from "../../../redux/slices/apiSlice";

import { logoutBaseMode, selectBaseMode } from "../../../redux/slices/baseModeSlice";
import { selectThemeInfo, setTheme } from "../../../redux/slices/themeSlice";

import { useJwtSessionTimerWeb } from "../../../core/authentication/session/useJwtSessionTimerWeb";
import { useOidcSessionTimerWeb} from "../../../core/authentication/session/useOidcSessionTimerWeb";
import { ConfirmModal } from "../../../components/ui-elements/ConfirmModal";
import {
  extendSessionTime,
  selectSessionTime,
} from "../../../redux/slices/sessionTimeSlice";
import { LogoutDialog } from "../../screens/Logout/LogoutDialog";
import { Text } from "../../../components/stylistic/Text";
import { ActionButton } from "../../../components/ui-elements/ActionButton";

type LogoutDialogProps = {
  visible: boolean;
  onClose: () => void;
};



const Feather = withUnistyles(Feather_);
const AntDesign = withUnistyles(AntDesign_);

type ToolBoxProps = {
  isLoggedIn: boolean;
  isBaseMode?: boolean;
};

type OpenPopup = "session" | "update" | null;

function formatMMSS(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const mm = Math.floor(safeSeconds / 60);
  const ss = safeSeconds % 60;

  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

function formatMsToMMSS(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "--:--";
  }

  return formatMMSS(Math.ceil(Math.max(0, value) / 1000));
}

function getRemainingMs(params: {
  expirationTime?: number | null;
  remainingTime?: number | null;
  lastCheckedAt?: number | null;
  now: number;
}) {
  if (
    typeof params.expirationTime === "number" &&
    Number.isFinite(params.expirationTime)
  ) {
    return Math.max(0, params.expirationTime - params.now);
  }

  if (
    typeof params.remainingTime === "number" &&
    Number.isFinite(params.remainingTime) &&
    typeof params.lastCheckedAt === "number" &&
    Number.isFinite(params.lastCheckedAt)
  ) {
    return Math.max(
      0,
      params.remainingTime - (params.now - params.lastCheckedAt),
    );
  }

  if (
    typeof params.remainingTime === "number" &&
    Number.isFinite(params.remainingTime)
  ) {
    return Math.max(0, params.remainingTime);
  }

  return null;
}

function ColorSwitcher() {
  const themeInfo = useAppSelector(selectThemeInfo);
  const dispatch = useAppDispatch();
  const currentTheme = themeInfo.theme;

  return (
    <Pressable
      onPress={() =>
        dispatch(
          setTheme({
            adaptive: false,
            theme: currentTheme === "dark" ? "light" : "dark",
          }),
        )
      }
      accessibilityRole="button"
      nativeID="session-activity-theme-toggle"
    >
      <Feather
        name={currentTheme === "dark" ? "moon" : "sun"}
        size={24}
        style={[styles.color]}
      />
    </Pressable>
  );
}

export function ToolBox({ isLoggedIn, isBaseMode }: ToolBoxProps) {
  const dispatch = useAppDispatch();

  const isdev = false; // __DEV__ || process.env.NODE_ENV === "development";

  const jwt = useAppSelector(selectJwt);
  const authenticationMethod = useAppSelector(selectAuthenticationMethod);
  const sessionTime = useAppSelector(selectSessionTime);
  const { baseModeLoggedIn } = useAppSelector(selectBaseMode);
  const updateState = useAppSelector((state) => state.update);

  const isWeb = Platform.OS === "web";

  /*
   * Wichtig:
   * OIDC nur dann, wenn authenticationMethod wirklich "oidc" ist.
   * "unknown" darf hier nicht automatisch wie OIDC behandelt werden,
   * sonst arbeitet JWT/Base wie OIDC.
   */
  const isOidc = isLoggedIn && authenticationMethod === "oidc";

  /*
   * JWT:
   * Wenn ein JWT vorhanden ist und es nicht OIDC ist,
   * arbeitet der Timer über JWT-exp.
   */
  const isJwt = Boolean(jwt) && !isOidc;

  const hasSessionTimer = isOidc || isJwt;

  const showLogout =
    isLoggedIn || (isBaseMode === true && baseModeLoggedIn === true);

  const [openPopup, setOpenPopup] = useState<OpenPopup>(null);
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);
  const [now, setNow] = useState(Date.now());

  const sessionWrapRef = useRef<View>(null);
  const updateWrapRef = useRef<View>(null);
  const suppressSessionPopupUntilRef = useRef<number>(0);

  /*
   * Dieser 1-Sekunden-Tick ist nur für OIDC nötig,
   * weil S/T aus Redux + lastCheckedAt live runtergerechnet werden.
   * JWT bringt secondsLeft schon direkt aus useJwtSessionTimerWeb.
   */
  useEffect(() => {
    if (!isWeb || !showLogout || !isOidc) return;

    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isWeb, showLogout, isOidc]);

  const onAutoLogout = useCallback(() => {
    if (isLoggedIn) {
      dispatch(logoutAsync());
      return;
    }

    if (isBaseMode === true && baseModeLoggedIn === true) {
      dispatch(logoutBaseMode());
    }
  }, [dispatch, isLoggedIn, isBaseMode, baseModeLoggedIn]);

  const jwtTimer = useJwtSessionTimerWeb({
    enabled: isWeb && showLogout && isJwt,
    jwt,
    warnMs: 30_000,
    onLogout: onAutoLogout,
    onHeartbeat: undefined,
  });

  const oidcTimer = useOidcSessionTimerWeb({
    enabled: isWeb && showLogout && isOidc,
    warnMs: 30_000,
    onLogout: onAutoLogout,
  });

  const sessionRemainingMs = useMemo(() => {
    return getRemainingMs({
      expirationTime: sessionTime.expirationTime,
      remainingTime: sessionTime.remainingTime,
      lastCheckedAt: sessionTime.lastCheckedAt,
      now,
    });
  }, [
    sessionTime.expirationTime,
    sessionTime.remainingTime,
    sessionTime.lastCheckedAt,
    now,
  ]);

  const tokenRemainingMs = useMemo(() => {
    return getRemainingMs({
      expirationTime: sessionTime.tokenExpirationTime,
      remainingTime: sessionTime.remainingTokenTime,
      lastCheckedAt: sessionTime.lastCheckedAt,
      now,
    });
  }, [
    sessionTime.tokenExpirationTime,
    sessionTime.remainingTokenTime,
    sessionTime.lastCheckedAt,
    now,
  ]);

  const secondsLeft = isOidc ? oidcTimer.secondsLeft : jwtTimer.secondsLeft;
  const warning = isOidc ? oidcTimer.warning : jwtTimer.warning;

  const effectiveTimeText = formatMMSS(secondsLeft);
  const sessionTimeText = formatMsToMMSS(sessionRemainingMs);
  const tokenTimeText = formatMsToMMSS(tokenRemainingMs);

  /*
   * Hauptanzeige:
   * OIDC zeigt die Backend-Session-Zeit.
   * JWT zeigt die JWT-Restzeit.
   */
  const mainTimerText = isOidc ? sessionTimeText : effectiveTimeText;

  /*
   * Debug:
   * OIDC zeigt S/T.
   * JWT zeigt nur JWT.
   */
  const debugTimerText = isOidc
    ? `S: ${sessionTimeText} | T: ${tokenTimeText}`
    : `JWT: ${effectiveTimeText}`;

  useEffect(() => {
    if (!isWeb) return;

    if (updateState.frontend.isAvailable) {
      setOpenPopup("update");
    }
  }, [updateState.frontend.isAvailable, isWeb]);

  useEffect(() => {
    if (!isWeb || !showLogout || !hasSessionTimer) return;

    const nowValue = Date.now();
    const suppressed = nowValue < suppressSessionPopupUntilRef.current;

    if (warning && !suppressed) {
      setOpenPopup("session");
    }

    if (!warning && openPopup === "session") {
      setOpenPopup(null);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warning, isWeb, showLogout, hasSessionTimer]);

  useEffect(() => {
    if (!isWeb) return;

    const handler = (ev: MouseEvent | TouchEvent) => {
      const target = ev.target as Node | null;
      if (!target) return;

      // @ts-expect-error react-native-web ref supports contains on web
      const inSession = sessionWrapRef.current?.contains?.(target) ?? false;

      // @ts-expect-error react-native-web ref supports contains on web
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

  const stayLoggedIn = useCallback(async () => {
    suppressSessionPopupUntilRef.current = Date.now() + 10_000;
    setOpenPopup(null);

    try {
      if (isOidc) {
        await dispatch(extendSessionTime()).unwrap();
        return;
      }

      if (isJwt) {
        await jwtTimer.renewNow(true);
      }
    } catch (error) {
      console.log("[SESSION] stayLoggedIn failed:", error);
    }
  }, [dispatch, isOidc, isJwt, jwtTimer]);

  const manualLogout = useCallback(() => {
    setOpenPopup(null);
    setLogoutDialogVisible(true);
  }, []);

  const toggleSessionPopup = useCallback(() => {
    setOpenPopup((value) => (value === "session" ? null : "session"));
  }, []);

  return (
    <>
      <View style={[styles.toolBoxContainer]}>
        <ColorSwitcher />

        {isWeb && showLogout && hasSessionTimer ? (
          <View style={styles.timerWrap} ref={sessionWrapRef}>
            <Pressable
              onPress={toggleSessionPopup}
              accessibilityRole="button"
              nativeID="session-activity-session-toggle"
            >
              <Feather
                name={warning ? "alert-triangle" : "clock"}
                size={22}
                style={[styles.color, warning ? styles.warningIcon : undefined]}
              />
            </Pressable>

            <View style={styles.timerColumn}>
              <Text
                style={[
                  styles.timerText,
                  warning ? styles.warningText : undefined,
                ]}
              >
                {mainTimerText}
              </Text>

              {isdev ? (
                <Text style={styles.debugTimerText}>
                  {debugTimerText}
                </Text>
              ) : null}
            </View>

            {openPopup === "session" ? (
              <View style={styles.popup}>
                <Text style={styles.popupTitle}>Sind Sie noch da?</Text>

                <Text style={styles.popupBody}>
                  Sie werden in{" "}
                  <Text style={styles.popupCountdown}>
                    {effectiveTimeText}
                  </Text>{" "}
                  automatisch abgemeldet.
                </Text>

                {isdev ? (
                  <View style={styles.popupDebugBox}>
                    <Text style={styles.popupDebugLine}>
                      Effektiv: {effectiveTimeText}
                    </Text>

                    {isOidc ? (
                      <>
                        <Text style={styles.popupDebugLine}>
                          Session: {sessionTimeText}
                        </Text>
                        <Text style={styles.popupDebugLine}>
                          Token: {tokenTimeText}
                        </Text>
                      </>
                    ) : (
                      <Text style={styles.popupDebugLine}>
                        JWT: {effectiveTimeText}
                      </Text>
                    )}
                  </View>
                ) : null}

                <View nativeID="no-session-extend-stay-logged-in">
                  <ActionButton
                    variant="secondary"
                    onPress={stayLoggedIn}
                    label="Weitermachen"
                  />
                </View>
              </View>
            ) : null}
          </View>
        ) : null}

        {showLogout ? (
          <Pressable
            onPress={manualLogout}
            accessibilityRole="button"
            accessibilityLabel="logout"
            nativeID="no-session-extend-logout"
          >
            <AntDesign name="logout" size={24} style={[styles.color]} />
          </Pressable>
        ) : null}
      </View>

      <LogoutDialog
        visible={logoutDialogVisible}
        onClose={() => setLogoutDialogVisible(false)}
      />
    </>
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

  timerColumn: {
    flexDirection: "column",
    alignItems: "flex-start",
  },

  timerText: {
    fontSize: 14,
    opacity: 0.85,
  },

  debugTimerText: {
    fontSize: 10,
    opacity: 0.7,
    marginTop: 1,
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
    top: 40,
    minWidth: 280,
    maxWidth: 360,
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

  popupBody: {
    fontSize: 13,
    opacity: 0.85,
    marginBottom: 10,
  },

  popupCountdown: {
    fontWeight: "800",
  },

  popupDebugBox: {
    marginBottom: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    opacity: 0.9,
  },

  popupDebugLine: {
    fontSize: 12,
    opacity: 0.85,
  },
}));