import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet as NativeStyleSheet,
  View,
} from "react-native";
import { withUnistyles, useUnistyles } from "react-native-unistyles";
import Feather_ from "@expo/vector-icons/Feather";
import { useTranslation } from "react-i18next";
import Constants from "expo-constants";
import { Buffer } from "buffer";

import { openInitialPasswordChangeDialog } from "../../redux/slices/passwordChangePromptSlice";
import { Dropdown } from "../../components/ui-elements/Dropdown";
import { Logo } from "../../components/Logo";
import { H1 } from "../../components/stylistic/H1";
import { Text } from "../../components/stylistic/Text";
import { ThemedAntDesign } from "../../components/themed/ThemedAntDesign";
import { ThemedText } from "../../components/themed/ThemedText";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { useAppSelector } from "../../hooks/useAppSelector";
import { selectServers } from "../../redux/slices/serverSlice";
import {
  selectApi,
  selectAuthenticationMethod,
  selectIp,
  switchServer,
} from "../../redux/slices/apiSlice";
import { ServerModal } from "./ServerModal";
import { selectLanguage, setLanguage } from "../../redux/slices/languageSlice";
import { selectThemeInfo, setTheme } from "../../redux/slices/themeSlice";
import { styles } from "./styles";
import { H4 } from "../../components/stylistic/H4";
import { ActionButton } from "../../components/ui-elements/ActionButton";
import { Card } from "../../components/ui-elements/Card";
import { TextInput } from "../../components/ui-elements/TextInput";

function toBase64(str: string): string {
  return typeof btoa !== "undefined"
    ? btoa(str)
    : Buffer.from(str).toString("base64");
}

function extractBearerToken(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const match = value.match(/Bearer\s+(.+)/i);
  return match?.[1]?.trim() ?? null;
}

export function normalizeBaseUrl(url: string): string {
  const clean = (url ?? "").trim();

  try {
    const parsed = new URL(clean);
    parsed.pathname = parsed.pathname.replace(/\/login\/?$/, "");
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString().replace(/\/+$/, "");
  } catch {
    return clean.replace(/\/login\/?$/, "").replace(/\/+$/, "");
  }
}

function buildServerOidcStartUrl(baseUrl: string): string {
  return `${normalizeBaseUrl(baseUrl)}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchOidcBearerFromServer(
  baseUrl: string,
): Promise<string | null> {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);

  const response = await fetch(`${normalizedBaseUrl}/api/app/settings/get`, {
    method: "GET",
    cache: "no-store",
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  });

  if (response.status === 400) {
    const text = await response.text();

    if (text.toLowerCase().includes("duplicate sessions")) {
      throw new Error("duplicate_sessions");
    }

    return null;
  }

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  const entries = Array.isArray(data?.propertyEntries)
    ? data.propertyEntries
    : [];

  const authenticatedRaw = entries.find(
    (entry: any) => entry?.key === "_Authenticated",
  )?.value;

  const authenticated =
    typeof authenticatedRaw === "boolean"
      ? authenticatedRaw
      : String(authenticatedRaw).toLowerCase() === "true";

  if (!authenticated) {
    return null;
  }

  const bearer = entries.find(
    (entry: any) => entry?.key === "_oidc.bearer",
  )?.value;

  return typeof bearer === "string" && bearer.length > 0 ? bearer : null;
}

async function waitForOidcBearer(
  baseUrl: string,
  retries = 90,
  delayMs = 1000,
): Promise<string | null> {
  for (let i = 0; i < retries; i += 1) {
    try {
      const bearer = await fetchOidcBearerFromServer(baseUrl);

      if (bearer) {
        return bearer;
      }
    } catch (error) {
      if (error instanceof Error && error.message === "duplicate_sessions") {
        throw error;
      }
    }

    await sleep(delayMs);
  }

  return null;
}

export function LoginScreen() {
  const { t } = useTranslation(["Login"]);
  const dispatch = useAppDispatch();
  const Feather = withUnistyles(Feather_);
  const { theme } = useUnistyles();
  const authenticationMethod = useAppSelector(selectAuthenticationMethod);
  const ip = useAppSelector(selectIp);
  const language = useAppSelector(selectLanguage);
  const themeInfo = useAppSelector(selectThemeInfo);
  const serversState = useAppSelector(selectServers);
  const servers = serversState?.servers ?? [];
  const selectedServerId = serversState?.selectedServerId ?? "local";
  const selectedServer = servers.find((server) => server.id === selectedServerId);
  const selectedBaseUrl = selectedServer?.baseUrl ?? ip;
  const loginWindowRef = useRef<Window | null>(null);
  const [highlight] = useState(false);
  const [folded, setFolded] = useState(true);
  const [orgModalOpen, setOrgModalOpen] = useState(false);
  const [oidcLoginInProgress, setOidcLoginInProgress] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const shouldPromptPasswordChange = username.trim().toLowerCase() === "admin" && password === "admin";
  const [loginRequestIssued, setLoginRequestIssued] = useState(false);
  const [loginRequestStatus, setLoginRequestStatus] = useState< "loading" | "successful" | "failed" >("loading");
  const [loginFeedback, setLoginFeedback] = useState<string | null>(null);
  styles.useVariants({ highlight });
  const mutedTextStyle = { color: theme.colors.text, opacity: 0.75 };
  const languageOptions = {de: "Deutsch", en: "English",} as const;
  const themeOptions = { system: t("system"),light: t("light"), dark: t("dark"),} as const;
  const currentThemeValue: keyof typeof themeOptions = themeInfo.adaptive? "system": themeInfo.theme;
  const isWeb = Platform.OS === "web";
  const showJwtLogin = authenticationMethod === "jwt";
  const showUnknownAuth = authenticationMethod === "unknown";
  const basic = toBase64(`${username}:${password}`);
  const loginUrl = `${normalizeBaseUrl(selectedBaseUrl)}/api/user/login`;

  // Cleanup function to close the login window if it's still open when the component unmounts
  async function loginWithJwt(): Promise<void> {
    if (!username.trim() || !password.trim()) {
      setLoginRequestStatus("failed");
      setLoginFeedback(t("username_and_password_required"));
      return;
    }


   // Close any open login window before starting a new login attempt
    const response = await fetch(loginUrl, {
      method: "GET",
      headers: {
        Authorization: `Basic ${basic}`,
        Accept: "application/json",
      },
    });
  // Try to extract bearer token from headers or body, depending on server implementation
    const wwwAuthenticate =
      response.headers.get("www-authenticate") ??
      response.headers.get("WWW-Authenticate") ??
      response.headers.get("authorization") ??
      response.headers.get("Authorization");

    const bodyText = await response.text();

    const bearerToken =
      extractBearerToken(wwwAuthenticate) ?? extractBearerToken(bodyText);

    if (response.status === 200 && bearerToken) {
      await dispatch(
        switchServer({
          url: selectedBaseUrl,
          providedJwt: bearerToken,
          initializeMenu: true,
        }),
      );

      if (shouldPromptPasswordChange) {
        dispatch(openInitialPasswordChangeDialog());
      }

      setLoginRequestStatus("successful");
      setLoginFeedback(null);
      return;
    }

    if (response.status === 401) {
      setLoginRequestStatus("failed");
      setLoginFeedback(t("invalid_credentials"));
      return;
    }

    setLoginRequestStatus("failed");
    setLoginFeedback(t("login_failed"));
  }

  async function loginWithOidc(): Promise<void> {
  if (oidcLoginInProgress) return;

  setLoginRequestIssued(true);
  setLoginRequestStatus("loading");
  setLoginFeedback(null);
  setOidcLoginInProgress(true);

  const oidcStartUrl = buildServerOidcStartUrl(selectedBaseUrl);

  try {
    if (!oidcStartUrl) {
      setLoginRequestStatus("failed");
      setLoginFeedback("OIDC-Start-URL fehlt.");
      return;
    }

    if (isWeb) {
      loginWindowRef.current = window.open(
        oidcStartUrl,
        "awb-oidc-login",
        "width=1000,height=850",
      );

      if (!loginWindowRef.current) {
        setLoginRequestStatus("failed");
        setLoginFeedback("Popup wurde blockiert. Bitte Popups erlauben.");
        return;
      }

      const bearer = await waitForOidcBearer(selectedBaseUrl, 90, 1000);

      if (!bearer) {
        setLoginRequestStatus("failed");
        setLoginFeedback("Login wurde nicht abgeschlossen.");
        return;
      }
        const isExpoWeb =
          Platform.OS === "web" &&
          typeof window !== "undefined" &&
          window.location.origin.includes("localhost:8081");

        await dispatch(
          switchServer({
            url: selectedBaseUrl,
            providedJwt: bearer,
            initializeMenu: !isExpoWeb,
          }),
        );

      loginWindowRef.current?.close();
      window.focus();

      setLoginRequestStatus("successful");
      setLoginFeedback(null);
      return;
    }
  } finally {
    setOidcLoginInProgress(false);
  }
}
// Main login function that handles both JWT and OIDC login flows based on the selected authentication method
  async function login(): Promise<void> {
    if (oidcLoginInProgress && authenticationMethod === "oidc") {
      return;
    }

    setLoginRequestIssued(true);
    setLoginRequestStatus("loading");
    setLoginFeedback(null);

    try {
      switch (authenticationMethod) {
        case "jwt":
          await loginWithJwt();
          return;

        case "oidc":
          await loginWithOidc();
          return;

        case "unknown":
        default:
          setLoginRequestStatus("failed");
          setLoginFeedback(t("auth_method_unknown"));
          return;
      }
    } catch (error: unknown) {
      console.error("[LOGIN SCREEN] login failed:", error);

      const msg =
        error instanceof Error
          ? error.message.toLowerCase()
          : String(error ?? "").toLowerCase();

      if (msg.includes("duplicate_sessions")) {
        setLoginFeedback(
          "Es gibt doppelte Server-Sessions. Bitte alte OIDC-Sitzungen schließen und erneut anmelden.",
        );
      } else if (
        msg.includes("failed to fetch") ||
        msg.includes("network") ||
        msg.includes("load failed") ||
        msg.includes("err_connection_refused")
      ) {
        setLoginFeedback("Server nicht erreichbar.");
      } else {
        setLoginFeedback("Anmeldung fehlgeschlagen.");
      }

      setLoginRequestStatus("failed");
    }
  }
 // Effect to clean up login window reference when selectedBaseUrl changes (e.g., user selects a different server)
  useEffect(() => {
    setOidcLoginInProgress(false);
    loginWindowRef.current = null;
  }, [selectedBaseUrl]);

  return (
    <View style={[styles.container]}>
      <View style={[styles.widget, styles.border]}>
        <View style={[styles.titleContainer]}>
          <Logo style={logoStyles.logo} />
          <H1>{process.env.EXPO_PUBLIC_APPLICATION_TITLE}</H1>
        </View>

        <View style={[styles.upperHalf]}>
          {showJwtLogin && (
            <>
              <TextInput
                size="sm"
                style={[styles.border, styles.padding]}
                placeholder={t("username_placeholder")}
                textContentType="username"
                onChangeText={(value: string) => {
                  setUsername(value);
                  setLoginFeedback(null);
                }}
                value={username}
                returnKeyType="next"
              />

              <TextInput
                size="sm"
                style={[styles.border, styles.padding]}
                placeholder={t("password_placeholder")}
                textContentType="password"
                passwordToggle
                onChangeText={(value: string) => {
                  setPassword(value);
                  setLoginFeedback(null);
                }}
                value={password}
                returnKeyType="done"
                onSubmitEditing={() => {
                  if (username && password) {
                    void login();
                  }
                }}
              />

              <ActionButton
                label={t("login")}
                variant="secondary"
                onPress={() => {
                  void login();
                }}
                size="xs"
              />
            </>
          )}

          {!showJwtLogin && (
            <View style={localStyles.oidcLoading}>
              <ActionButton
                label={oidcLoginInProgress ? t("loading") : t("login")}
                variant="secondary"
                size="xs"
                onPress={() => {
                  void loginWithOidc();
                }}
              />

              {oidcLoginInProgress && <ActivityIndicator />}
            </View>
          )}

          {showUnknownAuth && (
            <Text style={localStyles.infoText}>{t("auth_method_unknown")}</Text>
          )}
        </View>

        <View style={[styles.lowerHalf]}>
          <Pressable
            style={[styles.advancedSettingsTitleContainer]}
            onPress={() => setFolded(!folded)}
          >
            <Text>{t("advanced_options")}</Text>
            <ThemedAntDesign name={folded ? "down" : "up"} />
          </Pressable>

          {!folded && (
            <ScrollView contentContainerStyle={[styles.advancedItemsContainer]}>
              <Card onPress={() => setOrgModalOpen(true)} padding="none">
                <View style={[styles.serverBadge, { gap: 1 }]}>
                  <View style={{ flex: 1, gap: 1 }}>
                    <H4 style={{ fontWeight: "bold" }}>
                      {selectedServer?.name ?? t("unknownServer")}
                    </H4>

                    <Text style={[mutedTextStyle]} numberOfLines={1}>
                      {selectedBaseUrl || "-"}
                    </Text>
                  </View>
                </View>
              </Card>

              <View style={{ gap: 6 }}>
                <ThemedText>{t("lng")}:</ThemedText>
                <Dropdown<"de" | "en">
                  value={(language.language as "de" | "en") ?? "de"}
                  options={languageOptions}
                  onChange={(lng) => dispatch(setLanguage({ language: lng }))}
                  size="xs"
                />
              </View>

              <View style={{ gap: 6 }}>
                <ThemedText>{t("color-scheme")}:</ThemedText>
                <Dropdown<"system" | "light" | "dark">
                  value={currentThemeValue}
                  options={themeOptions}
                  onChange={(value) => {
                    const next =
                      value === "system"
                        ? { adaptive: true, theme: themeInfo.theme }
                        : {
                            adaptive: false,
                            theme: value as "light" | "dark",
                          };

                    dispatch(setTheme(next));
                  }}
                  size="xs"
                />
              </View>
            </ScrollView>
          )}
        </View>
      </View>

      {!!loginFeedback && (
        <View style={localStyles.feedbackWrap}>
          <Feather name="alert-triangle" size={15} color="#dc2626" />
          <ThemedText style={localStyles.feedbackText}>
            {loginFeedback}
          </ThemedText>
        </View>
      )}

      <LoginRequestStatusIndicator
        issued={loginRequestIssued}
        status={loginRequestStatus}
      />

      <ServerModal
        visible={orgModalOpen}
        onClose={() => setOrgModalOpen(false)}
        servers={servers}
        selectedServerId={selectedServerId}
        selectedBaseUrl={selectedBaseUrl}
      />
    </View>
  );
}

function LoginRequestStatusIndicator({
  issued,
  status,
}: {
  issued: boolean;
  status: "loading" | "successful" | "failed";
}) {
  styles.useVariants({ status });

  const { t } = useTranslation(["Login"]);

  if (!issued) return null;

  if (status === "loading") {
    return (
      <View style={[styles.loginRequestIndicatorContainer]}>
        <ThemedText>{t("loading")}</ThemedText>
        <ActivityIndicator />
      </View>
    );
  }

  if (status === "successful") {
    return (
      <View style={[styles.loginRequestIndicatorContainer]}>
        <ThemedText>{t("successful")}</ThemedText>
        <ThemedAntDesign name="check" />
      </View>
    );
  }

  return null;
}

const logoStyles = NativeStyleSheet.create({
  logo: {
    resizeMode: "contain",
    width: 38,
    height: 38,
  },
});

const localStyles = NativeStyleSheet.create({
  feedbackWrap: {
    borderWidth: 1,
    flexDirection: "row",
    borderColor: "#dc2626",
    alignItems: "center",
    gap: 6,
    padding: 5,
  },
  feedbackText: {
    color: "#dc2626",
    fontSize: 13,
    textAlign: "center",
  },
  infoText: {
    textAlign: "center",
    fontSize: 14,
  },
  oidcLoading: {
    gap: 8,
    alignItems: "center",
  },
});