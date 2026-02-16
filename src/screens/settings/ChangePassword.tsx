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

import { Infobox } from "../../components/ui-elements/Infobox";

type PasswordChangePayload = {
  password_old: string;
  password_new: string;
};

type InlineState = {
  oldKey?: string | null;
  new1Key?: string | null;
  new2Key?: string | null;


  generalKey?: string | null;
  generalRaw?: string | null;
};

type TouchedState = {
  old: boolean;
  new1: boolean;
  new2: boolean;
};

type ActiveField = "old" | "new1" | "new2" | null;

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

  const [activeField, setActiveField] = useState<ActiveField>(null);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [inline, setInline] = useState<InlineState>({});
  const [successKey, setSuccessKey] = useState<string | null>(null);

  const [touched, setTouched] = useState<TouchedState>({
    old: false,
    new1: false,
    new2: false,
  });

  const checks = useMemo(() => passwordChecks(newPassword.trim()), [newPassword]);

  const canSave = useMemo(() => {
    const oldOk = oldPassword.trim().length > 0;
    const newOk = isStrongPassword(newPassword.trim());
    const match = newPassword === newPassword2;
    return oldOk && newOk && match && !isSaving;
  }, [oldPassword, newPassword, newPassword2, isSaving]);

  function setInlinePatch(patch: Partial<InlineState>) {
    setInline((p) => ({ ...p, ...patch }));
  }

  function clearGeneralAndSuccess() {
    if (inline.generalKey || inline.generalRaw) setInlinePatch({ generalKey: null, generalRaw: null });
    if (successKey) setSuccessKey(null);
  }

  // ---------------- Validation (Keys) ----------------
  function validateOld(show: boolean) {
    const v = oldPassword.trim();
    const key = v.length === 0 ? "validation.old_required" : null;
    if (show) setInlinePatch({ oldKey: key });
    return !key;
  }

  function validateNew1(show: boolean) {
    const v = newPassword.trim();
    let key: string | null = null;

    if (v.length === 0) key = "validation.new_required";
    else if (!isStrongPassword(v)) key = "validation.new_rules_not_met";

    if (show) setInlinePatch({ new1Key: key });
    return !key;
  }

  function validateNew2(show: boolean) {
    const v = newPassword2;
    let key: string | null = null;

    if (v.trim().length === 0) key = "validation.confirm_required";
    else if (newPassword !== newPassword2) key = "validation.confirm_mismatch";

    if (show) setInlinePatch({ new2Key: key });
    return !key;
  }

  function validateAllAndShow(): boolean {
    const okOld = validateOld(true);
    const okNew1 = validateNew1(true);
    const okNew2 = validateNew2(true);

    if (!api.jwt) {
      setInlinePatch({ generalKey: "api.not_logged_in", generalRaw: null });
      return false;
    }

    return okOld && okNew1 && okNew2;
  }

  // ---------------- Live validation (Debounced) ----------------
  React.useEffect(() => {
    if (!touched.old) return;
    const id = setTimeout(() => validateOld(true), 150);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oldPassword, touched.old]);

  React.useEffect(() => {
    if (!touched.new1) return;
    const id = setTimeout(() => {
      validateNew1(true);
      if (touched.new2) validateNew2(true);
    }, 150);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newPassword, touched.new1, touched.new2]);

  React.useEffect(() => {
    if (!touched.new2) return;
    const id = setTimeout(() => validateNew2(true), 150);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newPassword2, newPassword, touched.new2]);

  // ---------------- Input handlers ----------------
  function onChangeOld(v: string) {
    setOldPassword(v);
    clearGeneralAndSuccess();
    if (inline.oldKey) setInlinePatch({ oldKey: null });
  }

  function onChangeNew1(v: string) {
    setNewPassword(v);
    clearGeneralAndSuccess();
    if (inline.new1Key) setInlinePatch({ new1Key: null });
  }

  function onChangeNew2(v: string) {
    setNewPassword2(v);
    clearGeneralAndSuccess();
    if (inline.new2Key) setInlinePatch({ new2Key: null });
  }

  function onBlurOld() {
    setActiveField(null);
    setTouched((p) => ({ ...p, old: true }));
    clearGeneralAndSuccess();
    validateOld(true);
  }

  function onBlurNew1() {
    setActiveField(null);
    setTouched((p) => ({ ...p, new1: true }));
    clearGeneralAndSuccess();
    validateNew1(true);
    if (touched.new2) validateNew2(true);
  }

  function onBlurNew2() {
    setActiveField(null);
    setTouched((p) => ({ ...p, new2: true }));
    clearGeneralAndSuccess();
    validateNew2(true);
  }

  // ---------------- Save ----------------
  async function onSave() {
    setSuccessKey(null);
    setInlinePatch({ generalKey: null, generalRaw: null });

    if (isSaving) return;

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
      setSuccessKey("api.success");

      setOldPassword("");
      setNewPassword("");
      setNewPassword2("");

      setTouched({ old: false, new1: false, new2: false });
      setActiveField(null);
    } catch (e: any) {
      const status = e?.response?.status;
      const data = e?.response?.data;
      const backendMsg = normalizeBackendMsg(data);

      if (status === 401 || status === 403) {
        if (looksLikeWrongOldPassword(backendMsg)) {
          setInlinePatch({ oldKey: "api.wrong_password" });
        } else {
          setInlinePatch({ generalKey: "api.unauthorized", generalRaw: null });
        }
      } else if (status === 400) {
        if (looksLikeWrongOldPassword(backendMsg)) {
          setInlinePatch({ oldKey: "api.wrong_password" });
        } else {
          // Wenn BackendMsg kommt, zeigen wir den raw Text.
          if (backendMsg) {
            setInlinePatch({ generalRaw: backendMsg, generalKey: null });
          } else {
            setInlinePatch({ generalKey: "api.bad_request_fallback", generalRaw: null });
          }
        }
      } else {
        if (backendMsg) {
          setInlinePatch({ generalRaw: backendMsg, generalKey: null });
        } else {
          setInlinePatch({ generalKey: "api.generic_error", generalRaw: null });
        }
      }
    } finally {
      setIsSaving(false);
    }
  }

  // ---------------- Bottom Info content (Focus-Switch) ----------------
  const ruleLines = [
    { ok: checks.len, text: t("rules.len") },
    { ok: checks.upper, text: t("rules.upper") },
    { ok: checks.lower, text: t("rules.lower") },
    { ok: checks.digit, text: t("rules.digit") },
    { ok: checks.special, text: t("rules.special") },
  ];

  const hasRuleMissing = ruleLines.some((r) => !r.ok);

  const generalText =
    inline.generalRaw ?? (inline.generalKey ? t(inline.generalKey) : null);

  const boxState = (() => {
    // General (no field active)
    if (activeField === null && generalText) {
      return {
        tone: "danger" as const,
        title: t("infobox.hint_title"),
        subtitle: generalText,
        body: null as React.ReactNode,
      };
    }

    // Success (no field active)
    if (activeField === null && successKey) {
      return {
        tone: "success" as const,
        title: t("infobox.success_title"),
        subtitle: t(successKey),
        body: null as React.ReactNode,
      };
    }

    // Focus: old password
    if (activeField === "old") {
      const errText = touched.old && inline.oldKey ? t(inline.oldKey) : null;
      return {
        tone: errText ? ("danger" as const) : ("info" as const),
        title: t("infobox.old.title"),
        subtitle: errText ?? t("infobox.old.subtitle"),
        body: null as React.ReactNode,
      };
    }

    // Focus: new password -> show rules
    if (activeField === "new1") {
      return {
        tone:
          hasRuleMissing && newPassword.trim().length > 0
            ? ("warning" as const)
            : ("info" as const),
        title: t("infobox.new1.title"),
        subtitle: t("infobox.new1.subtitle"),
        body: (
          <View style={{ gap: 4 }}>
            {ruleLines.map((r, idx) => (
              <ThemedText
                key={idx}
                style={[ui.rule, r.ok ? ui.ruleOk : ui.ruleBad]}
              >
                • {r.text}
              </ThemedText>
            ))}
          </View>
        ),
      };
    }

    // Focus: confirm
    if (activeField === "new2") {
      const errText = touched.new2 && inline.new2Key ? t(inline.new2Key) : null;

      let subtitle = t("infobox.new2.subtitle_default");
      let tone: "info" | "danger" = "info";

      if (errText) {
        subtitle = errText;
        tone = "danger";
      } else if (newPassword2.length > 0 && newPassword !== newPassword2) {
        subtitle = t("infobox.new2.subtitle_mismatch");
        tone = "danger";
      }

      return {
        tone,
        title: t("infobox.new2.title"),
        subtitle,
        body: null as React.ReactNode,
      };
    }

    // Idle
    return {
      tone: "info" as const,
      title: t("infobox.idle.title"),
      subtitle: t("infobox.idle.subtitle"),
      body: null as React.ReactNode,
    };
  })();

  // ---------------- UI ----------------
  const Content = (
    <View style={[styles.widget, styles.border, layout.widget]}>
      {/* Title */}
      <View
        style={{
          flexDirection: "row",
          paddingBottom: 18,
          gap: 10,
          alignSelf: "center",
          alignItems: "center",
        }}
      >
        <Logo style={logoStyles.logo} />
        <H1>{process.env.EXPO_PUBLIC_APPLICATION_TITLE}</H1>
      </View>

      {/* Inputs */}
      <View style={[styles.upperHalf]}>
        <TextInput
          style={[styles.border, styles.padding]}
          placeholder={t("cur_password")}
          value={oldPassword}
          onChangeText={onChangeOld}
          onFocus={() => setActiveField("old")}
          onBlur={onBlurOld}
          passwordToggle
          autoCapitalize="none"
          textContentType="password"
          size="sm"
        />

        <View style={{ height: 10 }} />

        <TextInput
          style={[styles.border, styles.padding]}
          placeholder={t("new_password")}
          value={newPassword}
          onChangeText={onChangeNew1}
          onFocus={() => setActiveField("new1")}
          onBlur={onBlurNew1}
          passwordToggle
          autoCapitalize="none"
          textContentType="newPassword"
          size="sm"
        />

        <View style={{ height: 10 }} />

        <TextInput
          style={[styles.border, styles.padding]}
          placeholder={t("conf_password")}
          value={newPassword2}
          onChangeText={onChangeNew2}
          onFocus={() => setActiveField("new2")}
          onBlur={onBlurNew2}
          passwordToggle
          autoCapitalize="none"
          textContentType="newPassword"
          size="sm"
        />

        <View style={{ height: 12 }} />

        <ActionButton
          label={isSaving ? t("submit_saving") : t("submit")}
          variant="secondary"
          onPress={onSave}
          size="xs"
          disabled={!canSave}
        />
      </View>

      {/* Bottom Info */}
      <View style={layout.bottom}>
        <Infobox
          title={boxState.title}
          subtitle={boxState.subtitle}
          tone={boxState.tone}
          style={layout.fixedBox}
        >
          {boxState.body}
        </Infobox>
      </View>
    </View>
  );

  return (
    <Screen>
      <Card style={{ width: "100%" }}>
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

const layout = NativeStyleSheet.create({
  widget: {
    flexGrow: 1,
    minHeight: 400,
  },
  bottom: {
    paddingTop: 14,
  },
  fixedBox: {
    minHeight: 180,
    maxHeight: 180,
  },
});

const ui = NativeStyleSheet.create({
  rule: {
    fontSize: 12,
    lineHeight: 16,
  },
  ruleOk: {
    color: "#2ecc71",
  },
  ruleBad: {},
});
