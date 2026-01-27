// src/screens/login/ServerModal.tsx
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  View,
  Platform,
  Alert,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useUnistyles } from "react-native-unistyles";

import { ThemedText } from "../../components/themed/ThemedText";
import { StylisticTextInput } from "../../components/stylistic/StylisticTextInput";
import { Dropdown } from "../../components/ui-elements/Dropdown";
import { ActionButton } from "../../components/ui-elements/ActionButton";
import { Icon } from "../../components/ui-elements/Icon/Icon";

import { useAppDispatch } from "../../hooks/useAppDispatch";
import { setIpAsync } from "../../redux/slices/apiSlice";
import { initializeMenu } from "../../redux/slices/menuSlice";
import {
  addServer,
  selectServer,
  updateServer,
  removeServer,
} from "../../redux/slices/serverSlice";

import { checkServerReachable, normalizeBaseUrl, normalizeName } from "./serverCheck";
import { styles, modalStyles } from "./styles";
import { H1 } from "../../components/stylistic/H1";
import { H4 } from "../../components/stylistic/H4";

type Server = {
  id: string;
  name: string;
  baseUrl: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  servers: Server[];
  selectedServerId: string;
  selectedBaseUrl: string;
};

function confirmDialog(title: string, message: string): Promise<boolean> {
  // Web
  if (Platform.OS === "web") {
    // eslint-disable-next-line no-alert
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }

  // Native
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: "Abbrechen", style: "cancel", onPress: () => resolve(false) },
      { text: "Löschen", style: "destructive", onPress: () => resolve(true) },
    ]);
  });
}

export function ServerModal({
  visible,
  onClose,
  servers,
  selectedServerId,
  selectedBaseUrl,
}: Props) {
  const { t } = useTranslation(["Login"]);
  const dispatch = useAppDispatch();
  const { theme } = useUnistyles();

  const selectedServer = servers.find((s) => s.id === selectedServerId);

  const [busy, setBusy] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Add / Edit shared inputs
  const [nameInput, setNameInput] = useState("");
  const [urlInput, setUrlInput] = useState("");

  // mode: add vs edit
  const [editMode, setEditMode] = useState(false);

  const serverOptions = useMemo<Record<string, string>>(
    () =>
      Object.fromEntries(
        servers.map((s) => [s.id, `${s.name} (${s.baseUrl})`]),
      ),
    [servers],
  );

  function resetErrors() {
    setNameError(null);
    setUrlError(null);
    setGeneralError(null);
  }

  async function handleUseSelectedServer() {
    const url = normalizeBaseUrl(selectedServer?.baseUrl ?? selectedBaseUrl);
    await dispatch(setIpAsync(url));
    await dispatch(initializeMenu());
    onClose();
  }

  function startEditSelected() {
    resetErrors();
    if (!selectedServer) return;

    setEditMode(true);
    setNameInput(selectedServer.name ?? "");
    setUrlInput(selectedServer.baseUrl ?? "");
  }

  function startAddNew() {
    resetErrors();
    setEditMode(false);
    setNameInput("");
    setUrlInput("");
  }

  async function handleDeleteSelected() {
    if (!selectedServer) return;

    const ok = await confirmDialog(
      "Server löschen?",
      `${selectedServer.name} (${selectedServer.baseUrl})`,
    );
    if (!ok) return;

    dispatch(removeServer(selectedServer.id));
    // optional: Modal offen lassen, damit man direkt einen anderen wählen kann
    // oder schließen:
    // onClose();
  }

  async function handleApply() {
    resetErrors();

    const name = normalizeName(nameInput) || "Custom";
    const baseUrl = normalizeBaseUrl(urlInput);

    if (!baseUrl) {
      setUrlError(t("errors.serverUrlRequired"));
      return;
    }

    if (!/^https?:\/\//i.test(baseUrl)) {
      setUrlError(t("errors.serverUrlInvalid"));
      return;
    }

    // Duplikate prüfen – beim Edit darf er sich selbst behalten
    const isSameId = (id: string) => (selectedServer?.id ?? "") === id;

    const nameExists = servers.some((s) => {
      if (editMode && isSameId(s.id)) return false;
      return (s.name ?? "").toLowerCase() === name.toLowerCase();
    });
    if (nameExists) {
      setNameError(t("errors.serverNameExists"));
      return;
    }

    const urlExists = servers.some((s) => {
      if (editMode && isSameId(s.id)) return false;
      return normalizeBaseUrl(s.baseUrl).toLowerCase() === baseUrl.toLowerCase();
    });
    if (urlExists) {
      setUrlError(t("errors.serverUrlExists"));
      return;
    }

    setBusy(true);
    const check = await checkServerReachable(baseUrl);
    setBusy(false);

    if (!check.ok) {
      setUrlError(t("errors.serverNotReachable"));
      setGeneralError(check.message);
      return;
    }

    // ✅ EDIT
    if (editMode && selectedServer) {
      dispatch(updateServer({ id: selectedServer.id, name, baseUrl }));
      await dispatch(setIpAsync(baseUrl));
      await dispatch(initializeMenu());
      onClose();
      return;
    }

    // ✅ ADD
    const id =
      normalizeName(name).toLowerCase().replace(/\s+/g, "-") +
      "-" +
      Date.now();

    dispatch(addServer({ id, name, baseUrl }));
    dispatch(selectServer(id));

    await dispatch(setIpAsync(baseUrl));
    await dispatch(initializeMenu());

    setNameInput("");
    setUrlInput("");
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      {/* Backdrop: click outside closes */}
      <Pressable style={modalStyles.backdrop} onPress={onClose}>
        {/* Card: stop propagation */}
        <Pressable
          onPress={() => {}}
          style={[
            modalStyles.card,
            styles.border,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <H1>{t("changeOrganization")}</H1>

            <Pressable onPress={onClose}>
              <Icon name="close" size={20} color={theme.colors.text} />
            </Pressable>
          </View>

          {/* Saved servers */}
          <View style={{ gap: 8 }}>
            <H4>{t("savedServers")}</H4>

            <Dropdown
              value={selectedServerId}
              options={serverOptions}
              onChange={(id: string) => {
                dispatch(selectServer(id));
                // bei Auswahlwechsel: Edit-Modus abbrechen
                startAddNew();
              }}
            />
            {/* Edit/Delete row */}
            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={{ flex: 1 }}>
                <ActionButton
                 
                  variant="secondary"
                  icon="edit"
                  onPress={startEditSelected}
                />
              </View>
              <View style={{ flex: 1 }}>
                <ActionButton
                
                  variant="secondary"
                  icon="delete"
                  onPress={handleDeleteSelected}
                />
              </View>
            </View>

            <ActionButton
              label={t("useServer")}
              variant="secondary"
              icon="check"
              onPress={handleUseSelectedServer}
            />

            
          </View>

          {/* Add/Edit form */}
          <View style={{ gap: 8 }}>
            <ThemedText>
              {editMode ? (t("editServer") ?? "Server bearbeiten") : t("addServer")}
            </ThemedText>

            <StylisticTextInput
              style={[
                styles.border,
                styles.padding,
                nameError && styles.errorBorder,
              ]}
              placeholder={t("serverLabel")}
              value={nameInput}
              onChangeText={(v) => {
                setNameInput(v);
                setNameError(null);
                setGeneralError(null);
              }}
            />
            {nameError && <ThemedText style={styles.errorText}>{nameError}</ThemedText>}

            <StylisticTextInput
              style={[
                styles.border,
                styles.padding,
                urlError && styles.errorBorder,
              ]}
              placeholder={t("serverUrl")}
              value={urlInput}
              onChangeText={(v) => {
                setUrlInput(v);
                setUrlError(null);
                setGeneralError(null);
              }}
            />
            {urlError && <ThemedText style={styles.errorText}>{urlError}</ThemedText>}
            {generalError && (
              <ThemedText style={styles.errorText}>{generalError}</ThemedText>
            )}

            <ActionButton
              label={editMode ? (t("applyChanges") ?? "Änderungen anwenden") : t("apply")}
              variant="secondary"
              icon="save"
              onPress={handleApply}
            />

            {/* Optional: Add-New Shortcut */}
            {editMode && (
              <ActionButton
                label={t("addNew") ?? "Neuen Server hinzufügen"}
                variant="secondary"
                icon="plus"
                onPress={startAddNew}
              />
            )}

            {busy && <ActivityIndicator />}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}