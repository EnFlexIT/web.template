// src/screens/settings/ChangePassword.tsx
import React, { useMemo, useState } from "react";
import {
  Alert,
  Platform,
  View,
  StyleSheet as NativeStyleSheet,
} from "react-native";
import { useTranslation } from "react-i18next";

import { Logo } from "../../components/Logo";
import { Screen } from "../../components/Screen";
import { Card } from "../../components/ui-elements/Card";
import { ActionButton } from "../../components/ui-elements/ActionButton";
import { StylisticTextInput } from "../../components/stylistic/StylisticTextInput";
import { H1 } from "../../components/stylistic/H1";
import { ThemedText } from "../../components/themed/ThemedText";

import { useAppSelector } from "../../hooks/useAppSelector";
import { selectApi } from "../../redux/slices/apiSlice";
import { styles } from "../login/styles";

type PasswordChangePayload = {
  password_old: string;
  password_new: string;
  // falls Backend ein Repeat verlangt, kannst du es hier später ergänzen:
  // password_new_repeat?: string;
};

export function ChangePasswordScreen() {
  const { t } = useTranslation(["Settings.ChangePassword"]);
  const api = useAppSelector(selectApi);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const canSave = useMemo(() => {
    return (
      oldPassword.trim().length > 0 &&
      newPassword.trim().length >= 6 &&
      newPassword2.trim().length >= 6 &&
      newPassword === newPassword2 &&
      !isSaving
    );
  }, [oldPassword, newPassword, newPassword2, isSaving]);

  async function onSave() {
    // Immer klare Rückmeldung
    if (oldPassword.trim().length === 0) {
      Alert.alert("Fehler", "Bitte aktuelles Passwort eingeben.");
      return;
    }
    if (newPassword.trim().length < 6) {
      Alert.alert("Fehler", "Das neue Passwort muss mindestens 6 Zeichen haben.");
      return;
    }
    if (newPassword !== newPassword2) {
      Alert.alert("Fehler", "Die neuen Passwörter stimmen nicht überein.");
      return;
    }
    if (isSaving) return;

    setIsSaving(true);

    try {
     
      const payload: PasswordChangePayload = {
        password_old: oldPassword,
        password_new: newPassword,
      };

      const res = await api.awb_rest_api.userApi.changePassword(payload);

      if (res?.status >= 200 && res?.status < 300) {
       // Alert.alert("Erfolg", " Passwort wurde erfolgreich geändert.");
        setOldPassword("");
        setNewPassword("");
        setNewPassword2("");
        return;
      }

   
    } catch (e: any) {
   
      const status = e?.response?.status;
      const data = e?.response?.data;

      console.log("PSWD_CHANGE status:", status);
      console.log("PSWD_CHANGE data:", data);
      console.log("PSWD_CHANGE sent payload:", {
        password_old: oldPassword,
        password_new: newPassword,
      });

     
    } finally {
      setIsSaving(false);
    }
  }

  const Content = (
     <View style={[styles.widget, styles.border]}>
      {/* Title */}
      <View style={[{ flexDirection:"row",paddingBottom:16,  gap:10,alignSelf: "center", alignItems: "center" }]}>
        <Logo style={logoStyles.logo} />
        <H1>{process.env.EXPO_PUBLIC_APPLICATION_TITLE}</H1>
      </View>

      {/* Inputs */}
      <View style={[styles.upperHalf]}>
        <ThemedText style={{ marginBottom: 6 }}>{t("cur_password")}</ThemedText>
        <StylisticTextInput
          style={[styles.border, styles.padding]}
          placeholder={t("cur_password")}
          value={oldPassword}
          onChangeText={setOldPassword}
          secureTextEntry
          autoCapitalize="none"
          textContentType="password"
        />

        <View style={{ height: 10 }} />

        <ThemedText style={{ marginBottom: 6 }}>{t("new_password")}</ThemedText>
        <StylisticTextInput
          style={[styles.border, styles.padding]}
          placeholder={t("new_password")}
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          autoCapitalize="none"
          textContentType="newPassword"
        />

        <View style={{ height: 10 }} />

        <ThemedText style={{ marginBottom: 6 }}>{t("conf_password")}</ThemedText>
        <StylisticTextInput
          style={[styles.border, styles.padding]}
          placeholder={t("conf_password")}
          value={newPassword2}
          onChangeText={setNewPassword2}
          secureTextEntry
          autoCapitalize="none"
          textContentType="newPassword"
        />

        <View style={{ height: 16 }} />

        <ActionButton
          label={isSaving ? "Speichern..." : t("submit")}
          variant="secondary"
          onPress={onSave}
          size="xs"
          disabled={!canSave}
        />
      </View>
    </View>
  );

  return (
    <Screen>
      <Card
        style={{
          maxWidth: 520,
        
          width: "100%",
        }}
      >
        {Platform.OS === "web" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSave();
            }}
          >
            {Content}
          </form>
        ) : (
          Content
        )}
      </Card>
    </Screen>
  );
}

const logoStyles = NativeStyleSheet.create({
  logo: {
    resizeMode: "contain",
    width: 38,
    height: 38,
  },
});
