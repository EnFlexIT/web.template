// src/screens/settings/ChangePassword.tsx
import React, { useMemo, useState } from "react";
import { Alert, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Platform } from "react-native";

import { Screen } from "../../components/Screen";
import { Card } from "../../components/ui-elements/Card";
import { ActionButton } from "../../components/ui-elements/ActionButton";
import { StylisticTextInput } from "../../components/stylistic/StylisticTextInput";
import { H1 } from "../../components/stylistic/H1";

import { useAppSelector } from "../../hooks/useAppSelector";
import { selectApi } from "../../redux/slices/apiSlice";

type PasswordChangePayload = {
  password_old: string;
  password_new: string;
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
    if (newPassword !== newPassword2) {
      Alert.alert("Fehler", "Die neuen Passwörter stimmen nicht überein.");
      return;
    }

    if (newPassword.trim().length < 6) {
      Alert.alert("Fehler", "Das neue Passwort muss mindestens 6 Zeichen haben.");
      return;
    }

    setIsSaving(true);
    try {
      const payload: PasswordChangePayload = {
        password_old: oldPassword,
        password_new: newPassword,
      };

      // bei dir kommt AxiosResponse<void>
      const res = await api.awb_rest_api.userApi.changePassword(payload);

      //  Erfolg, wenn 2xx
      if (res.status >= 200 && res.status < 300) {
        Alert.alert("Erfolg", "Passwort wurde erfolgreich geändert.");
        setOldPassword("");
        setNewPassword("");
        setNewPassword2("");
        return;
      }

      // Falls irgendein nicht-2xx mal nicht im catch landet (selten, aber safe)
      Alert.alert("Fehler", `Passwort konnte nicht geändert werden. (Status: ${res.status})`);
    } catch (e: any) {
      const status = e?.response?.status;
      const backendMsg = e?.response?.data?.message;

      // optional: typische Fälle schöner machen
      if (status === 401 || status === 403) {
        Alert.alert("Fehler", "Das aktuelle Passwort ist falsch.");
      } else if (status === 400) {
        Alert.alert("Fehler", String(backendMsg ?? "Ungültige Anfrage."));
      } else {
        const msg = backendMsg || e?.message || "Passwort konnte nicht geändert werden.";
        Alert.alert("Fehler", String(msg));
      }
    } finally {
      setIsSaving(false);
    }
  }

return (
  <Screen>
    <Card style={{ maxWidth: 520 }}>
      <H1>{t("title")}</H1>

      <View style={{ height: 14 }} />

      {Platform.OS === "web" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave();
          }}
        >
          <StylisticTextInput
            value={oldPassword}
            onChangeText={setOldPassword}
            placeholder={t("cur_password")}
            secureTextEntry
            autoCapitalize="none"
            textContentType="password"
          />

          <View style={{ height: 10 }} />

          <StylisticTextInput
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder={t("new_password")}
            secureTextEntry
            autoCapitalize="none"
            textContentType="newPassword"
          />

          <View style={{ height: 10 }} />

          <StylisticTextInput
            value={newPassword2}
            onChangeText={setNewPassword2}
            placeholder={t("conf_password")}
            secureTextEntry
            autoCapitalize="none"
            textContentType="newPassword"
          />

          <View style={{ height: 16 }} />

          <ActionButton
            variant="secondary"
            label={isSaving ? "..." : t("submit")}
            onPress={onSave}
          />
        </form>
      ) : (
        <>
          <StylisticTextInput
            value={oldPassword}
            onChangeText={setOldPassword}
            placeholder={t("cur_password")}
            secureTextEntry
            autoCapitalize="none"
            textContentType="password"
          />

          <View style={{ height: 10 }} />

          <StylisticTextInput
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder={t("new_password")}
            secureTextEntry
            autoCapitalize="none"
            textContentType="newPassword"
          />

          <View style={{ height: 10 }} />

          <StylisticTextInput
            value={newPassword2}
            onChangeText={setNewPassword2}
            placeholder={t("conf_password")}
            secureTextEntry
            autoCapitalize="none"
            textContentType="newPassword"
          />

          <View style={{ height: 16 }} />

          <ActionButton
            variant="secondary"
            label={isSaving ? "..." : t("submit")}
            onPress={onSave}
          />
        </>
      )}
    </Card>
  </Screen>
);

}
