// src/components/DataPermissionsDialog.tsx
import React, { useMemo } from "react";
import { Modal, Pressable, View } from "react-native";
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
  return <ThemedView style={horizontalLineStyles.line} />;
}

const horizontalLineStyles = StyleSheet.create((theme) => ({
  line: {
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
    marginVertical: 6,
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
      <ThemedText
        numberOfLines={2}
        style={rowStyles.text}
      >
        {label}
      </ThemedText>

      <Pressable
        onPress={disabled ? undefined : onPress}
        style={rowStyles.iconWrapper}
      >
        <AntDesign
          name={value ? "check" : "close"}
          size={26}
          color="black"
        />
      </Pressable>
    </ThemedView>
  );
}

const rowStyles = StyleSheet.create(() => ({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    minHeight: 44,
    paddingVertical: 4,
  },
  text: {
    flex: 1,
    fontWeight: "bold",
    fontSize: 16,
  },
  iconWrapper: {
    width: 32,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
}));

export function DataPermissionsDialog() {
  const dispatch = useAppDispatch();

  const { t, i18n } = useTranslation([
    "Settings.PrivacySecurity",
    "Settings.Unauthenticated",
  ]);

  const values = useAppSelector(selectPermissionValues);
  const hasSeenDialog = useAppSelector((s) => s.dataPermissions.hasSeenDialog);
  const language = useAppSelector(selectLanguage);

  const visible = hasSeenDialog !== true;

  const languageOptions = useMemo(
    () =>
      ({
        de: "Deutsch",
        en: "English",
      } as const),
    []
  );

  React.useEffect(() => {
    const lng = (language?.language as "de" | "en") ?? "de";
    if (i18n.language !== lng) {
      i18n.changeLanguage(lng);
    }
  }, [language?.language, i18n]);

  const togglePermission = (id: number, nextValue: boolean) => {
    dispatch(setPermissionValue({ id, value: nextValue }));
  };

  const allesAkzeptieren = () => {
    dispatch(acceptAll());
    dispatch(setHasSeenDialog(true));
  };

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
          <ThemedView style={styles.headerRow}>
            <ThemedText style={styles.title}>
              {t("privacy_settings_title", { defaultValue: "Datenschutz" })}
            </ThemedText>

            <View style={styles.langBox}>
              <Dropdown<"de" | "en">
                value={(language?.language as "de" | "en") ?? "de"}
                options={languageOptions}
                size="xs"
                onChange={(lng) => {
                  dispatch(setLanguage({ language: lng }));
                  i18n.changeLanguage(lng);
                }}
              />
            </View>
          </ThemedView>

          <ThemedView style={styles.textContainer}>
            <ThemedText style={styles.text}>
              {t("privacy_settings_description", {
                defaultValue: "Auf Ihrem Gerät gespeicherte Informationen:",
              })}
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.switchesContainer}>
            {PERMISSIONS.map((p, idx) => {
              const value = values[p.id] ?? p.defaultValue;
              const disabled = !p.editable;

              return (
                <ThemedView key={p.id}>
                  <Row
                    label={t((p as any).titleKey ?? "", {
                      defaultValue: (p as any).title ?? `Permission ${p.id}`,
                    })}
                    value={disabled ? true : value}
                    disabled={disabled}
                    onPress={() => togglePermission(p.id, !value)}
                  />

                  {idx < PERMISSIONS.length - 1 ? <HorizontalLine /> : null}
                </ThemedView>
              );
            })}
          </ThemedView>

          <ThemedView style={styles.confirmContainer}>
            <Pressable onPress={allesAkzeptieren} style={styles.actionButton}>
              <ThemedText style={styles.actionText}>
                {t("accept_all", { defaultValue: "Alle akzeptieren" })}
              </ThemedText>
            </Pressable>

            <Pressable onPress={einstellungenSpeichern} style={styles.actionButton}>
              <ThemedText style={styles.actionText}>
                {t("apply", { defaultValue: "Bestätigen" })}
              </ThemedText>
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
    padding: 20,
  },

  contentContainer: {
    width: "90%",
    maxWidth: 520,
    minWidth: 320,
    borderColor: theme.colors.border,
    borderWidth: 1,
    paddingVertical: 24,
    paddingHorizontal: 28,
    justifyContent: "space-between",
    gap: 20,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
  },

  title: {
    flexShrink: 1,
    fontWeight: "bold",
    fontSize: 24,
  },

  langBox: {
    width: 150,
    minWidth: 120,
    flexShrink: 0,
  },

  textContainer: {
    marginTop: 4,
  },

  text: {
    fontWeight: "bold",
    fontSize: 16,
    lineHeight: 24,
  },

  switchesContainer: {
    gap: 2,
  },

  confirmContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    paddingTop: 8,
  },

  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },

  actionText: {
    fontSize: 16,
  },

  permDesc: {
    opacity: 0.8,
    marginTop: 6,
  },
}));