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
import { Pressable } from "react-native";
import { Screen } from "../components/Screen";
import { Card } from "../components/ui-elements/Card";
import { ActionButton } from "../components/ui-elements/ActionButton";
import { StylisticTextInput } from "../components/stylistic/StylisticTextInput";
import { ThemedText } from "../components/themed/ThemedText";
import { Icon } from "../components/ui-elements/Icon/Icon";

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
import { selectIp, setIpAsync, selectApi } from "../redux/slices/apiSlice";
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

  const { isPointingToServer } = useAppSelector(selectApi);

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
  const [editMode, setEditMode] = useState(true); // im Screen ist das meistens "edit" wenn was gewählt ist

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

    showInfo(
      "Server nicht erreichbar",
      `${check.message || ""}\n\nBitte wähle einen anderen Server.`,
    );
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

    // online check
    const online = await ensureSelectedServerOnline(baseUrl);
    if (!online) {
      setUrlError(t("errors.serverNotReachable"));
      return { ok: false };
    }

    // edit/add
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

  // PLUS: direkt neu hinzufügen (mit Duplicate-Check + Meldung)
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
      showInfo(
        "Name bereits vorhanden",
        "Dieser Server-Name existiert bereits. Bitte wähle einen neuen Namen.",
      );
      setNameError(t("errors.serverNameExists"));
      return;
    }

    const urlExists = servers.some(
      (s) =>
        normalizeBaseUrl(s.baseUrl).toLowerCase() === baseUrl.toLowerCase(),
    );
    if (urlExists) {
      showInfo(
        "Adresse bereits vorhanden",
        "Diese Server-Adresse ist bereits gespeichert. Bitte trage eine neue Adresse ein.",
      );
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

    showInfo("Server hinzugefügt", `${name}\n\n${baseUrl}`);
  }

  async function handleSaveSide() {
    const res = await validateAndSaveOnly();
    if (!res.ok || !res.baseUrl) return;

    showInfo(
      "Server gespeichert",
      `${res.serverLabel ?? "Server"} ist online und wurde gespeichert.\n\n${res.baseUrl}`,
    );
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

    // Fallback selection: local, falls existiert
    const local = servers.find((s) => s.id === "local");
    if (local) {
      dispatch(selectServer("local"));
      setNameInput(local.name ?? "");
      setUrlInput(local.baseUrl ?? "");
      setEditMode(true);
    }
  }

  async function handleUseServer() {
    const currentSelected = servers.find((s) => s.id === selectedServerId);
    const url = normalizeBaseUrl(currentSelected?.baseUrl ?? selectedBaseUrl);

    const online = await ensureSelectedServerOnline(url);
    if (!online) return;

    await dispatch(setIpAsync(url));
    await dispatch(initializeMenu());

    showInfo(
      t("successful") ?? "Erfolgreich",
      t("serverConnected") ??
        "Server wurde erfolgreich verbunden und wird jetzt verwendet.",
    );

    navigation.goBack();
  }

  const mutedTextStyle = { color: theme.colors.text, opacity: 0.75 };

  return (
    <Screen>
      <View
        style={[
          screenStyles.container,
          { backgroundColor: theme.colors.background },
        ]}
      >
        {/* Header */}
        <View style={screenStyles.headerRow}>
          <ActionButton
            onPress={() => navigation.goBack()}
           icon="home"
          />
         

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
                loginStyles.border,
                { borderColor: theme.colors.border },
              ]}
            >
              <View style={{ flex: 1, gap: 4 }}>
                <H4>{t("currentServer") ?? "Aktueller Server"}</H4>
                <ThemedText style={[mutedTextStyle]} numberOfLines={1}>
                  {selectedBaseUrl || "-"}
                </ThemedText>
              </View>

              <View
                style={[
                  screenStyles.statusPill,
                  loginStyles.border,
                  { borderColor: theme.colors.border },
                ]}
              >
                <H4>
                  {isPointingToServer
                    ? t("serverReachable") ?? "Erreichbar"
                    : t("serverNotReachable") ?? "Nicht erreichbar"}
                </H4>
              </View>
            </View>
          </Card>

          {/* Inputs (wie Modal) */}
          <View style={{ gap: 12 }}>
            <H2>
              {editMode
                ? t("editServer") ?? "Server bearbeiten"
                : t("addServer") ?? "Server hinzufügen"}
            </H2>

            {nameError && (
              <ThemedText style={loginStyles.errorText}>{nameError}</ThemedText>
            )}

            <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
              <StylisticTextInput
                style={[
                  loginStyles.border,
                  loginStyles.padding,
                  { flex: 1 },
                  nameError && loginStyles.errorBorder,
                ]}
                placeholder={t("serverLabel") ?? "Server-Name"}
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
              />
            </View>

            <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
              <StylisticTextInput
                style={[
                  loginStyles.border,
                  loginStyles.padding,
                  { flex: 1 },
                  urlError && loginStyles.errorBorder,
                ]}
                placeholder={t("serverUrl") ?? "Server-URL"}
                value={urlInput}
                onChangeText={(v) => {
                  setUrlInput(v);
                  setUrlError(null);
                  setGeneralError(null);
                }}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <ActionButton
                variant="secondary"
                icon="save"
                onPress={handleSaveSide}
              />
            </View>

            {urlError && (
              <ThemedText style={loginStyles.errorText}>{urlError}</ThemedText>
            )}
            {generalError && (
              <ThemedText style={loginStyles.errorText}>
                {generalError}
              </ThemedText>
            )}
            {busy && <ActivityIndicator />}
          </View>

          {/* Liste (wie Modal) */}
          <View style={{ gap: 12 }}>
            <H4>{t("savedServers") ?? "Gespeicherte Server"}</H4>

            <View style={{ flexDirection: "row", gap: 12, alignItems: "stretch" }}>
              <View style={{ flex: 1 }}>
                <SelectableList
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
                  maxHeight={320}
                  showSearch={false}
                  searchPlaceholder={t("search") ?? "Server suchen…"}
                  emptyText={t("noServers") ?? "Keine Server gefunden"}
                />
              </View>

              <View
                style={{
                  width: 56,
                  justifyContent: "flex-start",
                  paddingTop: 8,
                }}
              >
                <ActionButton
                  variant="secondary"
                  icon="delete"
                  onPress={handleDeleteSelected}
                />
              </View>
            </View>

            <ActionButton
              label={t("useServer") ?? "Server verwenden"}
              variant="secondary"
              icon="check"
              onPress={handleUseServer}
            />
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
    gap: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 16,
    gap: 16,
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