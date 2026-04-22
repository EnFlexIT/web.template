import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useUnistyles } from "react-native-unistyles";
import { useNavigation } from "@react-navigation/native";

import { Screen } from "../components/Screen";
import { Card } from "../components/ui-elements/Card";
import { ActionButton } from "../components/ui-elements/ActionButton";
import { ConfirmModal } from "../components/ui-elements/ConfirmModal";
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
  switchServer,
  getJwtForServer,
  type AuthMethod,
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

type ServerAuthInfo = {
  authenticated: boolean;
  authenticationMethod: AuthMethod;
  oidcBearer: string | null;
  sessionInvalid: boolean;
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

export function ServerSettingsScreen() {
  const { t } = useTranslation(["Login"]);
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const { theme } = useUnistyles();

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
  const [pendingServerAuthMethod, setPendingServerAuthMethod] =
    useState<AuthMethod>("unknown");
  const [pendingOidcBearer, setPendingOidcBearer] = useState<string | null>(null);

  const [showOidcConfirm, setShowOidcConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showUseSaveConfirm, setShowUseSaveConfirm] = useState(false);

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
  const currentDraftServer = servers.find((s) => s.id === draftServerId);

  function resetErrors() {
    setNameError(null);
    setUrlError(null);
    setGeneralError(null);
  }

  function resetPendingAuthState() {
    setPendingServerUrl(null);
    setPendingServerLabel("");
    setPendingServerId(null);
    setPendingServerAuthMethod("unknown");
    setPendingOidcBearer(null);
    setLoginError(null);
    setLoginModalVisible(false);
    setShowOidcConfirm(false);
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

  function hasUnsavedChanges(): boolean {
    const { name, baseUrl } = getCurrentInputsNormalized();

    if (!normalizeName(nameInput) && !normalizeBaseUrl(urlInput)) return false;

    if (editMode && currentDraftServer) {
      const currentName = normalizeName(currentDraftServer.name ?? "") || "";
      const currentUrl = normalizeBaseUrl(currentDraftServer.baseUrl ?? "");
      return currentName !== name || currentUrl !== baseUrl;
    }

    return !!nameInput.trim() || !!urlInput.trim();
  }

  async function ensureServerOnline(baseUrl: string): Promise<boolean> {
    setBusy(true);
    const result = await checkServerReachable(baseUrl);
    setBusy(false);

    if (result.ok) return true;

    setGeneralError(t("errors.serverNotReachable"));
    return false;
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

    const editableServer =
      !forceCreate && editMode && currentDraftServer ? currentDraftServer : null;

    const editableServerId = editableServer?.id ?? null;

    const nameExists = servers.some((s) => {
      if (editableServerId && s.id === editableServerId) return false;
      return normalizeName(s.name ?? "").toLowerCase() === name.toLowerCase();
    });

    if (nameExists) {
      setNameError(t("errors.serverNameExists"));
      return { ok: false };
    }

    const urlExists = servers.some((s) => {
      if (editableServerId && s.id === editableServerId) return false;
      return normalizeBaseUrl(s.baseUrl).toLowerCase() === baseUrl.toLowerCase();
    });

    if (urlExists) {
      setUrlError(t("errors.serverUrlExists"));
      return { ok: false };
    }

    const online = await ensureServerOnline(baseUrl);
    if (!online) {
      setUrlError(t("errors.serverNotReachable"));
      return { ok: false };
    }

    if (editableServer) {
      dispatch(updateServer({ id: editableServer.id, name, baseUrl }));
      return {
        ok: true,
        baseUrl,
        serverLabel: name,
        id: editableServer.id,
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

  function handleSaveSide() {
    if (busy || loginLoading) return;
    if (!hasUnsavedChanges()) return;

    setShowSaveConfirm(true);
  }

  async function confirmSaveSide() {
    setShowSaveConfirm(false);

    const result = await validateAndSaveOnly({ forceCreate: false });
    if (!result.ok) return;

    resetErrors();
  }

  function handleDeleteSelected() {
    if (!currentDraftServer || busy || loginLoading) return;
    setShowDeleteConfirm(true);
  }

  function confirmDeleteSelected() {
    if (!currentDraftServer) return;

    dispatch(removeServer(currentDraftServer.id));
    setShowDeleteConfirm(false);
    startAddNew();

    const local = servers.find((s) => s.id === "local" && s.id !== currentDraftServer.id);
    if (local) {
      setDraftServerId(local.id);
      setNameInput(local.name ?? "");
      setUrlInput(local.baseUrl ?? "");
      setEditMode(true);
    }
  }

  async function proceedUseServerAfterOptionalSave(skipSave = false) {
    let targetUrl = "";
    let targetId: string | null = null;
    let targetLabel = "";

    if (hasUnsavedChanges() && !skipSave) {
      const saveResult = await validateAndSaveOnly({ forceCreate: false });
      if (!saveResult.ok || !saveResult.baseUrl) return;

      targetUrl = normalizeBaseUrl(saveResult.baseUrl);
      targetId = saveResult.id ?? null;
      targetLabel = saveResult.serverLabel ?? saveResult.baseUrl;
    } else {
      const draftServer = servers.find((s) => s.id === draftServerId);

      targetUrl = normalizeBaseUrl(draftServer?.baseUrl ?? urlInput);
      targetId = draftServer?.id ?? null;
      targetLabel = draftServer?.name ?? draftServer?.baseUrl ?? targetUrl;

      if (!targetUrl) {
        setUrlError(t("errors.serverUrlRequired"));
        return;
      }

      const online = await ensureServerOnline(targetUrl);
      if (!online) {
        setUrlError(t("errors.serverNotReachable"));
        return;
      }
    }
async function checkServerAuthenticated(
  baseUrl: string,
  jwt: string | null,
): Promise<ServerAuthInfo> {
  const normalized = normalizeBaseUrl(baseUrl);

  try {
    const res = await fetch(`${normalized}/api/app/settings/get`, {
      method: "GET",
      cache: "no-store",
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
      },
    });

    if (res.status === 400) {
      return {
        authenticated: false,
        authenticationMethod: "unknown",
        oidcBearer: null,
        sessionInvalid: true,
      };
    }

    if (!res.ok) {
      return {
        authenticated: false,
        authenticationMethod: "unknown",
        oidcBearer: null,
        sessionInvalid: false,
      };
    }

    const data = await res.json();
    const entries = Array.isArray(data?.propertyEntries) ? data.propertyEntries : [];

    const authCfg = entries.find(
      (entry: any) => entry?.key === "_ServerWideSecurityConfiguration",
    )?.value;

    const authenticatedRaw = entries.find(
      (entry: any) => entry?.key === "_Authenticated",
    )?.value;

    const oidcBearer = entries.find(
      (entry: any) => entry?.key === "_oidc.bearer",
    )?.value;

    const hasSessionId = entries.some(
      (entry: any) => entry?.key === "_session.id",
    );

    const hasSessionPathParameter = entries.some(
      (entry: any) => entry?.key === "_session.pathParameter",
    );

    const authenticated =
      typeof authenticatedRaw === "boolean"
        ? authenticatedRaw
        : String(authenticatedRaw).toLowerCase() === "true";

    let authenticationMethod: AuthMethod = "unknown";

    if (authCfg === "OIDCSecurityHandler") {
      authenticationMethod = "oidc";
    } else if (authCfg === "JwtSingleUserSecurityHandler") {
      authenticationMethod = "jwt";
    } else if (oidcBearer || hasSessionId || hasSessionPathParameter) {
      authenticationMethod = "oidc";
    } else if (jwt) {
      authenticationMethod = "jwt";
    } else {
      authenticationMethod = "jwt";
    }

    return {
      authenticated,
      authenticationMethod,
      oidcBearer: typeof oidcBearer === "string" ? oidcBearer : null,
      sessionInvalid: false,
    };
  } catch {
    return {
      authenticated: false,
      authenticationMethod: "unknown",
      oidcBearer: null,
      sessionInvalid: false,
    };
  }
}
    setBusy(true);
    const existingJwt = await getJwtForServer(targetUrl);
    const info = await checkServerAuthenticated(targetUrl, existingJwt);
    setBusy(false);

    if (info.authenticated) {
      await dispatch(
        switchServer({
          url: targetUrl,
          initializeMenu: true,
        }),
      );

      if (targetId) {
        dispatch(selectServer(targetId));
        setDraftServerId(targetId);
      }

      navigation.goBack();
      return;
    }

    // JWT -> alter Login-Dialog
    if (info.authenticationMethod === "jwt") {
      setPendingServerUrl(targetUrl);
      setPendingServerLabel(targetLabel);
      setPendingServerId(targetId);
      setPendingServerAuthMethod("jwt");
      setPendingOidcBearer(null);
      setLoginError(null);
      setLoginModalVisible(true);
      return;
    }

    // OIDC oder unknown -> OpenID-Dialog
    setPendingServerUrl(targetUrl);
    setPendingServerLabel(targetLabel);
    setPendingServerId(targetId);
    setPendingServerAuthMethod(
      info.authenticationMethod === "oidc" ? "oidc" : "unknown",
    );
    setPendingOidcBearer(info.oidcBearer ?? null);
    setLoginError(null);
    setShowOidcConfirm(true);
  }

  function handleUseServer() {
    if (busy || loginLoading) return;

    if (hasUnsavedChanges()) {
      setShowUseSaveConfirm(true);
      return;
    }

    void proceedUseServerAfterOptionalSave(true);
  }

  async function confirmUseWithSave() {
    setShowUseSaveConfirm(false);
    await proceedUseServerAfterOptionalSave(false);
  }

  async function handleServerLoginSubmit(params: {
    username: string;
    password: string;
  }) {
    if (!pendingServerUrl) return;

    setLoginLoading(true);
    setLoginError(null);

    try {
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

      resetPendingAuthState();
      navigation.goBack();
    } catch (err: any) {
      setLoginError(err?.message ?? "Anmeldung fehlgeschlagen.");
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleOidcConfirm() {
    if (!pendingServerUrl || loginLoading) return;

    setLoginLoading(true);
    setLoginError(null);

    try {
      await dispatch(
        switchServer({
          url: pendingServerUrl,
          providedJwt: pendingOidcBearer ?? undefined,
          initializeMenu: !!pendingOidcBearer,
        }),
      );

      if (pendingServerId) {
        dispatch(selectServer(pendingServerId));
        setDraftServerId(pendingServerId);
      }

      resetPendingAuthState();
      navigation.goBack();
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
                tooltip={t("addServer")}
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
                tooltip={t("saveServer")}
              />
            </View>
          </View>

          <View
            style={{
              minHeight: 24,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            {busy && <ActivityIndicator size="small" />}

            {firstError ? (
              <ThemedText
                style={{ color: "red", fontSize: 12, lineHeight: 16, flex: 1 }}
                numberOfLines={2}
              >
                {firstError}
              </ThemedText>
            ) : (
              <ThemedText style={{ fontSize: 12, opacity: 0, flex: 1 }}>
                Platzhalter
              </ThemedText>
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
                disabled={!currentDraftServer || busy || loginLoading}
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
        authMethod="jwt"
        loading={loginLoading}
        error={loginError}
        onClose={() => {
          if (loginLoading) return;
          resetPendingAuthState();
        }}
        onSubmit={handleServerLoginSubmit}
      />

      <ConfirmModal
        visible={showOidcConfirm}
        title="OpenID Connect"
        message={`Für "${pendingServerLabel}" wurde OpenID Connect erkannt. Möchten Sie mit OpenID anmelden?`}
        confirmLabel="Mit OpenID anmelden"
        cancelLabel={t("cancel")}
        onConfirm={handleOidcConfirm}
        onCancel={() => {
          if (loginLoading) return;
          resetPendingAuthState();
        }}
      />

      <ConfirmModal
        visible={showSaveConfirm}
        title={t("confirmSaveChanges")}
        message={t("confirmSaveChangesMessage")}
        confirmLabel={t("yes")}
        cancelLabel={t("cancel")}
        onConfirm={confirmSaveSide}
        onCancel={() => setShowSaveConfirm(false)}
      />

      <ConfirmModal
        visible={showDeleteConfirm}
        title={t("confirmDeleteServer")}
        message={
          currentDraftServer
            ? `${currentDraftServer.name} (${currentDraftServer.baseUrl})`
            : t("confirmDeleteServerMessage")
        }
        confirmLabel={t("delete")}
        cancelLabel={t("cancel")}
        confirmIcon="delete"
        onConfirm={confirmDeleteSelected}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      <ConfirmModal
        visible={showUseSaveConfirm}
        title={t("confirmSaveChanges")}
        message={t("confirmSaveChangesMessage")}
        confirmLabel={t("yes")}
        cancelLabel={t("cancel")}
        onConfirm={confirmUseWithSave}
        onCancel={() => setShowUseSaveConfirm(false)}
      />
    </>
  );
}