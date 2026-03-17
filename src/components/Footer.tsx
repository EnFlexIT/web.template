import React, { useMemo, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { ThemedText } from "./themed/ThemedText";
import { Dropdown } from "./ui-elements/Dropdown";
import { useAppSelector } from "../hooks/useAppSelector";
import { useAppDispatch } from "../hooks/useAppDispatch";

import {
  selectIsBaseMode,
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

export function Footer() {
  const dispatch = useAppDispatch();

  const isBaseMode = useAppSelector(selectIsBaseMode);
  const isSwitchingServer = useAppSelector(selectIsSwitchingServer);
  const { isOffline } = useAppSelector(selectConnectivity);
  const selectedServer = useAppSelector(selectSelectedServer);
  const serversState = useAppSelector(selectServers);
  const authenticationMethod = useAppSelector(selectAuthenticationMethod);

  const env = getAppEnvironment();

  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [pendingServerId, setPendingServerId] = useState<string | null>(null);
  const [pendingServerUrl, setPendingServerUrl] = useState<string | null>(null);
  const [pendingServerLabel, setPendingServerLabel] = useState("");

  const isLoginPage =
    typeof window !== "undefined" &&
    (window.location.pathname === "/login" ||
      window.location.pathname === "/base-login");

  const deviceMode = isBaseMode ? "Base Application" : "User Mode";
  const status = isSwitchingServer
    ? "Switching server..."
    : isOffline
      ? "Offline"
      : "Online";

  const serverOptions = useMemo(() => {
    const entries = (serversState?.servers ?? []).map((server) => [
      server.id,
      server.name?.trim() || server.baseUrl,
    ]);

    return Object.fromEntries(entries) as Record<string, string>;
  }, [serversState?.servers]);

  async function handleServerChange(serverId: string) {
    if (isSwitchingServer || loginLoading) return;

    const server = serversState?.servers?.find((s) => s.id === serverId);
    if (!server) return;
    if (server.id === selectedServer?.id) return;

    const newUrl = normalizeBaseUrl(server.baseUrl);
    const existingJwt = await getJwtForServer(newUrl);
    const alreadyAuthenticated = await checkServerAuthenticated(
      newUrl,
      existingJwt,
    );

    if (!alreadyAuthenticated) {
      // Auf Login-Seite: kein extra Modal anzeigen.
      // Einfach Server aktiv umstellen, damit der normale Login-Screen
      // für den neuen Server benutzt wird.
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

      // Außerhalb der Login-Seite: Modal öffnen
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
    } catch (err: any) {
      setLoginError(err?.message ?? "Anmeldung fehlgeschlagen.");
    } finally {
      setLoginLoading(false);
    }
  }

  return (
    <>
      <View style={styles.footer}>
        <View style={[styles.badge, styles[getEnvStyleKey(env)]]}>
          <ThemedText style={styles.badgeText}>{env}</ThemedText>
        </View>

        <ThemedText style={styles.separator}>|</ThemedText>
        <ThemedText style={styles.text}>{deviceMode}</ThemedText>

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
            menuWidth={140}
            disabled={isSwitchingServer || loginLoading}
          />
        </View>

        <ThemedText style={styles.separator}>|</ThemedText>

        <View style={styles.statusWrap}>
          {isSwitchingServer ? <ActivityIndicator size="small" /> : null}
          <ThemedText style={styles.text}>{status}</ThemedText>
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