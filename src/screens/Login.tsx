// /**
//  * this route does not live under the layout component for reasons further explained in router/router.tsx
//  * because of that, we need to apply manual styling to the overall feel page.
//  *
//  * this is exclusive to login
//  */

import { StyleSheet, withUnistyles } from "react-native-unistyles";
import { ThemedView } from "../components/themed/ThemedView";
import {
  ImageBackgroundComponent,
  Pressable,
  TextInput,
  View,
  StyleSheet as NativeStyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { H1 } from "../components/stylistic/H1";
import { Logo } from "../components/Logo";
import { StylisticTextInput } from "../components/stylistic/StylisticTextInput";
import { useTranslation } from "react-i18next";
import { Text } from "../components/stylistic/Text";
import { useRef, useState } from "react";
import { Screen } from "../components/Screen";
import { useAppSelector } from "../hooks/useAppSelector";
// import { useApi } from "../components/provider/ApiProvider"
import { useAppDispatch } from "../hooks/useAppDispatch";
import {
  selectApi,
  selectAuthenticationMethod,
  login as reduxLogin,
  selectIp,

} from "../redux/slices/apiSlice";
import { ThemedAntDesign } from "../components/themed/ThemedAntDesign";
import { ThemedText } from "../components/themed/ThemedText";
import { selectLanguage, setLanguage } from "../redux/slices/languageSlice";
import { selectTheme, setTheme } from "../redux/slices/themeSlice";
import { Picker } from "@react-native-picker/picker";
import { initializeMenu } from "../redux/slices/menuSlice";
import { setReady } from "../redux/slices/readySlice";


export function LoginScreen() {
  const { t } = useTranslation(["Login"]);
  const [highlight, setHighlight] = useState(false);
  const dispatch = useAppDispatch();
  const authenticationMethod = useAppSelector(selectAuthenticationMethod);
  const { isPointingToServer } = useAppSelector(selectApi);

  styles.useVariants({
    highlight: highlight,
  });

  const usernameFieldRef = useRef<TextInput>(null);
  const passwordFieldRef = useRef<TextInput>(null);
  const loginButtonRef = useRef<View>(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const { awb_rest_api } = useAppSelector(selectApi);

  const [folded, setFolded] = useState(true);

  const language = useAppSelector(selectLanguage);
  const theme = useAppSelector(selectTheme);
  const ip = useAppSelector(selectIp);

  // Remembers wether a login request has been made or not
  // controls if the progress notification is shown
  const [loginRequestIssued, setLoginRequestIssued] = useState(false);
  // Assuming a request has been made, this state indicates how the request is doing
  const [loginRequestStatus, setLoginRequestStatus] = useState<
    "loading" | "successful" | "failed"
  >("loading");

  const [ipField, setIpField] = useState(ip);

  async function login() {
    switch (authenticationMethod) {
      case "jwt": {
        try {
          const response = await awb_rest_api.userApi.loginUser({
            auth: {
              password: password,
              username: username,
            },
          });
          if (response.status === 200) {
            const www_authenticate = response.headers[
              "www-authenticate"
            ] as string;
            const bearerToken = www_authenticate.split(" ")[1];
            dispatch(reduxLogin(bearerToken));
          }
        } catch (e) {
          setLoginRequestStatus("failed");
        }

        break;
      }
      case "oidc": {
        console.warn(
          "login has been called while the authenticationMethod=oidc. this should never be the case and needs investigation",
        );
        break;
      }
    }
  }

  return (
    <View style={[styles.container]}>
      <View>
        <View style={[styles.widget, styles.border]}>
          <View style={[styles.upperHalf]}>
            <View style={[styles.titleContainer]}>
              <Logo style={logoStyles.logo} />
              <H1>{process.env.EXPO_PUBLIC_APPLICATION_TITLE}</H1>
            </View>
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
                // If username is not empty and password is not empty, instead of focusing login button, just login directly
                if (isPointingToServer && username && password) {
                  login();
                  setLoginRequestIssued(true);
                } else {
                  loginButtonRef.current?.focus();
                }
              }}
              textContentType="password"
              secureTextEntry
              onChangeText={setPassword}
              value={password}
            />
            {isPointingToServer ? (
              <Pressable
                ref={loginButtonRef}
                style={[styles.border, styles.padding, styles.loginContainer]}
                onHoverIn={() => setHighlight(true)}
                onHoverOut={() => setHighlight(false)}
                onFocus={() => setHighlight(true)}
                onPress={() => {
                  setHighlight(false);
                  login();
                  setLoginRequestIssued(true);
                }}
              >
                <Text style={[styles.login]}>{t("login")}</Text>
              </Pressable>
            ) : (
              <View
                style={[styles.border, styles.padding, styles.loginContainer]}
              >
                <Text style={[styles.login]}>{t("unableToFindServer")}</Text>
              </View>
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
              <ScrollView
                contentContainerStyle={[styles.advancedItemsContainer]}
              >
                <View>
                  <ThemedText>{t("lng")}:</ThemedText>
                  <Picker
                    selectedValue={language.language}
                    onValueChange={(itemValue) =>
                      dispatch(
                        setLanguage({
                          language: itemValue,
                        }),
                      )
                    }
                  >
                    <Picker.Item label="Deutsch" value="de" />
                    <Picker.Item label="Englisch" value="en" />
                  </Picker>
                </View>
                <View>
                  <ThemedText>{t("color-scheme")}:</ThemedText>
                  <Picker
                    selectedValue={
                      theme.val.adaptive ? "system" : theme.val.theme
                    }
                    onValueChange={(itemValue) => {
                      dispatch(
                        setTheme({
                          val: {
                            adaptive: itemValue === "system" ? true : false,
                            theme:
                              itemValue === "system"
                                ? theme.val.theme
                                : itemValue,
                          },
                        }),
                      );
                    }}
                  >
                    <Picker.Item label={t("system")} value="system" />
                    <Picker.Item label={t("light")} value="light" />
                    <Picker.Item label={t("dark")} value="dark" />
                  </Picker>
                </View>
                <View>
                  <Pressable
                    onPress={() => dispatch(setReady({ ready: false }))}
                  >
                    <ThemedText>Change Organizations</ThemedText>
                  </Pressable>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </View>
      <LoginRequestStatusIndicator
        issued={loginRequestIssued}
        status={loginRequestStatus}
      />
    </View>
  );
}

interface LoginRequestStatusIndicatorProps {
  issued: boolean;
  status: "loading" | "successful" | "failed";
}
function LoginRequestStatusIndicator({
  issued,
  status,
}: LoginRequestStatusIndicatorProps) {
  styles.useVariants({ status: status });
  const { t } = useTranslation(["Login"]);

  if (!issued) {
    return undefined;
  }

  if (status === "loading") {
    return (
      <View style={[styles.loginRequestIndicatorContainer]}>
        <ThemedText>{t("loading")}</ThemedText>
        <ActivityIndicator />
      </View>
    );
  } else if (status === "successful") {
    return (
      <View style={[styles.loginRequestIndicatorContainer]}>
        <ThemedText>{t("successful")}</ThemedText>
        <ThemedAntDesign name="check" />
      </View>
    );
  } else {
    return (
      <View style={[styles.loginRequestIndicatorContainer]}>
        <ThemedText>{t("failed")}</ThemedText>
        <ThemedAntDesign name="close" />
      </View>
    );
  }
}

const styles = StyleSheet.create((theme, rt) => ({
  loginRequestIndicatorContainer: {
    variants: {
      status: {
        loading: {},
        successful: {
          borderColor: "lightgreen",
        },
        failed: { borderColor: "red" },
      },
    },
    minWidth: 250,
    justifyContent: "space-around",
    alignItems: "center",
    padding: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    flexDirection: "row",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
    gap: 20,
  },
  widget: {
    padding: 10,
    backgroundColor: theme.colors.card,
    gap: 5,
    minWidth: 300,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    gap: 10,
  },
  logo: {
    tintColor: theme.colors.text,
  },
  padding: {
    padding: 5,
  },
  loginContainer: {
    variants: {
      highlight: {
        true: {
          backgroundColor: theme.colors.highlight,
        },
      },
    },
    justifyContent: "center",
    alignItems: "center",
  },
  login: {
    textAlign: "center",
    userSelect: "none",
  },
  border: {
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  upperHalf: {
    gap: 5,
  },
  lowerHalf: {
    gap: 5,
  },
  advancedSettingsTitleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    userSelect: "none",
  },
  advancedItemsContainer: {
    gap: 5,
  },
  advancedItemContainer: {},
}));

const logoStyles = NativeStyleSheet.create({
  logo: {
    resizeMode: "contain",
    width: 38,
    height: 38,
  },
});
