// src/screens/login/Login.tsx

import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  TextInput as RNTextInput,
  View,
 StyleSheet as NativeStyleSheet,
} from "react-native";
import { withUnistyles } from "react-native-unistyles";
import Feather_ from "@expo/vector-icons/Feather";
import { useUnistyles } from "react-native-unistyles";
import { useTranslation } from "react-i18next";
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

// ---------- helpers ----------
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

// ---------- component ----------
export function LoginScreen() {
  const { t } = useTranslation(["Login"]);
  const dispatch = useAppDispatch();
  const Feather = withUnistyles(Feather_);
  const { theme } = useUnistyles();
  const authenticationMethod = useAppSelector(selectAuthenticationMethod);
  const { isPointingToServer } = useAppSelector(selectApi);
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

  const passwordFieldRef = useRef<RNTextInput>(null);
  const loginButtonRef = useRef<View>(null);

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

  async function login() {
    setLoginRequestIssued(true);
    setLoginRequestStatus("loading");
    setLoginFeedback(null);

    if (!username.trim() || !password.trim()) {
      setLoginRequestStatus("failed");
      setLoginFeedback("Bitte Benutzername und Passwort eingeben.");
      return;
    }

    switch (authenticationMethod) {
      case "jwt": {
        try {
          const basic = toBase64(`${username}:${password}`);
          const loginUrl = `${selectedBaseUrl}/api/user/login`;

          console.log("[LOGIN SCREEN] selectedBaseUrl:", selectedBaseUrl);
          console.log("[LOGIN SCREEN] loginUrl:", loginUrl);

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
            console.log(
              "[LOGIN SCREEN] switching to server with token:",
              selectedBaseUrl,
            );

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
        } catch (error: any) {
          console.error("[LOGIN SCREEN] login failed:", error);

          const msg = String(error?.message ?? "").toLowerCase();

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
        break;
      }

      case "oidc": {
        console.warn(
          "Login called while authenticationMethod=oidc. Implement OIDC flow here.",
        );
        setLoginRequestStatus("failed");
        setLoginFeedback("OIDC-Login ist aktuell noch nicht verfügbar.");
        break;
      }
    }
  }

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

  return (
    <View style={[styles.container]}>
      <View style={[styles.widget, styles.border]}>
        <View style={[styles.titleContainer]}>
          <Logo style={logoStyles.logo} />
          <H1>{process.env.EXPO_PUBLIC_APPLICATION_TITLE}</H1>
        </View>

     
        <View style={[styles.upperHalf]}>
          <TextInput
            size="sm"
            style={[styles.border, styles.padding]}
            placeholder={t("username_placeholder")}
            textContentType="username"
            onChangeText={(value) => {
              setUsername(value);
              setLoginFeedback(null);
            }}
            value={username}
            returnKeyType="next"
            onSubmitEditing={() => passwordFieldRef.current?.focus()}
          />

          <TextInput
            size="sm"
            style={[styles.border, styles.padding]}
            placeholder={t("password_placeholder")}
            textContentType="password"
            passwordToggle
            onChangeText={(value) => {
              setPassword(value);
              setLoginFeedback(null);
            }}
            value={password}
            returnKeyType="done"
            onSubmitEditing={() => {
              if (isPointingToServer && username && password) {
                login();
              } else {
                // @ts-ignore
                loginButtonRef.current?.focus?.();
              }
            }}
          />

          <ActionButton
            label={t("login")}
            variant="secondary"
            onPress={login}
            size="xs"
            

          />
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
            </ScrollView>
          )}
        </View>
      </View>
   {!!loginFeedback && (
          <View style={localStyles.feedbackWrap}>
             <Feather
                  name={"alert-triangle"}
                  size={15}
                  color={"#dc2626"}
              />
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

  return (
   null
  );
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
    borderWidth:1,
    flexDirection:"row",
    borderColor:"#dc2626",
    alignItems: "center",
    gap:6,
    padding:5
  },
  feedbackText: {
    color: "#dc2626",
    fontSize: 13,
    textAlign: "center",
   
  },
});