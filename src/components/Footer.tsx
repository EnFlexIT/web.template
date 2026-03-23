import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import AntDesign_ from "@expo/vector-icons/AntDesign";
import {withUnistyles } from "react-native-unistyles";
import { ThemedText } from "./themed/ThemedText";
import { Dropdown } from "./ui-elements/Dropdown";
import { useAppSelector } from "../hooks/useAppSelector";
import { useAppDispatch } from "../hooks/useAppDispatch";

import {
  selectIsBaseModule,
  selectIsCustomerModule,
  selectIsSwitchingServer,
  switchServer,
  getJwtForServer,
} from "../redux/slices/apiSlice";

import { selectConnectivity } from "../redux/slices/connectivitySlice";
import {
  selectSelectedServer,
  selectServers,
  selectServer,
} from "../redux/slices/serverSlice";
import { selectAuthenticationMethod } from "../redux/slices/apiSlice";

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

async function checkServerAuthenticated(
  baseUrl: string,
  jwt: string | null,
): Promise<boolean> {
  const normalized = normalizeBaseUrl(baseUrl);

  try {
    const res = await fetch(`${normalized}/api/alive`, {
      method: "GET",
      cache: "no-store",
      headers: jwt
        ? {
            Authorization: `Bearer ${jwt}`,
            Accept: "application/json",
          }
        : {
            Accept: "application/json",
          },
    });

    if (res.status === 200) return true;
    if (res.status === 401) return false;

    return false;
  } catch {
    return false;
  }
}

type ServerTone = "green" | "yellow" | "red";

type ServerOptionMeta = {
  tone: ServerTone;
  subtitle: string;
};

const SERVER_STATUS_REFRESH_EVENT = "server-status-refresh";

export function Footer() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation(["Login"]);

const isBaseModule = useAppSelector(selectIsBaseModule);
const isCustomerModule = useAppSelector(selectIsCustomerModule);
  const isSwitchingServer = useAppSelector(selectIsSwitchingServer);
  const { isOffline } = useAppSelector(selectConnectivity);
  const selectedServer = useAppSelector(selectSelectedServer);
  const serversState = useAppSelector(selectServers);
  const authenticationMethod = useAppSelector(selectAuthenticationMethod);

   const AntDesign = withUnistyles(AntDesign_);

  const env = getAppEnvironment();

  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [pendingServerId, setPendingServerId] = useState<string | null>(null);
  const [pendingServerUrl, setPendingServerUrl] = useState<string | null>(null);
  const [pendingServerLabel, setPendingServerLabel] = useState("");

  const [serverOptionMeta, setServerOptionMeta] = useState<
    Record<string, ServerOptionMeta>
  >({});

  const isLoginPage =
    typeof window !== "undefined" &&
    (window.location.pathname === "/login" ||
      window.location.pathname === "/base-login");

  const deviceMode = isBaseModule
  ? "Base Application"
  : isCustomerModule
    ? "HEMS"
    : "Unknown / Not authenticated";
  const status = isSwitchingServer
    ? "Switching server..."
    : isOffline
      ? "Offline"
      : "Online";

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
                subtitle: "Nicht erreichbar / offline",
              },
            ] as const;
          }

          const jwt = await getJwtForServer(server.baseUrl);
          const authenticated = await checkServerAuthenticated(
            server.baseUrl,
            jwt,
          );

          if (authenticated) {
            return [
              server.id,
              {
                tone: "green" as const,
                subtitle:  t("Eingeloggt") ,
              },
            ] as const;
          }

          return [
            server.id,
            {
              tone: "yellow" as const,
              subtitle:  t("erreichbarNichtEinloggt") ,
            },
          ] as const;
        } catch {
          return [
            server.id,
            {
              tone: "red" as const,
              subtitle:  t("nichtErreichbar") ,
            },
          ] as const;
        }
      }),
    );

    setServerOptionMeta(Object.fromEntries(entries));
  }, [servers]);

  useEffect(() => {
    let active = true;

    const safeRefresh = async () => {
      if (!active) return;
      await refreshServerStatuses();
    };

    safeRefresh();

    const intervalId = setInterval(() => {
      safeRefresh();
    }, 10000);

    const onRefreshEvent = () => {
      safeRefresh();
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
  if (isSwitchingServer || loginLoading) return;

  // 🔴 Nicht erreichbare Server im Footer unklickbar machen
  const meta = serverOptionMeta[serverId];
  if (meta?.tone === "red") return;

  const server = servers.find((s) => s.id === serverId);
  if (!server) return;
  if (server.id === selectedServer?.id) return;

  const newUrl = normalizeBaseUrl(server.baseUrl);
  const existingJwt = await getJwtForServer(newUrl);
  const alreadyAuthenticated = await checkServerAuthenticated(
    newUrl,
    existingJwt,
  );

  if (!alreadyAuthenticated) {
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
    setLoginError(null);
    setLoginModalVisible(true);
    return;
  }

  dispatch(selectServer(server.id));

  await dispatch(
    switchServer({
      url: newUrl,
      initializeMenu: true,
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
      if (authenticationMethod !== "jwt") {
        throw new Error("Aktuell wird nur JWT-Login unterstützt.");
      }

      const basic = toBase64(`${params.username}:${params.password}`);

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
      const bearerToken = extractBearerToken(hdr) ?? extractBearerToken(bodyText);

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

      setLoginModalVisible(false);
      setPendingServerId(null);
      setPendingServerUrl(null);
      setPendingServerLabel("");
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
            menuWidth={180}
            disabled={isSwitchingServer || loginLoading}
            optionMeta={serverOptionMeta}
            showOptionToneDot
            menuOffsetY={49}
          />
        </View>

        <ThemedText style={styles.separator}>|</ThemedText>

        <View style={styles.statusWrap}>
          {isSwitchingServer ? <ActivityIndicator size="small" /> : null}
                  <AntDesign name="alert" size={15} style={[styles.color]} />

        </View>
      </View>

      <ServerLoginModal
        visible={!isLoginPage && loginModalVisible}
        serverLabel={pendingServerLabel}
        loading={loginLoading}
        error={loginError}
        onClose={() => {
          if (loginLoading) return;
          setLoginModalVisible(false);
          setLoginError(null);
          setPendingServerId(null);
          setPendingServerUrl(null);
          setPendingServerLabel("");
        }}
        onSubmit={handleServerLoginSubmit}
      />
    </>
  );
}

function getEnvStyleKey(env: "DEV" | "TEST" | "PROD") {
  switch (env) {
    case "TEST":
      return "testBadge";
    case "PROD":
      return "prodBadge";
    case "DEV":
    default:
      return "devBadge";
  }
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

  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },

    color: {
    color: theme.colors.text,
  },

  devBadge: {
    backgroundColor: "#F59E0B",
  },

  testBadge: {
    backgroundColor: "#3B82F6",
  },

  prodBadge: {
    backgroundColor: "#6B7280",
  },

  badgeText: {
    color: "#FFFFFF",
  },

  text: {},

  separator: {
    opacity: 0.6,
  },

  serverDropdownWrap: {
    minWidth: 100,
    maxWidth: 230,
  },

  serverDropdownWrapDisabled: {
    opacity: 0.6,
  },

  statusWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
}));