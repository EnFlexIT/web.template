// src/screens/settings/ServerSettings.tsx
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  View,
  StyleSheet as RNStyleSheet,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useUnistyles } from "react-native-unistyles";
import { useNavigation } from "@react-navigation/native";

import { H1 } from "../components/stylistic/H1";
import { H4 } from "../components/stylistic/H4";
import { ThemedText } from "../components/themed/ThemedText";
import { StylisticTextInput } from "../components/stylistic/StylisticTextInput";
import { Dropdown } from "../components/ui-elements/Dropdown";
import { ActionButton } from "../components/ui-elements/ActionButton";
import { Card } from "../components/ui-elements/Card";
import { Screen } from "../components/Screen";

import { useAppDispatch } from "../hooks/useAppDispatch";
import { useAppSelector } from "../hooks/useAppSelector";

import {
  selectServers,
  addServer,
  selectServer,
  updateServer,
  removeServer,
} from "../redux/slices/serverSlice";
import { selectIp, setIpAsync, selectApi } from "../redux/slices/apiSlice";
import { initializeMenu } from "../redux/slices/menuSlice";

import {
  checkServerReachable,
  normalizeBaseUrl,
  normalizeName,
} from "../screens/login/serverCheck";
import { styles } from "../screens/login/styles";

type Server = {
  id: string;
  name: string;
  baseUrl: string;
};

function confirmDialog(title: string, message: string): Promise<boolean> {
  if (Platform.OS === "web") {
    // eslint-disable-next-line no-alert
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }

  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: "Abbrechen", style: "cancel", onPress: () => resolve(false) },
      { text: "Löschen", style: "destructive", onPress: () => resolve(true) },
    ]);
  });
}

export function ServerSettingsScreen() {
  const { t } = useTranslation(["Login"]);
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const { theme } = useUnistyles();

  const { isPointingToServer } = useAppSelector(selectApi);

  // servers redux
  const serversState = useAppSelector(selectServers);
  const servers: Server[] = serversState?.servers ?? [];
  const selectedServerId = serversState?.selectedServerId ?? "local";
  const selectedServer = servers.find((s) => s.id === selectedServerId);

  // current ip as fallback
  const ip = useAppSelector(selectIp);
  const selectedBaseUrl = selectedServer?.baseUrl ?? ip;


  const [pendingServerId, setPendingServerId] = useState<string>(selectedServerId);

  const pendingServer = servers.find((s) => s.id === pendingServerId);
  const pendingBaseUrl = pendingServer?.baseUrl ?? selectedBaseUrl;

  // UI states
  const [busy, setBusy] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const [useBusy, setUseBusy] = useState(false);

  // Add / Edit shared inputs
  const [nameInput, setNameInput] = useState("");
  const [urlInput, setUrlInput] = useState("");

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

  function showInfo(title: string, message: string) {
    Alert.alert(title, message);
  }


  async function handleUseSelectedServer() {
    resetErrors();

    const url = normalizeBaseUrl(pendingServer?.baseUrl ?? pendingBaseUrl);

    if (!url) {
      setUrlError(t("errors.serverUrlRequired"));
      return;
    }

    if (!/^https?:\/\//i.test(url)) {
      setUrlError(t("errors.serverUrlInvalid"));
      return;
    }

    setUseBusy(true);
    const check = await checkServerReachable(url);
    setUseBusy(false);

    if (!check.ok) {
      setUrlError(t("errors.serverNotReachable"));
      setGeneralError(check.message);

      showInfo(
        t("serverNotReachable") ?? "Server nicht erreichbar",
        check.message || (t("errors.serverNotReachable") ?? "Bitte URL prüfen."),
      );
      return;
    }

    //  Server ist erreichbar 
    dispatch(selectServer(pendingServerId));
    await dispatch(setIpAsync(url));
    await dispatch(initializeMenu());

    showInfo(
      t("successful") ?? "Erfolgreich",
      t("serverConnected") ?? "Server wurde erfolgreich verbunden und wird jetzt verwendet.",
    );

    navigation.goBack();
  }

  function startEditSelected() {
    resetErrors();
    //  edit basiert auf aktuell in Redux gespeicherten Server
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
    startAddNew();

    setPendingServerId((prev) => (prev === selectedServer.id ? "local" : prev));
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

    // EDIT
    if (editMode && selectedServer) {
      dispatch(updateServer({ id: selectedServer.id, name, baseUrl }));


      showInfo(
        t("successful") ?? "Erfolgreich",
        t("applyChanges") ?? "Änderungen gespeichert.",
      );

      setPendingServerId(selectedServer.id);

      return;
    }

    //  ADD
    const id =
      normalizeName(name).toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();

    dispatch(addServer({ id, name, baseUrl }));

    //  Nach Add: nur pending auswählen, nicht sofort verbinden
    setPendingServerId(id);

    showInfo(
      t("successful") ?? "Erfolgreich",
      t("addServer") ?? "Server gespeichert. Du kannst ihn jetzt verwenden.",
    );

    setNameInput("");
    setUrlInput("");
  }

  const mutedTextStyle = { color: theme.colors.text, opacity: 0.75 };

  return (
    <Screen>
      <View style={[screenStyles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View style={[screenStyles.headerRow]}>
          <ActionButton onPress={() => navigation.goBack()} icon="home" />
          <View style={{ flex: 1 }}>
            <H1>{t("changeOrganization")}</H1>
          </View>
        </View>

        <ScrollView contentContainerStyle={screenStyles.content}>
          {/* Current server card */}
          <Card padding="none">
            <View
              style={[
                screenStyles.currentCard,
                styles.border,
                { borderColor: theme.colors.border },
              ]}
            >
              <View style={{ flex: 1, gap: 4 }}>
                <H4>{t("currentServer")}</H4>
                <ThemedText style={[mutedTextStyle]} numberOfLines={1}>
                  {selectedBaseUrl || "-"}
                </ThemedText>

                
                
              </View>

              <View
                style={[
                  screenStyles.statusPill,
                  styles.border,
                  { borderColor: theme.colors.border },
                ]}
              >
                <H4>
                  {isPointingToServer ? t("serverReachable") : t("serverNotReachable")}
                </H4>
              </View>
            </View>
          </Card>

          {/* Saved servers */}
          <View style={{ gap: 8 }}>
            <H4>{t("savedServers")}</H4>
            <Dropdown
              value={pendingServerId}
              options={serverOptions}
              onChange={(id: string) => {
                setPendingServerId(id);
                startAddNew();
              }}
            />

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
              label={useBusy ? (t("loading") ?? "Prüfe...") : (t("useServer") ?? "Server verwenden")}
              variant="secondary"
              icon="check"
              onPress={handleUseSelectedServer}
              disabled={useBusy}
            />

            {useBusy && <ActivityIndicator />}
          </View>

          {/* Add/Edit form */}
          <View style={{ gap: 8 }}>
            <ThemedText>
              {editMode ? (t("editServer") ?? "Server bearbeiten") : t("addServer")}
            </ThemedText>

            <StylisticTextInput
              style={[styles.border, styles.padding, nameError && styles.errorBorder]}
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
              style={[styles.border, styles.padding, urlError && styles.errorBorder]}
              placeholder={t("serverUrl")}
              value={urlInput}
              onChangeText={(v) => {
                setUrlInput(v);
                setUrlError(null);
                setGeneralError(null);
              }}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {urlError && <ThemedText style={styles.errorText}>{urlError}</ThemedText>}
            {generalError && <ThemedText style={styles.errorText}>{generalError}</ThemedText>}

            <ActionButton
              label={editMode ? (t("applyChanges") ?? "Änderungen anwenden") : (t("apply") ?? "Anwenden")}
              variant="secondary"
              icon="save"
              onPress={handleApply}
              disabled={busy}
            />

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

          <View style={{ height: 24 }} />
        </ScrollView>
      </View>
    </Screen>
  );
}

const screenStyles = RNStyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 8,
  },
  content: {
    paddingHorizontal: 16,
    gap: 14,
    paddingBottom: 24,
    maxWidth: 700,
    width: "100%",
  },
  currentCard: {
    padding: 12,
    flexDirection: "row",
    gap: 10,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
});