import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  View,
  StyleSheet as NativeStyleSheet,
  Platform,
  Linking,
} from "react-native";
import { withUnistyles, useUnistyles } from "react-native-unistyles";
import Feather_ from "@expo/vector-icons/Feather";
import { useTranslation } from "react-i18next";
import * as WebBrowser from "expo-web-browser";
import Constants from "expo-constants";

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

WebBrowser.maybeCompleteAuthSession();

function toBase64(str: string): string {
  return typeof btoa !== "undefined"
    ? btoa(str)
    : Buffer.from(str).toString("base64");
}

function extractBearerToken(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const m = value.match(/Bearer\s+(.+)/i);
  return m?.[1]?.trim() ?? null;
}

function normalizeBaseUrl(url: string): string {
  return (url ?? "").trim().replace(/\/+$/, "");
}

function buildServerOidcStartUrl(baseUrl: string): string {
  const normalized = normalizeBaseUrl(baseUrl);
  return `${normalized}/`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchOidcBearerFromServer(baseUrl: string): Promise<string | null> {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);

  const response = await fetch(`${normalizedBaseUrl}/api/app/settings/get`, {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  const entries = Array.isArray(data?.propertyEntries) ? data.propertyEntries : [];

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
  retries = 20,
  delayMs = 1000,
): Promise<string | null> {
  for (let i = 0; i < retries; i += 1) {
    const bearer = await fetchOidcBearerFromServer(baseUrl);

    if (bearer) {
      return bearer;
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
  const { isPointingToServer, isLoggedIn } = useAppSelector(selectApi);
  const ip = useAppSelector(selectIp);

  const language = useAppSelector(selectLanguage);
  const themeInfo = useAppSelector(selectThemeInfo);

  const serversState = useAppSelector(selectServers);
  const servers = serversState?.servers ?? [];
  const selectedServerId = serversState?.selectedServerId ?? "local";
  const selectedServer = servers.find((s) => s.id === selectedServerId);
  const selectedBaseUrl = selectedServer?.baseUrl ?? ip;

  const [highlight, setHighlight] = useState(false);
  const [folded, setFolded] = useState(true);
  const [orgModalOpen, setOrgModalOpen] = useState(false);
  const [oidcAutoStarted, setOidcAutoStarted] = useState(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const shouldPromptPasswordChange =
    username.trim().toLowerCase() === "admin" && password === "admin";

  const [loginRequestIssued, setLoginRequestIssued] = useState(false);
  const [loginRequestStatus, setLoginRequestStatus] = useState<
    "loading" | "successful" | "failed"
  >("loading");
  const [loginFeedback, setLoginFeedback] = useState<string | null>(null);

  styles.useVariants({ highlight });

  const mutedTextStyle = { color: theme.colors.text, opacity: 0.75 };

  const languageOptions = {
    de: "Deutsch",
    en: "English",
  } as const;

  const themeOptions = {
    system: t("system"),
    light: t("light"),
    dark: t("dark"),
  } as const;

  const currentThemeValue: keyof typeof themeOptions = themeInfo.adaptive
    ? "system"
    : themeInfo.theme;

  const isWeb = Platform.OS === "web";
  const isExpoGo = Constants.appOwnership === "expo";
  const isPopupWindow =
    typeof window !== "undefined" && window.opener != null;

  const showJwtLogin = authenticationMethod === "jwt";
  const showOidcLogin = authenticationMethod === "oidc";
  const showUnknownAuth = authenticationMethod === "unknown";

  const shouldShowOidcButton = showOidcLogin && (isWeb || isExpoGo);
  const shouldAutoStartOidc =
    showOidcLogin &&
    isPointingToServer &&
    !isLoggedIn &&
    !oidcAutoStarted &&
    !isWeb &&
    !isExpoGo &&
    !isPopupWindow;

  async function loginWithJwt(): Promise<void> {
    if (!username.trim() || !password.trim()) {
      setLoginRequestStatus("failed");
      setLoginFeedback("Bitte Benutzername und Passwort eingeben.");
      return;
    }

    const basic = toBase64(`${username}:${password}`);
    const loginUrl = `${selectedBaseUrl}/api/user/login`;

    const response = await fetch(loginUrl, {
      method: "GET",
      headers: {
        Authorization: `Basic ${basic}`,
        Accept: "application/json",
      },
    });

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
    const oidcStartUrl = buildServerOidcStartUrl(selectedBaseUrl);

    if (!oidcStartUrl) {
      setLoginRequestStatus("failed");
      setLoginFeedback("OIDC-Start-URL fehlt.");
      return;
    }

    if (isWeb) {
      const popup = window.open(
        oidcStartUrl,
        "oidcLogin",
        "width=520,height=720,resizable=yes,scrollbars=yes,status=yes",
      );

      if (!popup) {
        setLoginRequestStatus("failed");
        setLoginFeedback("OIDC-Popup konnte nicht geöffnet werden.");
        return;
      }

      const bearer = await waitForOidcBearer(selectedBaseUrl, 60, 1000);

      if (!popup.closed) {
        popup.close();
      }

      if (!bearer) {
        setLoginRequestStatus("failed");
        setLoginFeedback(
          "OIDC-Anmeldung war erfolgreich, aber der Server hat noch keinen Bearer geliefert.",
        );
        return;
      }

      await dispatch(
        switchServer({
          url: selectedBaseUrl,
          providedJwt: bearer,
          initializeMenu: true,
        }),
      );

      setLoginRequestStatus("successful");
      setLoginFeedback(null);
      return;
    }

    const canOpen = await Linking.canOpenURL(oidcStartUrl);

    if (!canOpen) {
      setLoginRequestStatus("failed");
      setLoginFeedback("OIDC-Login-URL konnte nicht geöffnet werden.");
      return;
    }

    await WebBrowser.openBrowserAsync(oidcStartUrl);

    const bearer = await waitForOidcBearer(selectedBaseUrl, 20, 1000);

    if (!bearer) {
      setLoginRequestStatus("failed");
      setLoginFeedback(
        "OIDC-Anmeldung war erfolgreich, aber der Server hat noch keinen Bearer geliefert.",
      );
      return;
    }

    await dispatch(
      switchServer({
        url: selectedBaseUrl,
        providedJwt: bearer,
        initializeMenu: true,
      }),
    );

    setLoginRequestStatus("successful");
    setLoginFeedback(null);
  }

  async function login(): Promise<void> {
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
          setLoginFeedback(
            "Authentifizierungsmethode konnte nicht erkannt werden.",
          );
          return;
      }
    } catch (error: unknown) {
      console.error("[LOGIN SCREEN] login failed:", error);

      const msg =
        error instanceof Error
          ? error.message.toLowerCase()
          : String(error ?? "").toLowerCase();

      if (
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

  useEffect(() => {
    setOidcAutoStarted(false);
  }, [selectedBaseUrl, authenticationMethod]);

  useEffect(() => {
    if (shouldAutoStartOidc) {
      setOidcAutoStarted(true);
      void login();
    }
  }, [shouldAutoStartOidc]);

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
                  if (isPointingToServer && username && password) {
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

          {showOidcLogin && (
            <>
              <ThemedText style={localStyles.infoText}>
                {shouldShowOidcButton
                  ? "OpenID Connect erkannt. Bitte Anmeldung starten."
                  : "OpenID Connect erkannt. Weiterleitung zur Anmeldung läuft..."}
              </ThemedText>

              {shouldShowOidcButton && (
                <ActionButton
                  label="Mit OpenID anmelden"
                  variant="secondary"
                  onPress={() => {
                    void login();
                  }}
                  size="xs"
                />
              )}
            </>
          )}

          {showUnknownAuth && (
            <>
              <ThemedText style={localStyles.infoText}>
                Die Authentifizierungsmethode konnte noch nicht erkannt werden.
              </ThemedText>
              <ThemedText style={localStyles.infoSubText}>
                Bitte Server prüfen oder erneut verbinden.
              </ThemedText>
            </>
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

                  <View style={[styles.statusPill, styles.border]}>
                    <H4>
                      {isPointingToServer
                        ? t("serverReachable")
                        : t("serverNotReachable")}
                    </H4>
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
                  onChange={(v) => {
                    const next =
                      v === "system"
                        ? { adaptive: true, theme: themeInfo.theme }
                        : { adaptive: false, theme: v as "light" | "dark" };

                    dispatch(setTheme(next));
                  }}
                  size="xs"
                />
              </View>

              <View style={{ gap: 4 }}>
                <ThemedText style={localStyles.debugText}>
                  Auth: {authenticationMethod}
                </ThemedText>
                <ThemedText style={localStyles.debugText}>
                  Reachable: {String(isPointingToServer)}
                </ThemedText>
                {showOidcLogin && (
                  <>
                    <ThemedText style={localStyles.debugText}>
                      OIDC Start URL: {buildServerOidcStartUrl(selectedBaseUrl)}
                    </ThemedText>
                    <ThemedText style={localStyles.debugText}>
                      Popup: {String(isPopupWindow)}
                    </ThemedText>
                    <ThemedText style={localStyles.debugText}>
                      ExpoGo: {String(isExpoGo)}
                    </ThemedText>
                    <ThemedText style={localStyles.debugText}>
                      Web: {String(isWeb)}
                    </ThemedText>
                  </>
                )}
              </View>
            </ScrollView>
          )}
        </View>
      </View>

      {!!loginFeedback && (
        <View style={localStyles.feedbackWrap}>
          <Feather name={"alert-triangle"} size={15} color={"#dc2626"} />
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
  infoSubText: {
    textAlign: "center",
    fontSize: 12,
    opacity: 0.7,
  },
  debugText: {
    fontSize: 12,
    opacity: 0.7,
  },
});