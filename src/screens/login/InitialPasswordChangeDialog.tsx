import React from "react";
import { Modal, View, Pressable, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { Card } from "../../components/ui-elements/Card";
import { H4 } from "../../components/stylistic/H4";
import { ThemedText } from "../../components/themed/ThemedText";
import { ActionButton } from "../../components/ui-elements/ActionButton";
import { useTranslation } from "react-i18next";

import { useAppDispatch } from "../../hooks/useAppDispatch";
import { useAppSelector } from "../../hooks/useAppSelector";
import {
  closeInitialPasswordChangeDialog,
  selectInitialPasswordChangeDialogOpen,
} from "../../redux/slices/passwordChangePromptSlice";
import { setActiveMenuId } from "../../redux/slices/menuSlice";

const CHANGE_PASSWORD_MENU_ID = 3013;

export function InitialPasswordChangeDialog() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();
  const isOpen = useAppSelector(selectInitialPasswordChangeDialogOpen);
  const { t } = useTranslation(["Login"]);

  function onSkip() {
    dispatch(closeInitialPasswordChangeDialog());
  }

  function onOpenChangePassword() {
    dispatch(closeInitialPasswordChangeDialog());
    dispatch(setActiveMenuId(CHANGE_PASSWORD_MENU_ID));
    navigation.navigate(String(CHANGE_PASSWORD_MENU_ID));
  }

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onSkip}
    >
      <View style={styles.backdrop}>
        <View style={styles.centerWrap}>
          <Card style={styles.card}>
            <View style={styles.content}>
              <H4>{t("changepassword")}</H4>

              <ThemedText style={styles.text}>
               {t("StandardPasswort")}
              </ThemedText>

              <View style={styles.actions}>
                <ActionButton
                  label={t("skip")}
                  variant="secondary"
                  size="xs"
                  onPress={onSkip}
                />

                <ActionButton
                  label={t("changepassword")}
                  variant="primary"
                  size="xs"
                  onPress={onOpenChangePassword}
                />
              </View>
            </View>
          </Card>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  centerWrap: {
    width: "100%",
    maxWidth: 520,
  },
  card: {
    width: "100%",
  },
  content: {
    padding: 20,
    gap: 16,
  },
  text: {
    lineHeight: 20,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
});