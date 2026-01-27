// src/screens/login/Login.tsx

import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  TextInput,
  View,
  StyleSheet as NativeStyleSheet,
} from "react-native";

import { useUnistyles } from "react-native-unistyles";
import { useTranslation } from "react-i18next";

import { Dropdown } from "../../components/ui-elements/Dropdown";
import { Logo } from "../../components/Logo";
import { H1 } from "../../components/stylistic/H1";
import { Text } from "../../components/stylistic/Text";
import { StylisticTextInput } from "../../components/stylistic/StylisticTextInput";
import { ThemedAntDesign } from "../../components/themed/ThemedAntDesign";
import { ThemedText } from "../../components/themed/ThemedText";

import { useAppDispatch } from "../../hooks/useAppDispatch";
import { useAppSelector } from "../../hooks/useAppSelector";

import { selectServers } from "../../redux/slices/serverSlice";
import {
  selectApi,
  selectAuthenticationMethod,
  selectIp,
  login as reduxLogin,
} from "../../redux/slices/apiSlice";

import { ServerModal } from "./ServerModal";

import { selectLanguage, setLanguage } from "../../redux/slices/languageSlice";
import { selectThemeInfo, setTheme } from "../../redux/slices/themeSlice";
import { initializeMenu } from "../../redux/slices/menuSlice";

import { styles } from "./styles";
import { H4 } from "../../components/stylistic/H4";
import { ActionButton } from "../../components/ui-elements/ActionButton";
import { Card } from "../../components/ui-elements/Card";

// ---------- component ----------
export function LoginScreen() {
  const { t } = useTranslation(["Login"]);
  const dispatch = useAppDispatch();

  // Unistyles theme (safe as long as index.tsx only calls useUnistyles after boot)
  const { theme } = useUnistyles();

  // api
  const authenticationMethod = useAppSelector(selectAuthenticationMethod);
  const { isPointingToServer, awb_rest_api } = useAppSelector(selectApi);
  const ip = useAppSelector(selectIp);

  // settings
  const language = useAppSelector(selectLanguage);
  const themeInfo = useAppSelector(selectThemeInfo);

  // servers
  const serversState = useAppSelector(selectServers);
  const servers = serversState?.servers ?? [];
  const selectedServerId = serversState?.selectedServerId ?? "local";
  const selectedServer = servers.find((s) => s.id === selectedServerId);
  const selectedBaseUrl = selectedServer?.baseUrl ?? ip;

  // UI states
  const [highlight, setHighlight] = useState(false);
  const [folded, setFolded] = useState(true);
  const [orgModalOpen, setOrgModalOpen] = useState(false);

  // Login form
  const usernameFieldRef = useRef<TextInput>(null);
  const passwordFieldRef = useRef<TextInput>(null);
  const loginButtonRef = useRef<View>(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Login feedback
  const [loginRequestIssued, setLoginRequestIssued] = useState(false);
  const [loginRequestStatus, setLoginRequestStatus] = useState<
    "loading" | "successful" | "failed"
  >("loading");

  styles.useVariants({ highlight });

  async function login() {
    setLoginRequestIssued(true);
    setLoginRequestStatus("loading");

    switch (authenticationMethod) {
      case "jwt": {
        try {
          const response = await awb_rest_api.userApi.loginUser({
            auth: { username, password },
          });

          if (response.status === 200) {
            const www_authenticate = response.headers[
              "www-authenticate"
            ] as string;
            const bearerToken = (www_authenticate ?? "").split(" ")[1];

            if (bearerToken) {
              dispatch(reduxLogin(bearerToken));
              await dispatch(initializeMenu());
              setLoginRequestStatus("successful");
              return;
            }
          }

          setLoginRequestStatus("failed");
        } catch {
          setLoginRequestStatus("failed");
        }
        break;
      }

      case "oidc": {
        console.warn(
          "Login called while authenticationMethod=oidc. Implement OIDC flow here.",
        );
        setLoginRequestStatus("failed");
        break;
      }
    }
  }

  const mutedTextStyle = { color: theme.colors.text, opacity: 0.75 };

  // Dropdown options (typed)
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

  // ---------- render ----------
  return (
    <View style={[styles.container]}>
      {/* MAIN CARD */}
      <View style={[styles.widget, styles.border]}>
        {/* Title */}
        <View style={[styles.titleContainer]}>
          <Logo style={logoStyles.logo} />
          <H1>{process.env.EXPO_PUBLIC_APPLICATION_TITLE}</H1>
        </View>

        {/* Inputs */}
        <View style={[styles.upperHalf]}>
          <StylisticTextInput
            ref={usernameFieldRef}
            style={[styles.border, styles.padding]}
            placeholder={t("username_placeholder")}
            onSubmitEditing={() => passwordFieldRef.current?.focus()}
            textContentType="username"
            onChangeText={setUsername}
            value={username}
          />

          <StylisticTextInput
            ref={passwordFieldRef}
            style={[styles.border, styles.padding]}
            placeholder={t("password_placeholder")}
            onSubmitEditing={() => {
              if (isPointingToServer && username && password) {
                login();
              } else {
                loginButtonRef.current?.focus();
              }
            }}
            textContentType="password"
            secureTextEntry
            onChangeText={setPassword}
            value={password}
          />

          {/* Login Button */}
          {isPointingToServer ? (
           <ActionButton
            label={t("login")}
            variant="secondary"
            onPress={login}
            />
          ) : (
            <View style={[styles.border, styles.padding, styles.loginContainer]}>
              <H4>{t("unableToFindServer")}</H4>
            </View>
          )}
        </View>

        {/* ADVANCED */}
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
              {/* Change Organization / Server */}
              <Card onPress={() => setOrgModalOpen(true)} padding="none">
                  <View style={[styles.serverBadge, { gap: 1 }]}>
                  <View style={{ flex: 1, gap: 1 }}>
                  <H4>{t("currentServer")}</H4>
                  <Text style={[mutedTextStyle]} numberOfLines={1}>
                  {selectedBaseUrl || "-"}
                  </Text>
                  </View>


                  <View style={[styles.statusPill, styles.border]}>
                  <H4>
                  {isPointingToServer ? t("serverReachable") : t("serverNotReachable")}
                  </H4>
                  </View>
                  </View>
                  </Card>

              {/* Language (Dropdown) */}
              <View style={{ gap: 6 }}>
                <ThemedText>{t("lng")}:</ThemedText>
                <Dropdown<"de" | "en">
                  value={(language.language as "de" | "en") ?? "de"}
                  options={languageOptions}
                  onChange={(lng) => dispatch(setLanguage({ language: lng }))}
                />
              </View>

              {/* Theme (Dropdown) */}
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
                />
              </View>
            </ScrollView>
          )}
        </View>
      </View>

      {/* STATUS INDICATOR */}
      <LoginRequestStatusIndicator
        issued={loginRequestIssued}
        status={loginRequestStatus}
      />

      {/* MODAL */}
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
    <View style={[styles.loginRequestIndicatorContainer]}>
      <ThemedText>{t("failed")}</ThemedText>
      <ThemedAntDesign name="close" />
    </View>
  );
}

const logoStyles = NativeStyleSheet.create({
  logo: {
    resizeMode: "contain",
    width: 38,
    height: 38,
  },
});