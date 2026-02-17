// src/components/DataPermissionsDialog.tsx
import React, { useMemo } from "react";
import { Modal, Pressable } from "react-native";
import { BlurView as BlurView_ } from "expo-blur";
import AntDesign from "@expo/vector-icons/AntDesign";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import { useTranslation } from "react-i18next";

import { ThemedText } from "./themed/ThemedText";
import { ThemedView } from "./themed/ThemedView";
import { Dropdown } from "./ui-elements/Dropdown";

import { useAppSelector } from "../hooks/useAppSelector";
import { useAppDispatch } from "../hooks/useAppDispatch";

import { PERMISSIONS } from "../permissions/PermiossionGroup";
import {
  selectPermissionValues,
  setPermissionValue,
  acceptAll,
  rejectOptional,
  setHasSeenDialog,
} from "../redux/slices/dataPermissionsSlice";

import { selectLanguage, setLanguage } from "../redux/slices/languageSlice";

const BlurView = withUnistyles(BlurView_);

function HorizontalLine() {
  return <ThemedView style={[horizontalLineStyles.color]} />;
}

const horizontalLineStyles = StyleSheet.create((theme) => ({
  color: {
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
  },
}));

function Row({
  label,
  value,
  onPress,
  disabled,
}: {
  label: string;
  value: boolean;
  onPress?: () => void;
  disabled?: boolean;
}) {
  return (
    <ThemedView style={rowStyles.container}>
      <ThemedText style={rowStyles.text}>{label}</ThemedText>
      <Pressable onPress={disabled ? undefined : onPress}>
        <AntDesign
          name={value ? "checkcircleo" : "closecircleo"}
          size={24}
          color="black"
        />
      </Pressable>
    </ThemedView>
  );
}

const rowStyles = StyleSheet.create(() => ({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: "30%",
  },
  text: {
    fontWeight: "bold",
  },
}));

export function DataPermissionsDialog() {
  const dispatch = useAppDispatch();

  // ✅ i18n
  const { t, i18n } = useTranslation(["Settings.PrivacySecurity", "Settings.Unauthenticated"]);

  // ✅ Permissions state
  const values = useAppSelector(selectPermissionValues);
  const hasSeenDialog = useAppSelector((s) => s.dataPermissions.hasSeenDialog);

  // ✅ language state (Redux)
  const language = useAppSelector(selectLanguage);

  const visible = hasSeenDialog !== true;

  // Dropdown options
  const languageOptions = useMemo(
    () =>
      ({
        de: "Deutsch",
        en: "English",
      } as const),
    []
  );

  // Keep i18n in sync when Redux language changes (optional safety)
  React.useEffect(() => {
    const lng = (language?.language as "de" | "en") ?? "de";
    if (i18n.language !== lng) {
      i18n.changeLanguage(lng);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language?.language]);

  const togglePermission = (id: number, nextValue: boolean) => {
    dispatch(setPermissionValue({ id, value: nextValue }));
  };

  const allesAkzeptieren = () => {
    dispatch(acceptAll());
    dispatch(setHasSeenDialog(true));
  };

  // Optional: nur notwendige (falls du den Button später wieder einblenden willst)
  const nurNotwendige = () => {
    dispatch(rejectOptional());
    dispatch(setHasSeenDialog(true));
  };

  const einstellungenSpeichern = () => {
    dispatch(setHasSeenDialog(true));
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <BlurView style={styles.blurView}>
        <ThemedView style={styles.contentContainer}>
          {/* Header: Title + Language Switch */}
          <ThemedView style={styles.headerRow}>
            <ThemedText style={styles.title}>
              {t("privacy_settings_title", { defaultValue: "Datenschutz" })}
            </ThemedText>

            <ThemedView style={styles.langBox}>
              <Dropdown<"de" | "en">
                value={((language?.language as "de" | "en") ?? "de")}
                options={languageOptions}
                size="xs"
                onChange={(lng) => {
                  // ✅ 1) Redux
                  dispatch(setLanguage({ language: lng }));
                  // ✅ 2) i18n (sofort sichtbar)
                  i18n.changeLanguage(lng);
                }}
              />
            </ThemedView>
          </ThemedView>

          {/* Description */}
          <ThemedView style={styles.textContainer}>
            <ThemedText style={styles.text}>
              {t("privacy_settings_description", {
                defaultValue:
                  "Auf Ihrem Gerät gespeicherte Informationen:",
              })}
            </ThemedText>
          </ThemedView>

          {/* Switches */}
          <ThemedView style={styles.switchesContainer}>
            {PERMISSIONS.map((p, idx) => {
              const value = values[p.id] ?? p.defaultValue;
              const disabled = !p.editable;

              return (
                <ThemedView key={p.id}>
                  <Row
                    // ✅ Minimal-change i18n: Katalog hat titleKey/descriptionKey
                    label={t((p as any).titleKey ?? "", {
                      defaultValue: (p as any).title ?? `Permission ${p.id}`,
                    })}
                    value={disabled ? true : value}
                    disabled={disabled}
                    onPress={() => togglePermission(p.id, !value)}
                  />

                  {/* Optional: Wenn du im Dialog auch descriptions anzeigen willst, entkommentieren:
                  <ThemedText style={styles.permDesc}>
                    {t((p as any).descriptionKey ?? "", {
                      defaultValue: (p as any).description ?? "",
                    })}
                  </ThemedText>
                  */}

                  {idx < PERMISSIONS.length - 1 ? <HorizontalLine /> : null}
                </ThemedView>
              );
            })}
          </ThemedView>

          {/* Buttons */}
          <ThemedView style={styles.confirmContainer}>
            <Pressable onPress={allesAkzeptieren}>
              <ThemedText>{t("accept_all", { defaultValue: "Alle akzeptieren" })}</ThemedText>
            </Pressable>

            {/* Optional Button:
            <Pressable onPress={nurNotwendige}>
              <ThemedText>{t("cancel", { defaultValue: "Rückgängig" })}</ThemedText>
            </Pressable>
            */}

            <Pressable onPress={einstellungenSpeichern}>
              <ThemedText>{t("apply", { defaultValue: "Bestätigen" })}</ThemedText>
            </Pressable>
          </ThemedView>
        </ThemedView>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create((theme) => ({
  blurView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    width: "50%",
    height: "50%",
    borderColor: theme.colors.border,
    borderWidth: 1,
    padding: 20,
    justifyContent: "space-between",
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  langBox: {
    minWidth: 140,
  },

  title: {
    fontWeight: "bold",
    fontSize: 24,
  },
  textContainer: {
    margin: 10,
  },
  switchesContainer: {
    gap: 10,
  },
  confirmContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  text: { fontWeight: "bold" },

  // Optional description styling
  permDesc: {
    opacity: 0.8,
    marginTop: 6,
    paddingHorizontal: "30%",
  },
}));
