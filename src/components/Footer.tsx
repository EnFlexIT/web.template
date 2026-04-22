import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import Feather_ from "@expo/vector-icons/Feather";
import { withUnistyles } from "react-native-unistyles";
import { ThemedText } from "./themed/ThemedText";
import { Dropdown } from "./ui-elements/Dropdown";
import { useAppSelector } from "../hooks/useAppSelector";
import { useAppDispatch } from "../hooks/useAppDispatch";
import {
  selectIsSwitchingServer,
  switchServer,
  getJwtForServer,
  selectIsLoggedIn,
  type AuthMethod,
} from "../redux/slices/apiSlice";
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

import { getAppEnvironment } from "../util/appEnvironment";
import { ServerLoginModal } from "../screens/login/ServerLoginModal";
import { checkServerReachable } from "../screens/login/serverCheck";

import { useTranslation } from "react-i18next";

function normalizeBaseUrl(url: string) {
  return (url ?? "").trim().replace(/\/+$/, "");
}

function toBase64(str: string) {
  return typeof btoa !== "undefined"
    ? btoa(str)
    : Buffer.from(str).toString("base64");
}

function extractBearerToken(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const m = value.match(/Bearer\s+(.+)/i);
  return m?.[1]?.trim() ?? null;
}

type ServerTone = "green" | "yellow" | "red";

type ServerOptionMeta = {
  tone: ServerTone;
  subtitle: string;
};

type ServerAuthInfo = {
  authenticated: boolean;
  authenticationMethod: AuthMethod;
  oidcBearer: string | null;
  sessionInvalid: boolean;
};

const SERVER_STATUS_REFRESH_EVENT = "server-status-refresh";

async function checkServerAuthenticated(
  baseUrl: string,
  jwt: string | null,
): Promise<ServerAuthInfo> {
  const normalized = normalizeBaseUrl(baseUrl);

  try {
    const res = await fetch(`${normalized}/api/app/settings/get`, {
      method: "GET",
      cache: "no-store",
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
      },
    });

    if (res.status === 400) {
      return {
        authenticated: false,
        authenticationMethod: "unknown",
        oidcBearer: null,
        sessionInvalid: true,
      };
    }

    if (!res.ok) {
      return {
        authenticated: false,
        authenticationMethod: "unknown",
        oidcBearer: null,
        sessionInvalid: false,
      };
    }

    const data = await res.json();
    const entries = Array.isArray(data?.propertyEntries) ? data.propertyEntries : [];

    const authCfg = entries.find(
      (entry: any) => entry?.key === "_ServerWideSecurityConfiguration",
    )?.value;

    const authenticatedRaw = entries.find(
      (entry: any) => entry?.key === "_Authenticated",
    )?.value;

    const oidcBearer = entries.find(
      (entry: any) => entry?.key === "_oidc.bearer",
    )?.value;

    const hasSessionId = entries.some(
      (entry: any) => entry?.key === "_session.id",
    );

    const hasSessionPathParameter = entries.some(
      (entry: any) => entry?.key === "_session.pathParameter",
    );

    const authenticated =
      typeof authenticatedRaw === "boolean"
        ? authenticatedRaw
        : String(authenticatedRaw).toLowerCase() === "true";

    let authenticationMethod: AuthMethod = "unknown";

    if (authCfg === "OIDCSecurityHandler") {
      authenticationMethod = "oidc";
    } else if (authCfg === "JwtSingleUserSecurityHandler") {
      authenticationMethod = "jwt";
    } else if (oidcBearer || hasSessionId || hasSessionPathParameter) {
      authenticationMethod = "oidc";
    } else if (jwt) {
      authenticationMethod = "jwt";
    } else {
      authenticationMethod = "jwt";
    }

    return {
      authenticated,
      authenticationMethod,
      oidcBearer: typeof oidcBearer === "string" ? oidcBearer : null,
      sessionInvalid: false,
    };
  } catch {
    return {
      authenticated: false,
      authenticationMethod: "unknown",
      oidcBearer: null,
      sessionInvalid: false,
    };
  }
}

export function Footer() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation(["Login"]);
  const isSwitchingServer = useAppSelector(selectIsSwitchingServer);
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const selectedServer = useAppSelector(selectSelectedServer);
  const serversState = useAppSelector(selectServers);
  const unreadNotificationCount = useAppSelector(selectUnreadNotificationCount);
  const Feather = withUnistyles(Feather_);
  const env = getAppEnvironment();

  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [pendingServerId, setPendingServerId] = useState<string | null>(null);
  const [pendingServerUrl, setPendingServerUrl] = useState<string | null>(null);
  const [pendingServerLabel, setPendingServerLabel] = useState("");
  const [pendingServerAuthMethod, setPendingServerAuthMethod] =
    useState<AuthMethod>("unknown");

  const [serverOptionMeta, setServerOptionMeta] = useState<
    Record<string, ServerOptionMeta>
  >({});

  const isLoginPage =
    typeof window !== "undefined" &&
    (window.location.pathname === "/login" ||
      window.location.pathname === "/base-login");

  const showNotificationButton =
    !isLoginPage && (isLoggedIn || unreadNotificationCount > 0);

  const servers = serversState?.servers ?? [];

  const serverOptions = useMemo(() => {
    const entries = servers.map((server) => [
      server.id,
      server.name?.trim() || server.baseUrl,
    ]);

    return Object.fromEntries(entries) as Record<string, string>;
  }, [servers]);

  const refreshServerStatuses = useCallback(async () => {
    if (!servers.length) {
      setServerOptionMeta({});
      return;
    }

    const entries = await Promise.all(
      servers.map(async (server) => {
        try {
          const reachable = await checkServerReachable(server.baseUrl);

          if (!reachable.ok) {
            return [
              server.id,
              {
                tone: "red" as const,
                subtitle: t("nichtErreichbar"),
              },
            ] as const;
          }

          const jwt = await getJwtForServer(server.baseUrl);
          const info = await checkServerAuthenticated(server.baseUrl, jwt);

          if (info.authenticated) {
            return [
              server.id,
              {
                tone: "green" as const,
                subtitle: t("eingeloggt"),
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

    setServerOptionMeta(Object.fromEntries(entries));
  }, [servers, t]);

  useEffect(() => {
    let active = true;

    const safeRefresh = async () => {
      if (!active) return;
      await refreshServerStatuses();
    };

    void safeRefresh();

    const intervalId = setInterval(() => {
      void safeRefresh();
    }, 10000);

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
  }, [refreshServerStatuses]);

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
    const info = await checkServerAuthenticated(newUrl, existingJwt);

    if (info.authenticated) {
      dispatch(selectServer(server.id));

      await dispatch(
        switchServer({
          url: newUrl,
          providedJwt:
            info.authenticationMethod === "oidc"
              ? info.oidcBearer ?? undefined
              : undefined,
          initializeMenu: true,
        }),
      );

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(SERVER_STATUS_REFRESH_EVENT));
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
          window.dispatchEvent(new Event(SERVER_STATUS_REFRESH_EVENT));
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
        providedJwt: info.oidcBearer ?? undefined,
        initializeMenu: !!info.oidcBearer,
      }),
    );

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(SERVER_STATUS_REFRESH_EVENT));
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
        trimmedUsername.toLowerCase() === "admin" &&
        params.password === "admin";

      const basic = toBase64(`${trimmedUsername}:${params.password}`);

      const res = await fetch(`${pendingServerUrl}/api/user/login`, {
        method: "GET",
        headers: {
          Authorization: `Basic ${basic}`,
          Accept: "application/json",
        },
      });

      const hdr =
        res.headers.get("www-authenticate") ??
        res.headers.get("WWW-Authenticate") ??
        res.headers.get("authorization") ??
        res.headers.get("Authorization");

      const bodyText = await res.text();
      const bearerToken =
        extractBearerToken(hdr) ?? extractBearerToken(bodyText);

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

      if (shouldPromptPasswordChange) {
        dispatch(openInitialPasswordChangeDialog());
      }

      setLoginModalVisible(false);
      setPendingServerId(null);
      setPendingServerUrl(null);
      setPendingServerLabel("");
      setPendingServerAuthMethod("unknown");
      setLoginError(null);

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(SERVER_STATUS_REFRESH_EVENT));
      }
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
        <ThemedText>{env}</ThemedText>
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