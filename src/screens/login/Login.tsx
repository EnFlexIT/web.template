import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet as NativeStyleSheet,
  View,
} from "react-native";

import { withUnistyles, useUnistyles } from "react-native-unistyles";
import Feather_ from "@expo/vector-icons/Feather";
import { useTranslation } from "react-i18next";
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

import {
  selectLanguage,
  setLanguage,
} from "../../redux/slices/languageSlice";

import {
  selectThemeInfo,
  setTheme,
} from "../../redux/slices/themeSlice";

import { styles } from "./styles";

import { H4 } from "../../components/stylistic/H4";
import { ActionButton } from "../../components/ui-elements/ActionButton";
import { Card } from "../../components/ui-elements/Card";
import { TextInput } from "../../components/ui-elements/TextInput";

type OidcSessionState =
  | {
      kind: "authenticated";
      bearer: string;
    }
  | {
      kind: "unauthenticated";
    }
  | {
      kind: "offline";
    };

function toBase64(str: string): string {
  return typeof btoa !== "undefined"
    ? btoa(str)
    : Buffer.from(str).toString("base64");
}

function extractBearerToken(
  value: unknown,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const match =
    value.match(/Bearer\s+(.+)/i);

  return (
    match?.[1]?.trim() ?? null
  );
}

function normalizeBaseUrl(
  url: unknown,
): string {
  return typeof url === "string"
    ? url
        .trim()
        .replace(/\/+$/, "")
    : "";
}

async function checkOidcSession(
  baseUrl: unknown,
): Promise<OidcSessionState> {
  const normalizedBaseUrl =
    normalizeBaseUrl(baseUrl);

  if (!normalizedBaseUrl) {
    return {
      kind: "offline",
    };
  }

  try {
    const response = await fetch(
      `${normalizedBaseUrl}/api/app/settings/get`,
      {
        method: "GET",
        cache: "no-store",
        credentials: "include",
        headers: {
          Accept:
            "application/json",
        },
      },
    );

    /*
     * Redirect bedeutet:
     * Server lebt,
     * aber nicht eingeloggt.
     */

    if (
      response.status === 303 ||
      response.redirected
    ) {
      return {
        kind:
          "unauthenticated",
      };
    }

    if (!response.ok) {
      return {
        kind: "offline",
      };
    }

    const data =
      await response.json();

    const entries = Array.isArray(
      data?.propertyEntries,
    )
      ? data.propertyEntries
      : [];

    const getValue = (
      key: string,
    ): unknown =>
      entries.find(
        (entry: any) =>
          entry?.key === key,
      )?.value;

    const authenticated =
      String(
        getValue(
          "_Authenticated",
        ),
      ).toLowerCase() ===
      "true";

    const bearer = getValue(
      "_oidc.bearer",
    );

    if (
      authenticated &&
      typeof bearer ===
        "string" &&
      bearer.length > 0
    ) {
      return {
        kind:
          "authenticated",
        bearer,
      };
    }

    return {
      kind:
        "unauthenticated",
    };
  } catch (error) {
    console.warn(
      "[OIDC SESSION CHECK]",
      error,
    );

    return {
      kind: "offline",
    };
  }
}

export function LoginScreen() {
  const { t } =
    useTranslation([
      "Login",
    ]);

  const dispatch =
    useAppDispatch();

  const Feather =
    withUnistyles(
      Feather_,
    );

  const { theme } =
    useUnistyles();

  const authenticationMethod =
    useAppSelector(
      selectAuthenticationMethod,
    );

  const {
    isLoggedIn,
  } = useAppSelector(
    selectApi,
  );

  const ip =
    useAppSelector(
      selectIp,
    );

  const language =
    useAppSelector(
      selectLanguage,
    );

  const themeInfo =
    useAppSelector(
      selectThemeInfo,
    );

  const serversState =
    useAppSelector(
      selectServers,
    );

  const servers =
    serversState?.servers ??
    [];

  const selectedServerId =
    serversState?.selectedServerId ??
    "local";

  const selectedServer =
    servers.find(
      (server) =>
        server.id ===
        selectedServerId,
    );

  const selectedBaseUrl =
    normalizeBaseUrl(
      selectedServer?.baseUrl ??
        ip,
    );

  const oidcStartedRef =
    useRef(false);

  const [highlight] =
    useState(false);

  const [folded, setFolded] =
    useState(true);

  const [
    orgModalOpen,
    setOrgModalOpen,
  ] = useState(false);

  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const shouldPromptPasswordChange =
    username
      .trim()
      .toLowerCase() ===
      "admin" &&
    password === "admin";

  const [
    loginRequestIssued,
    setLoginRequestIssued,
  ] = useState(false);

  const [
    loginRequestStatus,
    setLoginRequestStatus,
  ] = useState<
    | "loading"
    | "successful"
    | "failed"
  >("loading");

  const [
    loginFeedback,
    setLoginFeedback,
  ] = useState<
    string | null
  >(null);

  styles.useVariants({
    highlight,
  });

  const mutedTextStyle = {
    color:
      theme.colors.text,
    opacity: 0.75,
  };

  const languageOptions =
    {
      de: "Deutsch",
      en: "English",
    } as const;

  const themeOptions = {
    system:
      t("system"),
    light:
      t("light"),
    dark:
      t("dark"),
  } as const;

  const currentThemeValue:
    | "system"
    | "light"
    | "dark" =
    themeInfo.adaptive
      ? "system"
      : themeInfo.theme;

  const showJwtLogin =
    authenticationMethod ===
    "jwt";

  const showOidcLogin =
    authenticationMethod ===
    "oidc";

  const showUnknownAuth =
    authenticationMethod ===
    "unknown";

  async function loginWithJwt(): Promise<void> {
    if (
      !username.trim() ||
      !password.trim()
    ) {
      setLoginRequestStatus(
        "failed",
      );

      setLoginFeedback(
        t(
          "username_and_password_required",
        ),
      );

      return;
    }

    const basic =
      toBase64(
        `${username}:${password}`,
      );

    const loginUrl =
      `${selectedBaseUrl}/api/user/login`;

    const response =
      await fetch(loginUrl, {
        method: "GET",
        headers: {
          Authorization:
            `Basic ${basic}`,
          Accept:
            "application/json",
        },
      });

    const wwwAuthenticate =
      response.headers.get(
        "www-authenticate",
      ) ??
      response.headers.get(
        "WWW-Authenticate",
      ) ??
      response.headers.get(
        "authorization",
      ) ??
      response.headers.get(
        "Authorization",
      );

    const bodyText =
      await response.text();

    const bearerToken =
      extractBearerToken(
        wwwAuthenticate,
      ) ??
      extractBearerToken(
        bodyText,
      );

    if (
      response.status ===
        200 &&
      bearerToken
    ) {
      await dispatch(
        switchServer({
          url:
            selectedBaseUrl,
          providedJwt:
            bearerToken,
          initializeMenu: true,
        }),
      );

      if (
        shouldPromptPasswordChange
      ) {
        dispatch(
          openInitialPasswordChangeDialog(),
        );
      }

      setLoginRequestStatus(
        "successful",
      );

      setLoginFeedback(
        null,
      );

      return;
    }

    if (
      response.status ===
      401
    ) {
      setLoginRequestStatus(
        "failed",
      );

      setLoginFeedback(
        t(
          "invalid_credentials",
        ),
      );

      return;
    }

    setLoginRequestStatus(
      "failed",
    );

    setLoginFeedback(
      t("login_failed"),
    );
  }

async function loginWithOidc(): Promise<void> {
  if (!selectedBaseUrl) {
    setLoginRequestStatus("failed");

    setLoginFeedback(
      "Kein Server ausgewählt.",
    );

    return;
  }

  const sessionState =
    await checkOidcSession(
      selectedBaseUrl,
    );

  /*
   * Bereits eingeloggt
   */
  if (
    sessionState.kind ===
    "authenticated"
  ) {
    await dispatch(
      switchServer({
        url:
          selectedBaseUrl,
        providedJwt:
          sessionState.bearer,
        initializeMenu: true,
      }),
    );

    setLoginRequestStatus(
      "successful",
    );

    setLoginFeedback(
      null,
    );

    return;
  }

  /*
   * Server offline
   */
  if (
    sessionState.kind ===
    "offline"
  ) {
    setLoginRequestStatus(
      "failed",
    );

    setLoginFeedback(
      "Server nicht erreichbar.",
    );

    return;
  }

  /*
   * Nicht angemeldet:
   * Login im gleichen Fenster/WebView starten.
   *
   * WICHTIG:
   * - kein Popup
   * - kein Extra Fenster
   * - kein WebBrowser.openBrowserAsync
   * - kein /login
   */
  const oidcStartUrl =
    `${normalizeBaseUrl(selectedBaseUrl)}/`;

  window.location.href =
    oidcStartUrl;
}

  async function login(): Promise<void> {
    setLoginRequestIssued(
      true,
    );

    setLoginRequestStatus(
      "loading",
    );

    setLoginFeedback(
      null,
    );

    try {
      if (
        authenticationMethod ===
        "jwt"
      ) {
        await loginWithJwt();

        return;
      }

      await loginWithOidc();
    } catch (error) {
      console.error(
        "[LOGIN SCREEN]",
        error,
      );

      setLoginRequestStatus(
        "failed",
      );

      setLoginFeedback(
        "Anmeldung fehlgeschlagen.",
      );
    }
  }

  useEffect(() => {
    oidcStartedRef.current =
      false;
  }, [selectedBaseUrl]);

  useEffect(() => {
    if (isLoggedIn)
      return;

    if (
      !selectedBaseUrl
    )
      return;

    if (
      showJwtLogin
    )
      return;

    if (
      !showOidcLogin &&
      !showUnknownAuth
    )
      return;

    if (
      oidcStartedRef.current
    )
      return;

    oidcStartedRef.current =
      true;

    setLoginRequestIssued(
      true,
    );

    setLoginRequestStatus(
      "loading",
    );

    setLoginFeedback(
      null,
    );

    void loginWithOidc();
  }, [
    isLoggedIn,
    selectedBaseUrl,
    showJwtLogin,
    showOidcLogin,
    showUnknownAuth,
  ]);

  return (
    <View
      style={[
        styles.container,
      ]}
    >
      <View
        style={[
          styles.widget,
          styles.border,
        ]}
      >
        <View
          style={[
            styles.titleContainer,
          ]}
        >
          <Logo
            style={
              logoStyles.logo
            }
          />

          <H1>
            {
              process.env
                .EXPO_PUBLIC_APPLICATION_TITLE
            }
          </H1>
        </View>

        <View
          style={[
            styles.upperHalf,
          ]}
        >
          {showJwtLogin && (
            <>
              <TextInput
                size="sm"
                style={[
                  styles.border,
                  styles.padding,
                ]}
                placeholder={t(
                  "username_placeholder",
                )}
                textContentType="username"
                onChangeText={(
                  value: string,
                ) => {
                  setUsername(
                    value,
                  );

                  setLoginFeedback(
                    null,
                  );
                }}
                value={
                  username
                }
                returnKeyType="next"
              />

              <TextInput
                size="sm"
                style={[
                  styles.border,
                  styles.padding,
                ]}
                placeholder={t(
                  "password_placeholder",
                )}
                textContentType="password"
                secureTextEntry
                passwordToggle
                onChangeText={(
                  value: string,
                ) => {
                  setPassword(
                    value,
                  );

                  setLoginFeedback(
                    null,
                  );
                }}
                value={
                  password
                }
                returnKeyType="done"
                onSubmitEditing={() => {
                  if (
                    username &&
                    password
                  ) {
                    void login();
                  }
                }}
              />

              <ActionButton
                label={t(
                  "login",
                )}
                variant="secondary"
                onPress={() => {
                  void login();
                }}
                size="xs"
              />
            </>
          )}

          {!showJwtLogin && (
            <View
              style={
                localStyles.oidcLoading
              }
            >
              <ThemedText
                style={
                  localStyles.infoText
                }
              >
                OIDC Session wird geprüft...
              </ThemedText>

              <ActivityIndicator />

              {!!loginFeedback && (
                <ThemedText
                  style={
                    localStyles.feedbackText
                  }
                >
                  {
                    loginFeedback
                  }
                </ThemedText>
              )}
            </View>
          )}
        </View>

        <View
          style={[
            styles.lowerHalf,
          ]}
        >
          <Pressable
            style={[
              styles.advancedSettingsTitleContainer,
            ]}
            onPress={() =>
              setFolded(
                !folded,
              )
            }
          >
            <Text>
              {t(
                "advanced_options",
              )}
            </Text>

            <ThemedAntDesign
              name={
                folded
                  ? "down"
                  : "up"
              }
            />
          </Pressable>

          {!folded && (
            <ScrollView
              contentContainerStyle={[
                styles.advancedItemsContainer,
              ]}
            >
              <Card
                onPress={() =>
                  setOrgModalOpen(
                    true,
                  )
                }
                padding="none"
              >
                <View
                  style={[
                    styles.serverBadge,
                    {
                      gap: 1,
                    },
                  ]}
                >
                  <View
                    style={{
                      flex: 1,
                      gap: 1,
                    }}
                  >
                    <H4
                      style={{
                        fontWeight:
                          "bold",
                      }}
                    >
                      {selectedServer?.name ??
                        t(
                          "unknownServer",
                        )}
                    </H4>

                    <Text
                      style={[
                        mutedTextStyle,
                      ]}
                      numberOfLines={
                        1
                      }
                    >
                      {selectedBaseUrl ||
                        "-"}
                    </Text>
                  </View>
                </View>
              </Card>

              <View
                style={{
                  gap: 6,
                }}
              >
                <ThemedText>
                  {t(
                    "lng",
                  )}
                  :
                </ThemedText>

                <Dropdown<
                  | "de"
                  | "en"
                >
                  value={
                    (language.language as
                      | "de"
                      | "en") ??
                    "de"
                  }
                  options={
                    languageOptions
                  }
                  onChange={(
                    lng,
                  ) =>
                    dispatch(
                      setLanguage(
                        {
                          language:
                            lng,
                        },
                      ),
                    )
                  }
                  size="xs"
                />
              </View>

              <View
                style={{
                  gap: 6,
                }}
              >
                <ThemedText>
                  {t(
                    "color-scheme",
                  )}
                  :
                </ThemedText>

                <Dropdown<
                  | "system"
                  | "light"
                  | "dark"
                >
                  value={
                    currentThemeValue
                  }
                  options={
                    themeOptions
                  }
                  onChange={(
                    value,
                  ) => {
                    if (
                      value ===
                      "system"
                    ) {
                      dispatch(
                        setTheme(
                          {
                            adaptive:
                              true,
                            theme:
                              themeInfo.theme,
                          },
                        ),
                      );

                      return;
                    }

                    dispatch(
                      setTheme(
                        {
                          adaptive:
                            false,
                          theme:
                            value,
                        },
                      ),
                    );
                  }}
                  size="xs"
                />
              </View>
            </ScrollView>
          )}
        </View>
      </View>

      {!!loginFeedback &&
        showJwtLogin && (
          <View
            style={
              localStyles.feedbackWrap
            }
          >
            <Feather
              name="alert-triangle"
              size={15}
              color="#dc2626"
            />

            <ThemedText
              style={
                localStyles.feedbackText
              }
            >
              {
                loginFeedback
              }
            </ThemedText>
          </View>
        )}
    </View>
  );
}

const logoStyles =
  NativeStyleSheet.create(
    {
      logo: {
        resizeMode:
          "contain",
        width: 38,
        height: 38,
      },
    },
  );

const localStyles =
  NativeStyleSheet.create(
    {
      feedbackWrap: {
        borderWidth: 1,
        flexDirection:
          "row",
        borderColor:
          "#dc2626",
        alignItems:
          "center",
        gap: 6,
        padding: 5,
      },

      feedbackText: {
        color:
          "#dc2626",
        fontSize: 13,
        textAlign:
          "center",
      },

      infoText: {
        textAlign:
          "center",
        fontSize: 14,
      },

      oidcLoading: {
        gap: 8,
        alignItems:
          "center",
      },
    },
  );