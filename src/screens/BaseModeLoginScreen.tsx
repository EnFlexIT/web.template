// src/screens/BaseModeLogin.tsx
import React, { useEffect, useRef, useState } from "react";
import { View, ImageBackground, Pressable } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { useAppDispatch } from "../hooks/useAppDispatch";
import { useAppSelector } from "../hooks/useAppSelector";

import {
  login as reduxLogin,
  selectApi,
  selectAuthenticationMethod,
  selectIsPointingToServer,
  selectIp,
} from "../redux/slices/apiSlice";
import { initializeMenu } from "../redux/slices/menuSlice";

import { H1 } from "../components/stylistic/H1";
import { Text } from "../components/stylistic/Text";
import { StylisticTextInput } from "../components/stylistic/StylisticTextInput";

const bg = require("../../assets/enflex-water.png");

export function BaseModeLoginScreen() {
  const dispatch = useAppDispatch();

  const { awb_rest_api } = useAppSelector(selectApi);
  const authenticationMethod = useAppSelector(selectAuthenticationMethod);
  const isPointingToServer = useAppSelector(selectIsPointingToServer);
  const ip = useAppSelector(selectIp);

  const usernameFieldRef = useRef<any>(null);
  const passwordFieldRef = useRef<any>(null);

  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [status, setStatus] = useState<"idle" | "loading" | "failed">("idle");

  useEffect(() => {
    const t = setTimeout(() => passwordFieldRef.current?.focus?.(), 250);
    return () => clearTimeout(t);
  }, []);

  async function doLogin() {
    if (!isPointingToServer) return;

    setStatus("loading");

    try {
      if (authenticationMethod !== "jwt") {
        console.warn("BaseModeLogin: authMethod ist nicht jwt – bitte prüfen.");
        setStatus("failed");
        return;
      }

      const response = await awb_rest_api.userApi.loginUser({
        auth: { username, password },
      });

      if (response.status === 200) {
        const www_authenticate = response.headers["www-authenticate"] as string;
        const bearerToken = www_authenticate?.split(" ")?.[1];

        if (!bearerToken) {
          setStatus("failed");
          return;
        }

        await dispatch(reduxLogin(bearerToken));
        await dispatch(initializeMenu());
        return;
      }

      setStatus("failed");
    } catch (e) {
      setStatus("failed");
    }
  }

  const disabled = !isPointingToServer || !username || !password || status === "loading";

  return (
    <ImageBackground source={bg} resizeMode="stretch" style={styles.bg}>
      {/* dunkler Overlay + leichter Blur-Look */}
      <View style={styles.overlay} />

      <View style={styles.center}>
        {/* Glass Card */}
        <View style={styles.card}>
          <View style={styles.badgeRow}>
            <View style={styles.badgeDot} />
            <Text style={styles.badgeText}>Base Mode</Text>
          </View>

          <H1>EnFlex Base Login</H1>
          <Text style={styles.subtitle}>
            Lokales Gerät erkannt: <Text style={styles.mono}>{ip}</Text>
          </Text>

          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>Hinweis</Text>
            <Text style={styles.noticeText}>
              Bitte melde dich mit dem Base-Admin an. Standard ist{" "}
              <Text style={styles.mono}>admin / admin</Text>.
            </Text>
          </View>

          <View style={styles.form}>
            <StylisticTextInput
              ref={usernameFieldRef}
              style={styles.input}
              placeholder="Username"
              textContentType="username"
              onChangeText={setUsername}
              value={username}
              onSubmitEditing={() => passwordFieldRef.current?.focus?.()}
            />

            <StylisticTextInput
              ref={passwordFieldRef}
              style={styles.input}
              placeholder="Password"
              secureTextEntry
              textContentType="password"
              onChangeText={setPassword}
              value={password}
              onSubmitEditing={doLogin}
            />

            {status === "failed" ? (
              <Text style={styles.errorText}>
                Login fehlgeschlagen. Bitte prüfen (admin/admin) oder Server-Status.
              </Text>
            ) : null}

            <Pressable
              onPress={doLogin}
              disabled={disabled}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && !disabled && styles.primaryButtonPressed,
                disabled && styles.primaryButtonDisabled,
              ]}
            >
              <Text style={styles.primaryButtonText}>
                {status === "loading" ? "Logging in..." : "Login"}
              </Text>
            </Pressable>

            <Text style={styles.footer}>
              Nach erfolgreichem Login kannst du Setup/Internet konfigurieren.
            </Text>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create((theme) => ({
  bg: {  flex: 1,
  width: "100%",
  height: "100%",
 minHeight: "100%" },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },

  // ✅ moderne, zentrierte Card (kein Sidepanel)
  card: {
    width: "100%",
    maxWidth: 460,
    borderRadius: 22,
    padding: 22,
    gap: 10,

    // “Glass” Look (funktioniert gut im Web)
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",

    // Shadow (web + native ok)
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },

  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  badgeDot: {
    width: 10,
    height: 10,
    borderRadius: 99,
    backgroundColor: "rgba(0,255,170,0.85)",
  },
  badgeText: {
    color: "rgba(255,255,255,0.85)",
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  subtitle: {
    color: "rgba(255,255,255,0.78)",
    marginTop: 2,
    marginBottom: 6,
  },

  mono: {
    fontFamily: "monospace",
    color: "rgba(255,255,255,0.92)",
  },

  notice: {
    borderRadius: 16,
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    gap: 4,
  },
  noticeTitle: {
    fontWeight: "800",
    color: "rgba(255,255,255,0.92)",
  },
  noticeText: {
    color: "rgba(255,255,255,0.78)",
    lineHeight: 18,
    fontSize: 13,
  },

  form: { gap: 10, marginTop: 8 },

  input: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  errorText: {
    color: "#ff6b6b",
    fontSize: 12,
    marginTop: 2,
  },

  primaryButton: {
    marginTop: 2,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
  },
  primaryButtonPressed: { transform: [{ scale: 0.99 }], opacity: 0.95 },
  primaryButtonDisabled: { opacity: 0.55 },

  primaryButtonText: {
    color: "#fff",
    fontWeight: "800",
    letterSpacing: 0.2,
  },

  footer: {
    marginTop: 2,
    fontSize: 12,
    color: "rgba(255,255,255,0.65)",
    lineHeight: 16,
  },
}));
