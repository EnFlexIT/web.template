import React, { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { useUnistyles } from "react-native-unistyles";
import { useNavigation } from "@react-navigation/native";

import { Screen } from "../components/Screen";
import { Card } from "../components/ui-elements/Card";
import { ActionButton } from "../components/ui-elements/ActionButton";
import { StylisticTextInput } from "../components/stylistic/StylisticTextInput";
import { ThemedText } from "../components/themed/ThemedText";
import { H1 } from "../components/stylistic/H1";
import { H4 } from "../components/stylistic/H4";
import {
  SelectableList,
  SelectableItem,
} from "../components/ui-elements/SelectableList";

import { ServerLoginModal } from "../screens/login/ServerLoginModal";
import { useAppDispatch } from "../hooks/useAppDispatch";
import { useAppSelector } from "../hooks/useAppSelector";

import {
  selectServers,
  addServer,
  selectServer,
  updateServer,
  removeServer,
  ServerEnvironment,
} from "../redux/slices/serverSlice";

import {
  selectAuthenticationMethod,
  switchServer,
  getJwtForServer,
} from "../redux/slices/apiSlice";

import {
  checkServerReachable,
  normalizeBaseUrl,
  normalizeName,
} from "../screens/login/serverCheck";

type Server = {
  id: string;
  name: string;
  baseUrl: string;
};

function detectEnvironment(url: string): ServerEnvironment {
  const value = normalizeBaseUrl(url).toLowerCase();

  if (
    value.includes("localhost") ||
    value.includes("127.0.0.1") ||
    value.includes("192.168.") ||
    value.includes("10.") ||
    value.includes("172.16.") ||
    value.includes("172.17.") ||
    value.includes("172.18.") ||
    value.includes("172.19.") ||
    value.includes("172.20.") ||
    value.includes("172.21.") ||
    value.includes("172.22.") ||
    value.includes("172.23.") ||
    value.includes("172.24.") ||
    value.includes("172.25.") ||
    value.includes("172.26.") ||
    value.includes("172.27.") ||
    value.includes("172.28.") ||
    value.includes("172.29.") ||
    value.includes("172.30.") ||
    value.includes("172.31.") ||
    value.includes("dev")
  ) {
    return "DEV";
  }

  if (value.includes("test") || value.includes("staging")) {
    return "TEST";
  }

  return "PROD";
}

function toBase64(str: string) {
  return typeof btoa !== "undefined"
    ? btoa(str)
    : Buffer.from(str).toString("base64");
}

function extractBearerToken(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const m = value.match(/Bearer\s+(.+)/i);
  return m?.[1]?.trim() ?? null;
}

async function checkServerAuthenticated(
  baseUrl: string,
  jwt: string | null,
): Promise<boolean> {
  const base = normalizeBaseUrl(baseUrl);

  try {
    const res = await fetch(`${base}/api/alive`, {
      method: "GET",
      cache: "no-store",
      headers: jwt
        ? {
            Authorization: `Bearer ${jwt}`,
            Accept: "application/json",
          }
        : {
            Accept: "application/json",
          },
    });

    if (res.status === 200) return true;
    if (res.status === 401) return false;

    return false;
  } catch {
    return false;
  }
}

export function ServerSettingsScreen() {
  const { t } = useTranslation(["Login"]);
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const { theme } = useUnistyles();

  const authenticationMethod = useAppSelector(selectAuthenticationMethod);

  const serversState = useAppSelector(selectServers);
  const servers: Server[] = serversState?.servers ?? [];
  const activeServerId = serversState?.selectedServerId ?? "local";
  const activeServer = servers.find((s) => s.id === activeServerId);

  const [busy, setBusy] = useState(false);

  const [nameError, setNameError] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const [draftServerId, setDraftServerId] = useState(activeServerId);
  const [nameInput, setNameInput] = useState(activeServer?.name ?? "");
  const [urlInput, setUrlInput] = useState(activeServer?.baseUrl ?? "");
  const [editMode, setEditMode] = useState(true);

  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [pendingServerUrl, setPendingServerUrl] = useState<string | null>(null);
  const [pendingServerLabel, setPendingServerLabel] = useState<string>("");
  const [pendingServerId, setPendingServerId] = useState<string | null>(null);

  useEffect(() => {
    const draftServer = servers.find((s) => s.id === draftServerId);
    if (!draftServer) return;

    setEditMode(true);
    setNameInput(draftServer.name ?? "");
    setUrlInput(draftServer.baseUrl ?? "");
  }, [draftServerId, servers]);

  useEffect(() => {
    if (!servers.some((s) => s.id === draftServerId)) {
      setDraftServerId(activeServerId);
    }
  }, [servers, draftServerId, activeServerId]);

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
    setDraftServerId("__new__");
    setNameInput("");
    setUrlInput("");
  }

  function getCurrentInputsNormalized() {
    return {
      name: normalizeName(nameInput) || "Custom",
      baseUrl: normalizeBaseUrl(urlInput),
    };
  }

  async function ensureServerOnline(baseUrl: string): Promise<boolean> {
    const result = await checkServerReachable(baseUrl);
    return result.ok;
  }

  async function validateAndSaveOnly(
    options?: { forceCreate?: boolean },
  ): Promise<{
    ok: boolean;
    baseUrl?: string;
    serverLabel?: string;
    id?: string;
  }> {
    resetErrors();

    const { name, baseUrl } = getCurrentInputsNormalized();
    const forceCreate = options?.forceCreate ?? false;

    if (!baseUrl) {
      setUrlError(t("errors.serverUrlRequired"));
      return { ok: false };
    }

    if (!/^https?:\/\//i.test(baseUrl)) {
      setUrlError(t("errors.serverUrlInvalid"));
      return { ok: false };
    }

    const currentDraftServer = servers.find((s) => s.id === draftServerId);
    const currentDraftServerId =
      !forceCreate && editMode && currentDraftServer
        ? currentDraftServer.id
        : null;

    const nameExists = servers.some((s) => {
      if (currentDraftServerId && s.id === currentDraftServerId) {
        return false;
      }
      return normalizeName(s.name ?? "").toLowerCase() === name.toLowerCase();
    });

    if (nameExists) {
      setNameError(t("errors.serverNameExists"));
      return { ok: false };
    }

    const urlExists = servers.some((s) => {
      if (currentDraftServerId && s.id === currentDraftServerId) {
        return false;
      }
      return normalizeBaseUrl(s.baseUrl).toLowerCase() === baseUrl.toLowerCase();
    });

    if (urlExists) {
      setUrlError(t("errors.serverUrlExists"));
      return { ok: false };
    }

    setBusy(true);
    const online = await ensureServerOnline(baseUrl);
    setBusy(false);

    if (!online) {
      setUrlError(t("errors.serverNotReachable"));
      return { ok: false };
    }

    if (!forceCreate && editMode && currentDraftServer) {
      dispatch(updateServer({ id: currentDraftServer.id, name, baseUrl }));
      return {
        ok: true,
        baseUrl,
        serverLabel: name,
        id: currentDraftServer.id,
      };
    }

    const id = `${normalizeName(name).toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;

    dispatch(
      addServer({
        id,
        name,
        baseUrl,
        environment: detectEnvironment(baseUrl),
      }),
    );

    setDraftServerId(id);
    setEditMode(true);

    return {
      ok: true,
      baseUrl,
      serverLabel: name,
      id,
    };
  }

  async function handleAddByPlus() {
    if (busy || loginLoading) return;

    const result = await validateAndSaveOnly({ forceCreate: true });
    if (!result.ok || !result.baseUrl || !result.id) return;

    setDraftServerId(result.id);
    setNameInput(result.serverLabel ?? "");
    setUrlInput(result.baseUrl);
    resetErrors();
  }

  async function handleSaveSide() {
    if (busy || loginLoading) return;

    const result = await validateAndSaveOnly({ forceCreate: false });
    if (!result.ok) return;

    resetErrors();
  }

  async function handleDeleteSelected() {
    const currentDraftServer = servers.find((s) => s.id === draftServerId);
    if (!currentDraftServer || busy || loginLoading) return;

    dispatch(removeServer(currentDraftServer.id));
    startAddNew();

    const local = servers.find((s) => s.id === "local");
    if (local) {
      setDraftServerId(local.id);
      setNameInput(local.name ?? "");
      setUrlInput(local.baseUrl ?? "");
      setEditMode(true);
    }
  }

  async function handleUseServer() {
    if (busy || loginLoading) return;

    const saveResult = await validateAndSaveOnly({ forceCreate: false });
    if (!saveResult.ok || !saveResult.baseUrl) return;

    const newUrl = normalizeBaseUrl(saveResult.baseUrl);

    setBusy(true);
    const existingJwt = await getJwtForServer(newUrl);
    const alreadyAuthenticated = await checkServerAuthenticated(
      newUrl,
      existingJwt,
    );
    setBusy(false);

    if (!alreadyAuthenticated) {
      setPendingServerUrl(newUrl);
      setPendingServerLabel(saveResult.serverLabel ?? saveResult.baseUrl);
      setPendingServerId(saveResult.id ?? null);
      setLoginError(null);
      setLoginModalVisible(true);
      return;
    }

    await dispatch(
      switchServer({
        url: newUrl,
        initializeMenu: true,
      }),
    );

    if (saveResult.id) {
      dispatch(selectServer(saveResult.id));
      setDraftServerId(saveResult.id);
    }

    navigation.goBack();
  }

  async function handleServerLoginSubmit(params: {
    username: string;
    password: string;
  }) {
    if (!pendingServerUrl) return;

    setLoginLoading(true);
    setLoginError(null);

    try {
      if (authenticationMethod !== "jwt") {
        throw new Error("Aktuell wird nur JWT-Login unterstützt.");
      }

      const basic = toBase64(`${params.username}:${params.password}`);

      const res = await fetch(`${pendingServerUrl}/api/user/login`, {
        method: "GET",
        headers: {
          Authorization: `Basic ${basic}`,
          Accept: "application/json",
        },
        credentials: "include",
      });

      const hdr =
        res.headers.get("www-authenticate") ??
        res.headers.get("WWW-Authenticate") ??
        res.headers.get("authorization") ??
        res.headers.get("Authorization");

      const bodyText = await res.text();
      const bearerToken = extractBearerToken(hdr) ?? extractBearerToken(bodyText);

      if (!bearerToken) {
        throw new Error("Anmeldung fehlgeschlagen.");
      }

      await dispatch(
        switchServer({
          url: pendingServerUrl,
          providedJwt: bearerToken,
          initializeMenu: true,
        }),
      );

      if (pendingServerId) {
        dispatch(selectServer(pendingServerId));
        setDraftServerId(pendingServerId);
      }

      setLoginModalVisible(false);
      setPendingServerUrl(null);
      setPendingServerLabel("");
      setPendingServerId(null);
      setLoginError(null);

      navigation.goBack();
    } catch (err: any) {
      setLoginError(err?.message ?? "Anmeldung fehlgeschlagen.");
    } finally {
      setLoginLoading(false);
    }
  }

  return (
    <>
      <Screen>
        <Card style={{ width: "100%" }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <H1>{t("changeOrganization")}</H1>
          </View>

          <View style={{ gap: 12 }}>
            <H4>{t("addServer")}</H4>

            <View
              style={{
                flexDirection: "row",
                gap: 12,
                alignItems: "center",
              }}
            >
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
                disabled={busy || loginLoading}
              />
            </View>

            <View
              style={{
                flexDirection: "row",
                gap: 12,
                alignItems: "center",
              }}
            >
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
                disabled={busy || loginLoading}
              />
            </View>
          </View>

          <View style={{ minHeight: 20, justifyContent: "center" }}>
            {busy ? (
              <ThemedText style={{ fontSize: 12 }}>
                Server wird geprüft...
              </ThemedText>
            ) : firstError ? (
              <ThemedText
                style={{ color: "red", fontSize: 12, lineHeight: 16 }}
                numberOfLines={2}
              >
                {firstError}
              </ThemedText>
            ) : (
              <ThemedText style={{ fontSize: 12, opacity: 0 }}> </ThemedText>
            )}
          </View>

          <View style={{ gap: 10, marginTop: -10 }}>
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
                disabled={
                  !servers.find((s) => s.id === draftServerId) || busy || loginLoading
                }
              />
            </View>

            <SelectableList
              variant="secondary"
              size="xs0"
              items={serverItems}
              value={draftServerId}
              onChange={(id) => {
                if (busy || loginLoading) return;

                setDraftServerId(id);

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
              disabled={busy || loginLoading}
            />
          </View>
        </Card>
      </Screen>

      <ServerLoginModal
        visible={loginModalVisible}
        serverLabel={pendingServerLabel}
        loading={loginLoading}
        error={loginError}
        onClose={() => {
          if (loginLoading) return;
          setLoginModalVisible(false);
          setLoginError(null);
          setPendingServerUrl(null);
          setPendingServerLabel("");
          setPendingServerId(null);
        }}
        onSubmit={handleServerLoginSubmit}
      />
    </>
  );
}