import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import Feather_ from "@expo/vector-icons/Feather";
import { Buffer } from "buffer";
import { useTranslation } from "react-i18next";

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
  setServerStatuses,
} from "../redux/slices/serverStatusSlice";
import {
  dispatchServerStatusRefresh,
  SERVER_STATUS_REFRESH_EVENT,
} from "../util/serverStatusRefresh";

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

type ServerTone = "green" | "yellow" | "red";

type ServerOptionMeta = {
  tone: ServerTone;
  subtitle: string;
};

export function Footer() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation(["Login"]);

  const isSwitchingServer = useAppSelector(selectIsSwitchingServer);
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const selectedServer = useAppSelector(selectSelectedServer);
  const serversState = useAppSelector(selectServers);
  const unreadNotificationCount = useAppSelector(selectUnreadNotificationCount);

  const servers = serversState?.servers ?? [];

  const refreshServerStatusesRunningRef = useRef(false);

  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [pendingServerId, setPendingServerId] = useState<string | null>(null);
  const [pendingServerUrl, setPendingServerUrl] = useState<string | null>(null);
  const [pendingServerLabel, setPendingServerLabel] = useState("");
  const [pendingServerAuthMethod, setPendingServerAuthMethod] =
    useState<AuthMethod>("unknown");
   const serverOptionMeta = useAppSelector(selectServerStatuses);
   console.log("[FOOTER]", serverOptionMeta);


  const isLoginPage =
    typeof window !== "undefined" &&
    (window.location.pathname === "/login" ||
      window.location.pathname === "/base-login");

  const showNotificationButton =
    !isLoginPage && (isLoggedIn || unreadNotificationCount > 0);

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

  const refreshServerStatuses = useCallback(async () => {
    if (refreshServerStatusesRunningRef.current) return;

    refreshServerStatusesRunningRef.current = true;

    try {
      if (!servers.length) {
        dispatch(setServerStatuses({}));
        return;
      }

      const entries = await Promise.all(
        servers.map(async (server) => {
          const jwt = await getJwtForServer(server.baseUrl);

          try {
            const info = await checkServerAuthenticated(server.baseUrl, jwt);

            if (info.authenticated) {
              return [
                server.id,
                {
                  tone: "green" as const,
                  subtitle: t("einloggt"),
                },
              ] as const;
            }

            if (info.sessionInvalid) {
              return [
                server.id,
                {
                  tone: "yellow" as const,
                  subtitle: t("Session ungültig / neu anmelden"),
                },
              ] as const;
            }

            return [
              server.id,
              {
                tone: "yellow" as const,
                subtitle: t("erreichbarNichtEinloggt"),
              },
            ] as const;
          } catch {
            return [
              server.id,
              {
                tone: "red" as const,
                subtitle: t("nichtErreichbar"),
              },
            ] as const;
          }
        }),
      );

      dispatch(setServerStatuses(Object.fromEntries(entries)));
    } finally {
      refreshServerStatusesRunningRef.current = false;
    }
 }, [servers, t, dispatch]);

  useEffect(() => {
    let active = true;

    const safeRefresh = async () => {
      if (!active) return;
      if (isLoginPage) return;

      await refreshServerStatuses();
    };

    void safeRefresh();

    const intervalId = setInterval(() => {
      void safeRefresh();
    }, 60_000);

    const onRefreshEvent = () => {
      void safeRefresh();
    };

    if (typeof window !== "undefined") {
      window.addEventListener(SERVER_STATUS_REFRESH_EVENT, onRefreshEvent);
      window.addEventListener("focus", onRefreshEvent);
    }

    return () => {
      active = false;
      clearInterval(intervalId);

      if (typeof window !== "undefined") {
        window.removeEventListener(SERVER_STATUS_REFRESH_EVENT, onRefreshEvent);
        window.removeEventListener("focus", onRefreshEvent);
      }
    };
  }, [refreshServerStatuses, isLoginPage]);

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

    if (typeof window !== "undefined") {
      dispatchServerStatusRefresh();
    }

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

      if (typeof window !== "undefined") {
        dispatchServerStatusRefresh();
      }

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

  if (typeof window !== "undefined") {
    dispatchServerStatusRefresh();
  }
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

      dispatchServerStatusRefresh();
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

  return (
    <>
      <View style={styles.footer}>
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
                onPress={handleNotificationButtonPress}
                style={styles.notificationButton}
                disabled={loginLoading}
              >
                <Feather name="bookmark" size={15} style={styles.color} />

                {unreadNotificationCount > 0 ? (
                  <View style={styles.notificationBadge}>
                    <ThemedText style={styles.notificationBadgeText}>
                      {unreadNotificationCount > 99
                        ? "99+"
                        : String(unreadNotificationCount)}
                    </ThemedText>
                  </View>
                ) : null}
              </Pressable>
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
    gap: 6,
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
}));