import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Platform,Pressable,useWindowDimensions, View,} from "react-native";import { StyleSheet, withUnistyles } from "react-native-unistyles";
import Feather_ from "@expo/vector-icons/Feather";
import { Buffer } from "buffer";
import { useTranslation } from "react-i18next";
import { isMobileShellRuntime } from "../util/runtime";

import { selectDeveloperConsole,toggleDeveloperConsole,} from "../redux/slices/developerConsoleSlice";

import {selectLiveConsole,} from "../redux/slices/liveConsoleSlice";
import { ThemedText } from "./themed/ThemedText";
import { Dropdown } from "./ui-elements/Dropdown";
import { useAppSelector } from "../hooks/useAppSelector";
import { useAppDispatch } from "../hooks/useAppDispatch";

import {
  checkServerAuthenticated,
  normalizeBaseUrl,
} from "../screens/login/serverCheck";

import {
  selectIsSwitchingServer,
  switchServer,
  getJwtForServer,
  selectIsLoggedIn,
  type AuthMethod,
} from "../redux/slices/apiSlice";

import {
  selectServerStatuses,
  setServerStatus,
} from "../redux/slices/serverStatusSlice";

import { openInitialPasswordChangeDialog } from "../redux/slices/passwordChangePromptSlice";

import {
  selectSelectedServer,
  selectServers,
  selectServer,
} from "../redux/slices/serverSlice";

import {
  closeNotificationPopup,
  selectUnreadNotificationCount,
  toggleNotificationPopup,
} from "../redux/slices/notificationSlice";

import {
  selectIsTestRelease,
  setWebAppReleaseType,
} from "../redux/slices/appReleaseSlice";

import { ServerLoginModal } from "../screens/login/ServerLoginModal";

const Feather = withUnistyles(Feather_);

function toBase64(str: string) {
  return typeof btoa !== "undefined"
    ? btoa(str)
    : Buffer.from(str).toString("base64");
}

function extractBearerToken(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const match = value.match(/Bearer\s+(.+)/i);

  return match?.[1]?.trim() ?? null;
}

export function Footer() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation(["Login"]);
  const { width } =useWindowDimensions();
  const isSwitchingServer = useAppSelector(selectIsSwitchingServer);
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const isTestRelease = useAppSelector(selectIsTestRelease);
  const currentBackendUrl = useAppSelector((state) => state.api.ip);
  const selectedServer = useAppSelector(selectSelectedServer);
  const serversState = useAppSelector(selectServers);
  const serverOptionMeta = useAppSelector(selectServerStatuses);
  const unreadNotificationCount = useAppSelector(selectUnreadNotificationCount);
  const developerConsole =useAppSelector( selectDeveloperConsole,);
  const liveConsole =useAppSelector(selectLiveConsole,);
  const servers = serversState?.servers ?? [];
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [pendingServerId, setPendingServerId] = useState<string | null>(null);
  const [pendingServerUrl, setPendingServerUrl] = useState<string | null>(null);
  const [pendingServerLabel, setPendingServerLabel] = useState("");
  const [pendingServerAuthMethod, setPendingServerAuthMethod] =useState<AuthMethod>("unknown");

  const isLoginPage =
    typeof window !== "undefined" &&
    (window.location.pathname === "/login" ||
      window.location.pathname === "/base-login");

  const showNotificationButton = !isLoginPage && isLoggedIn;
  const showDeveloperConsoleButton =!isLoginPage &&isLoggedIn &&
  Platform.OS === "web" && width >= 1024 &&!isMobileShellRuntime();

  useEffect(() => {
    async function loadReleaseType() {
      if (!currentBackendUrl) return;

      const baseUrl = normalizeBaseUrl(currentBackendUrl);
      const jwt = await getJwtForServer(baseUrl);

      const info = await checkServerAuthenticated(baseUrl, jwt, {
        force: true,
      });

      dispatch(setWebAppReleaseType(info.webAppReleaseType));
    }

    void loadReleaseType();
  }, [dispatch, currentBackendUrl]);

  useEffect(() => {
    if (!isLoggedIn) {
      dispatch(closeNotificationPopup());
    }
  }, [isLoggedIn, dispatch]);

  const serverOptions = useMemo(() => {
    const entries = servers.map((server) => [
      server.id,
      server.name?.trim() || server.baseUrl,
    ]);

    return Object.fromEntries(entries) as Record<string, string>;
  }, [servers]);

  const markServerLoggedIn = useCallback(
    (serverId: string | null | undefined) => {
      if (!serverId) return;

      dispatch(
        setServerStatus({
          serverId,
          status: {
            tone: "green",
            subtitle: t("einloggt"),
          },
        }),
      );
    },
    [dispatch, t],
  );

  useEffect(() => {
    if (!isLoggedIn) return;
    if (!selectedServer?.id) return;

    markServerLoggedIn(selectedServer.id);
  }, [isLoggedIn, selectedServer?.id, markServerLoggedIn]);

  async function handleServerChange(serverId: string) {
    dispatch(closeNotificationPopup());

    if (isSwitchingServer || loginLoading) return;

    const meta = serverOptionMeta[serverId];
    if (meta?.tone === "red") return;

    const server = servers.find((s) => s.id === serverId);
    if (!server) return;
    if (server.id === selectedServer?.id) return;

    const newUrl = normalizeBaseUrl(server.baseUrl);
    const existingJwt = await getJwtForServer(newUrl);

    const info = await checkServerAuthenticated(newUrl, existingJwt, {
      force: true,
    });

    dispatch(setWebAppReleaseType(info.webAppReleaseType));

    if (info.authenticated) {
      dispatch(selectServer(server.id));

      await dispatch(
        switchServer({
          url: newUrl,
          providedJwt:
            info.authenticationMethod === "jwt"
              ? existingJwt ?? undefined
              : undefined,
          initializeMenu: true,
        }),
      );

      markServerLoggedIn(server.id);
      return;
    }

    if (info.authenticationMethod === "jwt") {
      if (isLoginPage) {
        dispatch(selectServer(server.id));

        await dispatch(
          switchServer({
            url: newUrl,
            initializeMenu: false,
          }),
        );

        return;
      }

      setPendingServerId(server.id);
      setPendingServerUrl(newUrl);
      setPendingServerLabel(server.name?.trim() || server.baseUrl);
      setPendingServerAuthMethod("jwt");
      setLoginError(null);
      setLoginModalVisible(true);
      return;
    }

    dispatch(selectServer(server.id));

    await dispatch(
      switchServer({
        url: newUrl,
        initializeMenu: false,
      }),
    );
  }

  async function handleServerLoginSubmit(params: {
    username: string;
    password: string;
  }) {
    if (!pendingServerUrl) return;

    setLoginLoading(true);
    setLoginError(null);

    try {
      if (pendingServerAuthMethod !== "jwt") {
        throw new Error("Für diesen Server ist kein Passwort-Login nötig.");
      }

      const trimmedUsername = params.username.trim();
      const shouldPromptPasswordChange =
        trimmedUsername.toLowerCase() === "admin" && params.password === "admin";

      const basic = toBase64(`${trimmedUsername}:${params.password}`);

      const res = await fetch(`${pendingServerUrl}/api/user/login`, {
        method: "GET",
        headers: {
          Authorization: `Basic ${basic}`,
          Accept: "application/json",
        },
      });

      const header =
        res.headers.get("www-authenticate") ??
        res.headers.get("WWW-Authenticate") ??
        res.headers.get("authorization") ??
        res.headers.get("Authorization");

      const bodyText = await res.text();
      const bearerToken =
        extractBearerToken(header) ?? extractBearerToken(bodyText);

      if (!bearerToken) {
        throw new Error("Anmeldung fehlgeschlagen.");
      }

      const info = await checkServerAuthenticated(pendingServerUrl, bearerToken, {
        force: true,
      });

      dispatch(setWebAppReleaseType(info.webAppReleaseType));

      if (pendingServerId) {
        dispatch(selectServer(pendingServerId));
      }

      await dispatch(
        switchServer({
          url: pendingServerUrl,
          providedJwt: bearerToken,
          initializeMenu: true,
        }),
      );

      markServerLoggedIn(pendingServerId);

      if (shouldPromptPasswordChange) {
        dispatch(openInitialPasswordChangeDialog());
      }

      setLoginModalVisible(false);
      setPendingServerId(null);
      setPendingServerUrl(null);
      setPendingServerLabel("");
      setPendingServerAuthMethod("unknown");
      setLoginError(null);
    } catch (err: any) {
      setLoginError(err?.message ?? "Anmeldung fehlgeschlagen.");
    } finally {
      setLoginLoading(false);
    }
  }

  function handleNotificationButtonPress() {
    if (loginLoading || !showNotificationButton) return;

    dispatch(toggleNotificationPopup());
  }
  function handleDeveloperConsoleButtonPress() {
  if (
    loginLoading ||
    !showDeveloperConsoleButton
  ) {
    return;
  }

  dispatch(closeNotificationPopup());

  dispatch(
    toggleDeveloperConsole(),
  );
}

  return (
    <>

      <View style={styles.footer}>
           {isTestRelease ? (
          <View style={styles.testReleaseBadge}>
            <ThemedText style={styles.testReleaseBadgeText}>TEST</ThemedText>
          </View>
        ) : null}
        <ThemedText style={styles.separator}>|</ThemedText>

     

        <View
          style={[
            styles.serverDropdownWrap,
            (isSwitchingServer || loginLoading) &&
              styles.serverDropdownWrapDisabled,
          ]}
        >
          <Dropdown
            value={selectedServer?.id ?? "local"}
            options={serverOptions}
            onChange={handleServerChange}
            size="xs"
            appearance="menu"
            menuWidth={220}
            disabled={isSwitchingServer || loginLoading}
            optionMeta={serverOptionMeta}
            showOptionToneDot
            menuOffsetY={49}
            onOpen={() => dispatch(closeNotificationPopup())}
          />
        </View>

        {showNotificationButton ? (
          <>
            <ThemedText style={styles.separator}>|</ThemedText>

     <View style={styles.statusWrap}>
  <Pressable
    accessibilityRole="button"
    accessibilityLabel="Benachrichtigungen"
    onPress={
      handleNotificationButtonPress
    }
    style={styles.footerToolButton}
    disabled={loginLoading}
  >
    <Feather
      name="bookmark"
      size={15}
      style={styles.color}
    />

    {unreadNotificationCount > 0 ? (
      <View style={styles.notificationBadge}>
        <ThemedText
          style={styles.notificationBadgeText}
        >
          {unreadNotificationCount > 99
            ? "99+"
            : String(
                unreadNotificationCount,
              )}
        </ThemedText>
      </View>
    ) : null}
  </Pressable>

  {showDeveloperConsoleButton ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Developer Console"
      onPress={
        handleDeveloperConsoleButtonPress
      }
      style={[
        styles.footerToolButton,

        developerConsole.isOpen &&
          styles.footerToolButtonActive,
      ]}
      disabled={loginLoading}
    >
      <Feather
        name="terminal"
        size={16}
        style={styles.color}
      />

      <View
        style={[
          styles.consoleStatusDot,

          liveConsole.status ===
            "connected" &&
            styles.consoleStatusDotConnected,

          liveConsole.status ===
            "error" &&
            styles.consoleStatusDotError,
        ]}
      />
    </Pressable>
  ) : null}
</View>
          </>
        ) : null}
      </View>

      <ServerLoginModal
        visible={!isLoginPage && loginModalVisible}
        serverLabel={pendingServerLabel}
        loading={loginLoading}
        error={loginError}
        authMethod={pendingServerAuthMethod}
        onClose={() => {
          if (loginLoading) return;

          setLoginModalVisible(false);
          setLoginError(null);
          setPendingServerId(null);
          setPendingServerUrl(null);
          setPendingServerLabel("");
          setPendingServerAuthMethod("unknown");
        }}
        onSubmit={handleServerLoginSubmit}
      />
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  footer: {
    minHeight: 25,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    flexWrap: "wrap",
  },

  color: {
    color: theme.colors.text,
  },

  separator: {
    opacity: 0.6,
  },

  testReleaseBadge: {
    borderRadius: 4,
    backgroundColor: "#f59e0b",
    paddingHorizontal: 7,
    paddingVertical: 2,
  },

  testReleaseBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "700",
  },

  serverDropdownWrap: {
    minWidth: 100,
    maxWidth: 260,
  },

  serverDropdownWrapDisabled: {
    opacity: 0.6,
  },

  statusWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },

  notificationButton: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    minWidth: 22,
    minHeight: 22,
  },

  notificationBadge: {
    position: "absolute",
    top: -6,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 999,
    backgroundColor: "#dc2626",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },

  notificationBadgeText: {
    color: "#ffffff",
    fontSize: 9,
    lineHeight: 11,
    fontWeight: "700",
  },
  footerToolButton: {
  position: "relative",

  minWidth: 24,
  minHeight: 24,

  justifyContent: "center",
  alignItems: "center",

  borderRadius: 4,
},

footerToolButtonActive: {
  backgroundColor:
    theme.colors.card,
},

consoleStatusDot: {
  position: "absolute",
  top: 2,
  right: 1,

  width: 6,
  height: 6,
  borderRadius: 999,

  backgroundColor: "#7b8794",

  borderWidth: 1,
  borderColor:
    theme.colors.background,
},

consoleStatusDotConnected: {
  backgroundColor: "#22c55e",
},

consoleStatusDotError: {
  backgroundColor: "#ef4444",
},
}));