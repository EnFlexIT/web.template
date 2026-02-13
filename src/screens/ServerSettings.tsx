import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useUnistyles } from "react-native-unistyles";
import { useNavigation } from "@react-navigation/native";

import { Screen } from "../components/Screen";
import { ActionButton } from "../components/ui-elements/ActionButton";
import { StylisticTextInput } from "../components/stylistic/StylisticTextInput";
import { ThemedText } from "../components/themed/ThemedText";
import { H1 } from "../components/stylistic/H1";
import { H2 } from "../components/stylistic/H2";
import { H4 } from "../components/stylistic/H4";

import {
  SelectableList,
  SelectableItem,
} from "../components/ui-elements/SelectableList";

import { useAppDispatch } from "../hooks/useAppDispatch";
import { useAppSelector } from "../hooks/useAppSelector";

import {
  selectServers,
  addServer,
  selectServer,
  updateServer,
  removeServer,
} from "../redux/slices/serverSlice";
import { selectIp, setIpAsync } from "../redux/slices/apiSlice";
import { initializeMenu } from "../redux/slices/menuSlice";

import {
  checkServerReachable,
  normalizeBaseUrl,
  normalizeName,
} from "../screens/login/serverCheck";
import { styles as loginStyles } from "../screens/login/styles";

type Server = {
  id: string;
  name: string;
  baseUrl: string;
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
      { text: okText, style: "destructive", onPress: () => resolve(true) },
    ]);
  });
}

function showInfo(title: string, message: string) {
  if (Platform.OS === "web") {
    // eslint-disable-next-line no-alert
    alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message, [{ text: "OK" }]);
}

export function ServerSettingsScreen() {
  const { t } = useTranslation(["Login"]);
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const { theme } = useUnistyles();

  // redux servers
  const serversState = useAppSelector(selectServers);
  const servers: Server[] = serversState?.servers ?? [];
  const selectedServerId = serversState?.selectedServerId ?? "local";
  const selectedServer = servers.find((s) => s.id === selectedServerId);

  // current ip fallback
  const ip = useAppSelector(selectIp);
  const selectedBaseUrl = normalizeBaseUrl(selectedServer?.baseUrl ?? ip);

  // UI state
  const [busy, setBusy] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // inputs
  const [nameInput, setNameInput] = useState(selectedServer?.name ?? "");
  const [urlInput, setUrlInput] = useState(selectedServer?.baseUrl ?? "");
  const [editMode, setEditMode] = useState(true);

  const serverItems = useMemo<SelectableItem<string>[]>(() => {
    return servers.map((s) => ({
      id: s.id,
      label: s.name,
      subtitle: s.baseUrl,
    }));
  }, [servers]);

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

  async function ensureSelectedServerOnline(url: string): Promise<boolean> {
    setBusy(true);
    const check = await checkServerReachable(url);
    setBusy(false);

    if (check.ok) return true;

    return false;
  }

  async function validateAndSaveOnly(): Promise<{
    ok: boolean;
    baseUrl?: string;
    serverLabel?: string;
    id?: string;
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
      return { ok: true, baseUrl, serverLabel: name, id: selectedServer.id };
    }

    const id =
      normalizeName(name).toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();

    dispatch(addServer({ id, name, baseUrl }));
    dispatch(selectServer(id));
    setEditMode(true);

    return { ok: true, baseUrl, serverLabel: name, id };
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
    startAddNew();

    const local = servers.find((s) => s.id === "local");
    if (local) {
      dispatch(selectServer("local"));
      setNameInput(local.name ?? "");
      setUrlInput(local.baseUrl ?? "");
      setEditMode(true);
    }
  }
  const firstError = urlError || nameError || generalError;

  async function handleUseServer() {
    const currentSelected = servers.find((s) => s.id === selectedServerId);
    const url = normalizeBaseUrl(currentSelected?.baseUrl ?? selectedBaseUrl);

    const online = await ensureSelectedServerOnline(url);
    if (!online) return;

    await dispatch(setIpAsync(url));
    await dispatch(initializeMenu());

 

    navigation.goBack();
  }

  return (
    <Screen>
     {/* Header */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <H1>{t("changeOrganization")}</H1>
    
                
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
              <View style={{ gap: 10,marginTop: -10 }}>
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
    </Screen>
  );
}
