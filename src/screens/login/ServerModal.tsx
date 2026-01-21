import React, { useState } from "react";
import { ActivityIndicator, Modal, Pressable, View } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useTranslation } from "react-i18next";
import { useUnistyles } from "react-native-unistyles";

import { Text } from "../../components/stylistic/Text";
import { ThemedText } from "../../components/themed/ThemedText";
import { StylisticTextInput } from "../../components/stylistic/StylisticTextInput";

import { useAppDispatch } from "../../hooks/useAppDispatch";

import { setIpAsync } from "../../redux/slices/apiSlice";
import { initializeMenu } from "../../redux/slices/menuSlice";
import { addServer, selectServer } from "../../redux/slices/serverSlice";

import { checkServerReachable, normalizeBaseUrl, normalizeName } from "./serverCheck";
import { styles, modalStyles } from "./styles";

type Props = {
  visible: boolean;
  onClose: () => void;

  servers: Array<{ id: string; name: string; baseUrl: string }>;
  selectedServerId: string;
  selectedBaseUrl: string; // fallback ip etc.
};

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

  const [serverSaveBusy, setServerSaveBusy] = useState(false);
  const [serverNameError, setServerNameError] = useState<string | null>(null);
  const [serverUrlError, setServerUrlError] = useState<string | null>(null);
  const [serverGeneralError, setServerGeneralError] = useState<string | null>(null);

  const [newServerLabel, setNewServerLabel] = useState("");
  const [newServerUrl, setNewServerUrl] = useState("");

  async function handleUseSelectedServer() {
    const url = normalizeBaseUrl(selectedServer?.baseUrl ?? selectedBaseUrl);
    await dispatch(setIpAsync(url));
    await dispatch(initializeMenu());
    onClose();
  }

  async function handleSaveAndUseServer() {
    setServerNameError(null);
    setServerUrlError(null);
    setServerGeneralError(null);

    const name = normalizeName(newServerLabel) || "Custom";
    const baseUrl = normalizeBaseUrl(newServerUrl);

    if (!baseUrl) {
      setServerUrlError(t("errors.serverUrlRequired"));
      return;
    }
    if (!/^https?:\/\//i.test(baseUrl)) {
      setServerUrlError(t("errors.serverUrlInvalid"));
      return;
    }

    // duplicates (defensiv gegen kaputte Daten)
    const nameExists = servers.some((s) => {
      const existingName = (s?.name ?? "").toString().trim().toLowerCase();
      return existingName === name.toLowerCase();
    });
    if (nameExists) {
      setServerNameError(t("errors.serverNameExists"));
      return;
    }

    const urlExists = servers.some((s) => {
      const existingUrl = normalizeBaseUrl((s?.baseUrl ?? "").toString()).toLowerCase();
      return existingUrl === baseUrl.toLowerCase();
    });
    if (urlExists) {
      setServerUrlError(t("errors.serverUrlExists"));
      return;
    }

    // reachability check
    setServerSaveBusy(true);
    const check = await checkServerReachable(baseUrl);
    setServerSaveBusy(false);

    if (!check.ok) {
      setServerUrlError(t("errors.serverNotReachable"));
      setServerGeneralError(check.message);
      return;
    }

    // id
    const idBase = name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-_]/g, "");

    const newId = `${idBase}-${Date.now()}`;

    dispatch(
      addServer({
        id: newId,
        name,
        baseUrl,
      }),
    );

    dispatch(selectServer(newId)); // sofort auswählen

    await dispatch(setIpAsync(baseUrl));
    await dispatch(initializeMenu());

    setNewServerLabel("");
    setNewServerUrl("");
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={modalStyles.backdrop}>
        <View
          style={[
            modalStyles.card,
            styles.border,
            { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
          ]}
        >
          <Text style={{ fontWeight: "800", fontSize: 16 }}>
            {t("changeOrganization")}
          </Text>

          {/* Saved servers */}
          <View style={{ gap: 6 }}>
            <ThemedText>{t("savedServers")}</ThemedText>

            <Picker
              selectedValue={selectedServerId}
              onValueChange={(id) => dispatch(selectServer(id))}
            >
              {servers.map((s) => (
                <Picker.Item
                  key={s.id}
                  label={`${s.name} (${s.baseUrl})`}
                  value={s.id}
                />
              ))}
            </Picker>

            <Pressable
              style={[styles.border, styles.padding, styles.loginContainer]}
              onPress={handleUseSelectedServer}
            >
              <Text style={styles.login}>{t("useServer")}</Text>
            </Pressable>
          </View>

          {/* Add server */}
          <View style={{ gap: 6 }}>
            <ThemedText>{t("addServer")}</ThemedText>

            <StylisticTextInput
              style={[
                styles.border,
                styles.padding,
                serverNameError && styles.errorBorder,
              ]}
              placeholder={t("serverLabel")}
              value={newServerLabel}
              onChangeText={(v) => {
                setNewServerLabel(v);
                setServerNameError(null);
                setServerGeneralError(null);
              }}
            />
            {serverNameError && (
              <ThemedText style={styles.errorText}>{serverNameError}</ThemedText>
            )}

            <StylisticTextInput
              style={[
                styles.border,
                styles.padding,
                serverUrlError && styles.errorBorder,
              ]}
              placeholder={t("serverUrl")}
              value={newServerUrl}
              onChangeText={(v) => {
                setNewServerUrl(v);
                setServerUrlError(null);
                setServerGeneralError(null);
              }}
            />
            {serverUrlError && (
              <ThemedText style={styles.errorText}>{serverUrlError}</ThemedText>
            )}

            {serverGeneralError && (
              <ThemedText style={styles.errorText}>{serverGeneralError}</ThemedText>
            )}

            <Pressable
              style={[
                styles.border,
                styles.padding,
                styles.loginContainer,
                serverSaveBusy && { opacity: 0.6 },
              ]}
              disabled={serverSaveBusy}
              onPress={handleSaveAndUseServer}
            >
              {serverSaveBusy ? (
                <ActivityIndicator />
              ) : (
                <Text style={styles.login}>{t("saveAndUse")}</Text>
              )}
            </Pressable>
          </View>

          <Pressable onPress={onClose}>
            <ThemedText>{t("close")}</ThemedText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
