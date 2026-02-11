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
import { ActionButton } from "../../components/ui-elements/ActionButton";
import { Icon } from "../../components/ui-elements/Icon/Icon";
import {
  SelectableList,
  SelectableItem,
} from "../../components/ui-elements/SelectableList";

import { useAppDispatch } from "../../hooks/useAppDispatch";
import { setIpAsync } from "../../redux/slices/apiSlice";
import { initializeMenu } from "../../redux/slices/menuSlice";
import {
  addServer,
  selectServer,
  updateServer,
  removeServer,
} from "../../redux/slices/serverSlice";

import {
  checkServerReachable,
  normalizeBaseUrl,
  normalizeName,
} from "./serverCheck";

import { modalStyles } from "./styles";

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

function confirmDialog(
  title: string,
  message: string,
  okText = "OK",
  cancelText = "Abbrechen",
): Promise<boolean> {
  if (Platform.OS === "web") {
    // eslint-disable-next-line no-alert
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }

  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: cancelText, style: "cancel", onPress: () => resolve(false) },
      { text: okText, style: "default", onPress: () => resolve(true) },
    ]);
  });
}

function askSaveBeforeUse(): Promise<boolean> {
  if (Platform.OS === "web") {
    // eslint-disable-next-line no-alert
    return Promise.resolve(
      window.confirm(
        "Du hast Änderungen gemacht.\n\nMöchtest du die Änderungen speichern und den Server verwenden?",
      ),
    );
  }

  return new Promise((resolve) => {
    Alert.alert(
      "Änderungen speichern?",
      "Du hast Änderungen gemacht.\n\nMöchtest du speichern und den Server verwenden?",
      [
        { text: "Abbrechen", style: "cancel", onPress: () => resolve(false) },
        {
          text: "Speichern & verwenden",
          style: "default",
          onPress: () => resolve(true),
        },
      ],
    );
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

  const [nameInput, setNameInput] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [editMode, setEditMode] = useState(false);

  const serverItems = useMemo<SelectableItem<string>[]>(() => {
    return servers.map((s) => ({
      id: s.id,
      label: s.name,
      subtitle: s.baseUrl,
    }));
  }, [servers]);

  const firstError = urlError || nameError || generalError;

  function resetErrors() {
    setNameError(null);
    setUrlError(null);
    setGeneralError(null);
  }

  function startAddNew() {
    resetErrors();
    setEditMode(false);
    setNameInput("");
    setUrlInput("");
  }

  function getCurrentInputsNormalized() {
    return {
      name: normalizeName(nameInput) || "Custom",
      baseUrl: normalizeBaseUrl(urlInput),
    };
  }

  function hasUnsavedChanges(): boolean {
    const { name, baseUrl } = getCurrentInputsNormalized();

    if (!normalizeName(nameInput) && !normalizeBaseUrl(urlInput)) return false;

    if (editMode && selectedServer) {
      const currentName = normalizeName(selectedServer.name ?? "") || "";
      const currentUrl = normalizeBaseUrl(selectedServer.baseUrl ?? "");
      return currentName !== name || currentUrl !== baseUrl;
    }

    return !!nameInput.trim() || !!urlInput.trim();
  }

  async function handleDeleteSelected() {
    if (!selectedServer) return;

    const ok = await confirmDialog(
      "Server löschen?",
      `${selectedServer.name} (${selectedServer.baseUrl})`,
      "Löschen",
      "Abbrechen",
    );
    if (!ok) return;

    dispatch(removeServer(selectedServer.id));
  }

  async function ensureSelectedServerOnline(url: string): Promise<boolean> {
    setBusy(true);
    const check = await checkServerReachable(url);
    setBusy(false);

    if (check.ok) return true;

    
    setGeneralError(t("errors.serverNotReachable"));
    return false;
  }

  async function validateAndSaveOnly(): Promise<{
    ok: boolean;
    baseUrl?: string;
    serverLabel?: string;
  }> {
    resetErrors();

    const { name, baseUrl } = getCurrentInputsNormalized();

    if (!baseUrl) {
      setUrlError(t("errors.serverUrlRequired"));
      return { ok: false };
    }

    if (!/^https?:\/\//i.test(baseUrl)) {
      setUrlError(t("errors.serverUrlInvalid"));
      return { ok: false };
    }

    const isSameId = (id: string) => (selectedServer?.id ?? "") === id;

    const nameExists = servers.some((s) => {
      if (editMode && isSameId(s.id)) return false;
      return (s.name ?? "").toLowerCase() === name.toLowerCase();
    });
    if (nameExists) {
      setNameError(t("errors.serverNameExists"));
      return { ok: false };
    }

    const urlExists = servers.some((s) => {
      if (editMode && isSameId(s.id)) return false;
      return normalizeBaseUrl(s.baseUrl).toLowerCase() === baseUrl.toLowerCase();
    });
    if (urlExists) {
      setUrlError(t("errors.serverUrlExists"));
      return { ok: false };
    }

    const online = await ensureSelectedServerOnline(baseUrl);
    if (!online) {
      setUrlError(t("errors.serverNotReachable"));
      return { ok: false };
    }

    if (editMode && selectedServer) {
      dispatch(updateServer({ id: selectedServer.id, name, baseUrl }));
      return { ok: true, baseUrl, serverLabel: name };
    }

    const id =
      normalizeName(name).toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();

    dispatch(addServer({ id, name, baseUrl }));
    dispatch(selectServer(id));
    return { ok: true, baseUrl, serverLabel: name };
  }

  async function handleAddByPlus() {
    resetErrors();

    const { name, baseUrl } = getCurrentInputsNormalized();

    if (!baseUrl) {
      setUrlError(t("errors.serverUrlRequired"));
      return;
    }

    if (!/^https?:\/\//i.test(baseUrl)) {
      setUrlError(t("errors.serverUrlInvalid"));
      return;
    }

    const nameExists = servers.some(
      (s) => (s.name ?? "").toLowerCase() === name.toLowerCase(),
    );
    if (nameExists) {
      setNameError(t("errors.serverNameExists"));
      return;
    }

    const urlExists = servers.some(
      (s) => normalizeBaseUrl(s.baseUrl).toLowerCase() === baseUrl.toLowerCase(),
    );
    if (urlExists) {
      setUrlError(t("errors.serverUrlExists"));
      return;
    }

    const online = await ensureSelectedServerOnline(baseUrl);
    if (!online) {
      setUrlError(t("errors.serverNotReachable"));
      return;
    }

    const id =
      normalizeName(name).toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();

    dispatch(addServer({ id, name, baseUrl }));
    dispatch(selectServer(id));

    setEditMode(true);
    setNameInput(name);
    setUrlInput(baseUrl);
  }

  async function handleSaveSide() {
    const res = await validateAndSaveOnly();
    if (!res.ok || !res.baseUrl) return;
    setEditMode(true);
  }

  async function handleUseServer() {
    if (hasUnsavedChanges()) {
      const proceed = await askSaveBeforeUse();
      if (!proceed) return;

      const saved = await validateAndSaveOnly();
      if (!saved.ok || !saved.baseUrl) return;
    }

    const currentSelected = servers.find((s) => s.id === selectedServerId);
    const url = normalizeBaseUrl(currentSelected?.baseUrl ?? selectedBaseUrl);

    const online = await ensureSelectedServerOnline(url);
    if (!online) return;

    await dispatch(setIpAsync(url));
    await dispatch(initializeMenu());
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={modalStyles.backdrop} onPress={onClose}>
        <Pressable
          onPress={() => {}}
          style={{
            width: 500,
            maxWidth: "100%",
          
            padding: 16,
            gap: 14,
            borderWidth: 1,
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          }}
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

            <Pressable onPress={onClose} hitSlop={10}>
              <Icon name="close" size={20} color={theme.colors.text} />
            </Pressable>
          </View>

          {/* Inputs */}
          <View style={{ gap: 12 }}>
            <H4>{t("addServer")}</H4>

            {/* Name row */}
            <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
              <StylisticTextInput
                style={{
                  flex: 1,
                  padding: 5,
                  borderWidth: 1,
                
                  borderColor: nameError ? "red" : theme.colors.border,
                }}
                placeholder={t("serverLabel")}
                value={nameInput}
                onChangeText={(v) => {
                  setNameInput(v);
                  setNameError(null);
                  setGeneralError(null);
                }}
              />
              <ActionButton
                variant="secondary"
                icon="plus"
                onPress={handleAddByPlus}
                size="sm"
              />
            </View>

            {/* URL row */}
            <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
              <StylisticTextInput
                style={{
                  flex: 1,
                  padding: 5,
                  borderWidth: 1,
                  
                  borderColor: urlError ? "red" : theme.colors.border,
                }}
                placeholder={t("serverUrl")}
                value={urlInput}
                onChangeText={(v) => {
                  setUrlInput(v);
                  setUrlError(null);
                  setGeneralError(null);
                }}
              />
              <ActionButton
                variant="secondary"
                icon="save"
                onPress={handleSaveSide}
                size="sm"
              />
            </View>
          </View>

          
          <View style={{ minHeight: 5, justifyContent: "center" }}>
            { firstError ? (
              <ThemedText style={{ color: "red", fontSize: 12, lineHeight: 16 }} numberOfLines={2}>
                {firstError}
              </ThemedText>
            ) : (
              <ThemedText style={{ fontSize: 12, opacity: 0 }}> </ThemedText>
            )}
          </View>

          {/* Liste */}
          <View style={{ gap: 10,marginTop: -20 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                
              }}
            >
              <H4>{t("savedServers")}</H4>

              <ActionButton
                variant="secondary"
                icon="delete"
                onPress={handleDeleteSelected}
                size="sm"
                disabled={!selectedServer}
              />
            </View>

            <SelectableList
              variant="secondary"
              size="xs"
              items={serverItems}
              value={selectedServerId}
              onChange={(id) => {
                dispatch(selectServer(id));

                const s = servers.find((x) => x.id === id);
                if (s) {
                  setEditMode(true);
                  setNameInput(s.name ?? "");
                  setUrlInput(s.baseUrl ?? "");
                } else {
                  startAddNew();
                }

                resetErrors();
              }}
              maxHeight={260}
              showSearch={false}
              searchPlaceholder={t("search") ?? "Server suchen…"}
              emptyText={t("noServers") ?? "Keine Server gefunden"}
            />

            <ActionButton
              label={t("useServer")}
              variant="secondary"
              icon="check"
              onPress={handleUseServer}
              size="sm"
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
