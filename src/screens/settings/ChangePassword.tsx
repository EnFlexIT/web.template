// src/screens/settings/ChangePassword.tsx
import React, { useMemo, useState } from "react";
import { Platform, View, StyleSheet as NativeStyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

import { Logo } from "../../components/Logo";
import { Screen } from "../../components/Screen";
import { Card } from "../../components/ui-elements/Card";
import { ActionButton } from "../../components/ui-elements/ActionButton";
import { H1 } from "../../components/stylistic/H1";
import { ThemedText } from "../../components/themed/ThemedText";
import { TextInput } from "../../components/ui-elements/TextInput";
import { useAppSelector } from "../../hooks/useAppSelector";
import { selectApi } from "../../redux/slices/apiSlice";
import { styles } from "../login/styles";

type PasswordChangePayload = {
  password_old: string;
  password_new: string;
};

type InlineState = {
  old?: string | null;
  new1?: string | null;
  new2?: string | null;
  general?: string | null;
};

type TouchedState = {
  old: boolean;
  new1: boolean;
  new2: boolean;
};

function passwordChecks(pw: string) {
  const p = pw ?? "";
  return {
    len: p.length >= 8,
    lower: /[a-z]/.test(p),
    upper: /[A-Z]/.test(p),
    digit: /\d/.test(p),
    special: /[^A-Za-z0-9]/.test(p),
  };
}

function isStrongPassword(pw: string) {
  // mind. 8 Zeichen, 1 Großbuchstabe, 1 Kleinbuchstabe, 1 Zahl, 1 Sonderzeichen
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(pw);
}

function normalizeBackendMsg(data: any): string | null {
  if (!data) return null;
  if (typeof data === "string") return data;
  return data?.message || data?.error || data?.detail || null;
}

function looksLikeWrongOldPassword(msg?: string | null) {
  const m = (msg ?? "").toLowerCase();
  return (
    m.includes("credentials") || 
    m.includes("old password") ||
    m.includes("current password") ||
    m.includes("password_old") ||
    m.includes("wrong password") ||
    m.includes("invalid password") ||
    m.includes("falsches passwort") ||
    m.includes("altes passwort") ||
    m.includes("aktuelles passwort")
  );
}

export function ChangePasswordScreen() {
  const { t } = useTranslation(["Settings.ChangePassword"]);
  const api = useAppSelector(selectApi);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [inline, setInline] = useState<InlineState>({});
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [touched, setTouched] = useState<TouchedState>({
    old: false,
    new1: false,
    new2: false,
  });

  const checks = useMemo(
    () => passwordChecks(newPassword.trim()),
    [newPassword],
  );

  const canSave = useMemo(() => {
    const oldOk = oldPassword.trim().length > 0;
    const newOk = isStrongPassword(newPassword.trim());
    const match = newPassword === newPassword2;
    return oldOk && newOk && match && !isSaving;
  }, [oldPassword, newPassword, newPassword2, isSaving]);

  function setFieldError(field: keyof InlineState, msg: string | null) {
    setInline((p) => ({ ...p, [field]: msg }));
  }

  function clearGeneralAndSuccess() {
    if (inline.general) setFieldError("general", null);
    if (successMsg) setSuccessMsg(null);
  }

  //Validation functions 
  function validateOld(show: boolean) {
    const v = oldPassword.trim();
    const msg = v.length === 0 ? "Bitte aktuelles Passwort eingeben." : null;
    if (show) setFieldError("old", msg);
    return !msg;
  }

  function validateNew1(show: boolean) {
    const v = newPassword.trim();
    let msg: string | null = null;

    if (v.length === 0) msg = "Bitte neues Passwort eingeben.";
    else if (!isStrongPassword(v))
      msg =
        "Neues Passwort erfüllt die Richtlinien nicht (siehe Anforderungen unten).";

    if (show) setFieldError("new1", msg);
    return !msg;
  }

  function validateNew2(show: boolean) {
    const v = newPassword2;
    let msg: string | null = null;

    if (v.trim().length === 0) msg = "Bitte neues Passwort bestätigen.";
    else if (newPassword !== newPassword2)
      msg = "Die neuen Passwörter stimmen nicht überein.";

    if (show) setFieldError("new2", msg);
    return !msg;
  }

  function validateAllAndShow(): boolean {
    const okOld = validateOld(true);
    const okNew1 = validateNew1(true);
    const okNew2 = validateNew2(true);

    if (!api.jwt) {
      setFieldError("general", "Nicht eingeloggt. Bitte zuerst einloggen.");
      return false;
    }

    return okOld && okNew1 && okNew2;
  }

  //Live validation (Debounced)
  // startet erst, wenn jeweiliges Feld "touched" 
  React.useEffect(() => {
    if (!touched.old) return;
    const id = setTimeout(() => {
      validateOld(true);
    }, 150);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oldPassword, touched.old]);

  React.useEffect(() => {
    if (!touched.new1) return;
    const id = setTimeout(() => {
      validateNew1(true);
      // mismatch live, falls confirm schon touched
      if (touched.new2) validateNew2(true);
    }, 150);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newPassword, touched.new1, touched.new2]);

  React.useEffect(() => {
    if (!touched.new2) return;
    const id = setTimeout(() => {
      validateNew2(true);
    }, 150);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newPassword2, newPassword, touched.new2]);

  // Input handlers 
  function onChangeOld(v: string) {
    setOldPassword(v);
    clearGeneralAndSuccess();
  
  }

  function onChangeNew1(v: string) {
    setNewPassword(v);
    clearGeneralAndSuccess();
    
  }

  function onChangeNew2(v: string) {
    setNewPassword2(v);
    clearGeneralAndSuccess();
  
  }

  function onBlurOld() {
    setTouched((p) => ({ ...p, old: true }));
    clearGeneralAndSuccess();
    validateOld(true);
  }

  function onBlurNew1() {
    setTouched((p) => ({ ...p, new1: true }));
    clearGeneralAndSuccess();
    validateNew1(true);
    if (touched.new2) validateNew2(true);
  }

  function onBlurNew2() {
    setTouched((p) => ({ ...p, new2: true }));
    clearGeneralAndSuccess();
    validateNew2(true);
  }

  // ---------------- Save ----------------
  async function onSave() {
    setSuccessMsg(null);
    setFieldError("general", null);

    if (isSaving) return;

    // alle Felder als touched markieren, damit User alles sieht
    setTouched({ old: true, new1: true, new2: true });

    const ok = validateAllAndShow();
    if (!ok) return;

    setIsSaving(true);

    try {
      const payload: PasswordChangePayload = {
        password_old: oldPassword,
        password_new: newPassword,
      };

      await api.awb_rest_api.userApi.changePassword(payload);

      setInline({});
      setSuccessMsg("Passwort erfolgreich geändert.");

      setOldPassword("");
      setNewPassword("");
      setNewPassword2("");

      setTouched({ old: false, new1: false, new2: false });
    } catch (e: any) {
      const status = e?.response?.status;
      const data = e?.response?.data;
      const backendMsg = normalizeBackendMsg(data);

     
      if (status === 401 || status === 403) {
        if (looksLikeWrongOldPassword(backendMsg)) {
          setFieldError("old", "Falsches Passwort. Bitte erneut eingeben.");
        } else {
          setFieldError("general", "Nicht autorisiert. Bitte neu einloggen.");
        }
      } else if (status === 400) {
        if (looksLikeWrongOldPassword(backendMsg)) {
          setFieldError("old", "Falsches Passwort. Bitte erneut eingeben.");
        } else {
          setFieldError(
            "general",
            backendMsg ??
              "Anfrage ungültig. Bitte prüfe deine Eingaben und versuche es erneut.",
          );
        }
      } else {
        setFieldError(
          "general",
          backendMsg ?? "Passwort konnte nicht geändert werden.",
        );
      }

      console.log("PSWD_CHANGE status:", status);
      console.log("PSWD_CHANGE data:", data);
    } finally {
      setIsSaving(false);
    }
  }

  // ---------------- UI helpers ----------------
  const InlineMessage = ({
    text,
    type,
  }: {
    text?: string | null;
    type: "error" | "success";
  }) => {
    // Layout stabil halten
    return (
      <View style={ui.msgRow}>
        {!!text ? (
          <ThemedText
            style={[
              ui.msgText,
              type === "error" ? ui.msgError : ui.msgSuccess,
            ]}
          >
            {text}
          </ThemedText>
        ) : (
          <ThemedText style={[ui.msgText, { opacity: 0 }]}>{". "}</ThemedText>
        )}
      </View>
    );
  };

  const PasswordRules = (
    <View style={{ marginTop: 10 }}>
      <ThemedText style={{ opacity: 0.85, marginBottom: 6 }}>
        Passwort-Anforderungen:
      </ThemedText>

      <View style={{ gap: 4 }}>
        <ThemedText style={[ui.rule, checks.len ? ui.ruleOk : ui.ruleBad]}>
          • Mindestens 8 Zeichen
        </ThemedText>
        <ThemedText style={[ui.rule, checks.upper ? ui.ruleOk : ui.ruleBad]}>
          • Mindestens 1 Großbuchstabe (A–Z)
        </ThemedText>
        <ThemedText style={[ui.rule, checks.lower ? ui.ruleOk : ui.ruleBad]}>
          • Mindestens 1 Kleinbuchstabe (a–z)
        </ThemedText>
        <ThemedText style={[ui.rule, checks.digit ? ui.ruleOk : ui.ruleBad]}>
          • Mindestens 1 Zahl (0–9)
        </ThemedText>
        <ThemedText style={[ui.rule, checks.special ? ui.ruleOk : ui.ruleBad]}>
          • Mindestens 1 Sonderzeichen (!, ?, #, …)
        </ThemedText>
      </View>
    </View>
  );

  const Content = (
    <View style={[styles.widget, styles.border]}>
      {/* Title */}
      <View
        style={{
          flexDirection: "row",
        
          gap: 10,
          alignSelf: "center",
          alignItems: "center",
        }}
      >
        <Logo style={logoStyles.logo} />
        <H1>{process.env.EXPO_PUBLIC_APPLICATION_TITLE}</H1>
      </View>

      {/* Global inline messages */}
      <InlineMessage text={inline.general} type="error" />
      <InlineMessage text={successMsg} type="success" />

      {/* Inputs */}
      <View style={[styles.upperHalf]}>
  {/* Aktuelles Passwort */}
  <ThemedText style={{ marginBottom: 6 }}>{t("cur_password")}</ThemedText>
  <TextInput
    style={[styles.border, styles.padding]}
    placeholder={t("cur_password")}
    value={oldPassword}
    onChangeText={onChangeOld}
    onBlur={onBlurOld}
    passwordToggle
    autoCapitalize="none"
    textContentType="password"
    size="sm"
  />
  <InlineMessage text={inline.old} type="error" />

  <View style={{ height: 6 }} />

  {/* Neues Passwort */}
  <ThemedText style={{ marginBottom: 6 }}>{t("new_password")}</ThemedText>
  <TextInput
    style={[styles.border, styles.padding]}
    placeholder={t("new_password")}
    value={newPassword}
    onChangeText={onChangeNew1}
    onBlur={onBlurNew1}
    passwordToggle
    autoCapitalize="none"
    textContentType="newPassword"
    size="sm"
  />
  <InlineMessage text={inline.new1} type="error" />

  {PasswordRules}

  <View style={{ height: 10 }} />

  {/* Passwort bestätigen */}
  <ThemedText style={{ marginBottom: 6 }}>{t("conf_password")}</ThemedText>
  <TextInput
    style={[styles.border, styles.padding]}
    placeholder={t("conf_password")}
    value={newPassword2}
    onChangeText={onChangeNew2}
    onBlur={onBlurNew2}
    passwordToggle
    autoCapitalize="none"
    textContentType="newPassword"
    size="sm"
  />
  <InlineMessage text={inline.new2} type="error" />

  <View style={{ height: 10 }} />

  {/* Button */}
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
      <Card style={{ maxWidth: 520, width: "100%" }}>
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

const ui = NativeStyleSheet.create({
  msgRow: {
    minHeight: 18, 
    marginBottom: 6,
  },
  msgText: {
    fontSize: 12,
    lineHeight: 16,
  },
  msgError: {
    color: "#ff4d4f",
  },
  msgSuccess: {
    color: "#2ecc71",
  },
  rule: {
    fontSize: 12,
    lineHeight: 16,
  },
  ruleOk: {
    color: "#2ecc71",
  },
  ruleBad: {
    color: "#3b3939",
  },
});
