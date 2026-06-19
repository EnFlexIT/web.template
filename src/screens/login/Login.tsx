//import
import React, { useEffect, useRef, useState } from "react";
import {Platform, Pressable, ScrollView, StyleSheet as NativeStyleSheet,View,} from "react-native";
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
import {selectAuthenticationMethod,selectIp,switchServer,} from "../../redux/slices/apiSlice";
import { ServerModal } from "./ServerModal";
import { selectLanguage, setLanguage } from "../../redux/slices/languageSlice";
import { selectThemeInfo, setTheme } from "../../redux/slices/themeSlice";
import { styles } from "./styles";
import { H4 } from "../../components/stylistic/H4";
import { ActionButton } from "../../components/ui-elements/ActionButton";
import { Card } from "../../components/ui-elements/Card";
import { TextInput } from "../../components/ui-elements/TextInput";
import { dispatchServerStatusRefresh } from "../../util/serverStatusRefresh";
import { setServerStatus } from "../../redux/slices/serverStatusSlice";
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Helper function to convert a string to Base64, compatible with both browser and Node.js environments

function toBase64(str: string): string {
  return typeof btoa !== "undefined"
    ? btoa(str)
    : Buffer.from(str).toString("base64");
}
// Helper function to extract a Bearer token from a string, used to handle different server responses that might include the token in headers or body in various formats
function extractBearerToken(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const match = value.match(/Bearer\s+(.+)/i);
  return match?.[1]?.trim() ?? null;
}
// Helper function to normalize the base URL by removing any trailing slashes and any "/login" suffix, used to ensure consistent URL formatting when making API calls and initiating OIDC login
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
// Helper function to build the OIDC start URL by normalizing the base URL and appending the necessary path, used when initiating OIDC login
function buildServerOidcStartUrl(baseUrl: string): string {
  return `${normalizeBaseUrl(baseUrl)}/login`;
}
// Helper function to create a delay, used for polling the server for the OIDC bearer token after initiating login in a popup
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
// Helper function to fetch the OIDC bearer token from the server by calling the settings endpoint, used for both initial check on component mount and for polling after initiating OIDC login in a popup
async function fetchOidcAuthenticatedFromServer(
  baseUrl: string,
): Promise<boolean> {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);

  const response = await fetch(`${normalizedBaseUrl}/api/app/settings/get`, {
    method: "GET",
    cache: "no-store",
    credentials: "include",
    redirect: "manual",
    headers: {
      Accept: "application/json",
    },
  });

  if (response.status === 400) {
    const text = await response.text();

    if (text.toLowerCase().includes("duplicate sessions")) {
      throw new Error("duplicate_sessions");
    }

    return false;
  }

  if (
    response.status === 301 ||
    response.status === 302 ||
    response.status === 303 ||
    response.status === 307 ||
    response.status === 308 ||
    response.type === "opaqueredirect"
  ) {
    return false;
  }

  if (!response.ok) {
    return false;
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

  console.log("[OIDC LOGIN] authenticated:", authenticated);

  return authenticated;
}
// Helper function that repeatedly tries to fetch the OIDC bearer token from the server with a delay between attempts, used for polling after initiating OIDC login in a popup
async function waitForOidcAuthenticated(
  baseUrl: string,
  retries = 90,
  delayMs = 1000,
): Promise<boolean> {
  for (let i = 0; i < retries; i += 1) {
    try {
      const authenticated = await fetchOidcAuthenticatedFromServer(baseUrl);

      if (authenticated) {
        return true;
      }
    } catch (error) {
      if (error instanceof Error && error.message === "duplicate_sessions") {
        throw error;
      }
    }

    await sleep(delayMs);
  }

  return false;
}
//******************************************************************************************************************************** */
export function LoginScreen() {
  // Redux state and dispatch and other hooks used in the component   
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
   styles.useVariants({ highlight });
  const [folded, setFolded] = useState(true);
  const [orgModalOpen, setOrgModalOpen] = useState(false);
  const [oidcLoginInProgress, setOidcLoginInProgress] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const shouldPromptPasswordChange = username.trim().toLowerCase() === "admin" && password === "admin";
  const [loginRequestIssued, setLoginRequestIssued] = useState(false);
  const [loginRequestStatus, setLoginRequestStatus] = useState< "loading" | "successful" | "failed" >("loading");
  const [loginFeedback, setLoginFeedback] = useState<string | null>(null);
  const mutedTextStyle = { color: theme.colors.text, opacity: 0.75 };
  const languageOptions = {de: "Deutsch", en: "English",} as const;
  const themeOptions = { system: t("system"),light: t("light"), dark: t("dark"),} as const;
  const currentThemeValue: keyof typeof themeOptions = themeInfo.adaptive? "system": themeInfo.theme;
  const isWeb = Platform.OS === "web";
  const showJwtLogin = authenticationMethod === "jwt";
  const showUnknownAuth = authenticationMethod === "unknown";
  const basic = toBase64(`${username}:${password}`);
  const loginUrl = `${normalizeBaseUrl(selectedBaseUrl)}/api/user/login`;
  const isExpoWeb =isWeb && typeof window !== "undefined" &&window.location.origin.includes("localhost:8081");
  const autoOidcDoneRef = useRef(false);


/******************************************************************************************************************************************** */
// Function to mark the selected server as logged in by updating its status in the Redux store, used after a successful login to provide visual feedback in the UI
const markSelectedServerLoggedIn = () => {
  const serverId =
    selectedServer?.id && selectedServer.id !== "local"
      ? selectedServer.id
      : selectedServerId || "local";

  dispatch(
    setServerStatus({
      serverId,
      status: {
        tone: "green",
        subtitle: t("einloggt"),
      },
    }),
  );
};
// Effect to automatically attempt OIDC login on component mount if OIDC is the selected authentication method, and to prevent multiple attempts using a ref flag
useEffect(() => {
  if (authenticationMethod !== "oidc") return;
  if (autoOidcDoneRef.current) return;

  autoOidcDoneRef.current = true;

  const run = async () => {
    const authenticated = await fetchOidcAuthenticatedFromServer(selectedBaseUrl);

    if (!authenticated) {
      autoOidcDoneRef.current = false;
      return;
    }

    await dispatch(
      switchServer({
        url: selectedBaseUrl,
        initializeMenu: !isExpoWeb,
      }),
    );

    markSelectedServerLoggedIn();
    dispatchServerStatusRefresh();

    setLoginRequestStatus("successful");
    setLoginFeedback(null);
  };

  void run();
}, [authenticationMethod, selectedBaseUrl, dispatch, isExpoWeb]);


// Helper function to check if the selected server's origin matches the web app's origin, used to determine if OIDC login can be performed in a popup or needs to fallback to redirect
function isSameOriginAsSelectedServer(): boolean {
  if (!isWeb || typeof window === "undefined") return false;

  try {
    return new URL(normalizeBaseUrl(selectedBaseUrl)).origin === window.location.origin;
  } catch {
    return false;
  }
}
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
        cache: "no-store",
        credentials: "include",
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
    markSelectedServerLoggedIn();
console.log("[LOGIN] set green");
      dispatchServerStatusRefresh();

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
      const sameOrigin = isSameOriginAsSelectedServer();

      // Server normal auf 8080 geöffnet -> KEIN Popup
      if (sameOrigin) {
        window.location.href = oidcStartUrl;
        return;
      }

      // Expo 8081 -> Server 8080 -> Popup nötig
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

            const authenticated = await waitForOidcAuthenticated(
          selectedBaseUrl,
          90,
          1000,
        );

        if (!authenticated) {
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
              initializeMenu: !isExpoWeb,
            }),
        );
       markSelectedServerLoggedIn();
        dispatchServerStatusRefresh();
      
        console.log("[LOGIN] set green");
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

              {oidcLoginInProgress}
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