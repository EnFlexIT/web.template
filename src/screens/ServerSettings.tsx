import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useUnistyles } from "react-native-unistyles";
import { useNavigation } from "@react-navigation/native";
import { Buffer } from "buffer";

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
  selectIp,
  type AuthMethod,
} from "../redux/slices/apiSlice";

import {
  checkServerReachable,
  normalizeBaseUrl,
  normalizeName,
} from "../core/server/serverCheck";

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

function toBase64(value: string): string {
  return typeof btoa !== "undefined"
    ? btoa(value)
    : Buffer.from(value).toString("base64");
}

function extractBearerToken(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const match = value.match(/Bearer\s+(.+)/i);

  return match?.[1]?.trim() ?? null;
}

async function checkServerAuthenticated(
  baseUrl: string,
  jwt: string | null,
): Promise<ServerAuthInfo> {
  const normalizedUrl = normalizeBaseUrl(baseUrl);

  try {
    const response = await fetch(
      `${normalizedUrl}/api/app/settings/get`,
      {
        method: "GET",
        cache: "no-store",
        credentials: "include",
        headers: {
          Accept: "application/json",
          ...(jwt
            ? {
                Authorization: `Bearer ${jwt}`,
              }
            : {}),
        },
      },
    );

    if (response.status === 400) {
      return {
        authenticated: false,
        authenticationMethod: "unknown",
        oidcBearer: null,
        sessionInvalid: true,
      };
    }

    if (!response.ok) {
      return {
        authenticated: false,
        authenticationMethod: "unknown",
        oidcBearer: null,
        sessionInvalid: false,
      };
    }

    const data = await response.json();

    const entries = Array.isArray(data?.propertyEntries)
      ? data.propertyEntries
      : [];

    const authenticationConfiguration = entries.find(
      (entry: any) =>
        entry?.key === "_ServerWideSecurityConfiguration",
    )?.value;

    const authenticatedValue = entries.find(
      (entry: any) => entry?.key === "_Authenticated",
    )?.value;

    const oidcBearerValue = entries.find(
      (entry: any) => entry?.key === "_oidc.bearer",
    )?.value;

    const hasSessionId = entries.some(
      (entry: any) => entry?.key === "_session.id",
    );

    const hasSessionPathParameter = entries.some(
      (entry: any) =>
        entry?.key === "_session.pathParameter",
    );

    const authenticated =
      typeof authenticatedValue === "boolean"
        ? authenticatedValue
        : String(authenticatedValue).toLowerCase() === "true";

    let authenticationMethod: AuthMethod = "unknown";

    if (
      authenticationConfiguration ===
      "OIDCSecurityHandler"
    ) {
      authenticationMethod = "oidc";
    } else if (
      authenticationConfiguration ===
      "JwtSingleUserSecurityHandler"
    ) {
      authenticationMethod = "jwt";
    } else if (
      oidcBearerValue ||
      hasSessionId ||
      hasSessionPathParameter
    ) {
      authenticationMethod = "oidc";
    } else {
      authenticationMethod = "jwt";
    }

    return {
      authenticated,
      authenticationMethod,
      oidcBearer:
        typeof oidcBearerValue === "string"
          ? oidcBearerValue
          : null,
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

export function ServerSettingsScreen() {
  const { t } = useTranslation(["Login"]);
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const { theme } = useUnistyles();

  const serversState = useAppSelector(selectServers);
  const activeServerUrl = useAppSelector(selectIp);

  const servers: Server[] = serversState?.servers ?? [];

  const activeServerId =
    serversState?.selectedServerId ?? "local";

  const activeServer = servers.find(
    (server) => server.id === activeServerId,
  );

  const [busy, setBusy] = useState(false);

  const [nameError, setNameError] = useState<string | null>(
    null,
  );

  const [urlError, setUrlError] = useState<string | null>(
    null,
  );

  const [generalError, setGeneralError] = useState<
    string | null
  >(null);

  const [draftServerId, setDraftServerId] =
    useState(activeServerId);

  const [nameInput, setNameInput] = useState(
    activeServer?.name ?? "",
  );

  const [urlInput, setUrlInput] = useState(
    activeServer?.baseUrl ?? "",
  );

  const [editMode, setEditMode] = useState(true);

  const [loginModalVisible, setLoginModalVisible] =
    useState(false);

  const [loginLoading, setLoginLoading] = useState(false);

  const [loginError, setLoginError] = useState<
    string | null
  >(null);

  const [pendingServerUrl, setPendingServerUrl] =
    useState<string | null>(null);

  const [pendingServerLabel, setPendingServerLabel] =
    useState("");

  const [pendingServerId, setPendingServerId] =
    useState<string | null>(null);

  const [showSaveConfirm, setShowSaveConfirm] =
    useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] =
    useState(false);

  const [showUseSaveConfirm, setShowUseSaveConfirm] =
    useState(false);

  useEffect(() => {
    const draftServer = servers.find(
      (server) => server.id === draftServerId,
    );

    if (!draftServer) {
      return;
    }

    setEditMode(true);
    setNameInput(draftServer.name ?? "");
    setUrlInput(draftServer.baseUrl ?? "");
  }, [draftServerId, servers]);

  useEffect(() => {
    if (draftServerId === "__new__") {
      return;
    }

    const draftServerStillExists = servers.some(
      (server) => server.id === draftServerId,
    );

    if (!draftServerStillExists) {
      setDraftServerId(activeServerId);
    }
  }, [servers, draftServerId, activeServerId]);

  const serverItems = useMemo<SelectableItem<string>[]>(
    () =>
      servers.map((server) => ({
        id: server.id,
        label: server.name,
        subtitle: server.baseUrl,
      })),
    [servers],
  );

  const currentDraftServer = servers.find(
    (server) => server.id === draftServerId,
  );

  const firstError =
    urlError || nameError || generalError;

  function resetErrors() {
    setNameError(null);
    setUrlError(null);
    setGeneralError(null);
  }

  function resetPendingAuthState() {
    setPendingServerUrl(null);
    setPendingServerLabel("");
    setPendingServerId(null);
    setLoginError(null);
    setLoginModalVisible(false);
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
    const { name, baseUrl } =
      getCurrentInputsNormalized();

    const normalizedNameInput = normalizeName(nameInput);
    const normalizedUrlInput =
      normalizeBaseUrl(urlInput);

    if (!normalizedNameInput && !normalizedUrlInput) {
      return false;
    }

    if (editMode && currentDraftServer) {
      const currentName =
        normalizeName(currentDraftServer.name ?? "") || "";

      const currentUrl = normalizeBaseUrl(
        currentDraftServer.baseUrl ?? "",
      );

      return currentName !== name || currentUrl !== baseUrl;
    }

    return Boolean(nameInput.trim() || urlInput.trim());
  }

  const hasChanges = hasUnsavedChanges();

  const normalizedDraftUrl =
    normalizeBaseUrl(urlInput);

  const normalizedActiveServerUrl = normalizeBaseUrl(
    activeServerUrl || activeServer?.baseUrl || "",
  );

  const hasValidServerUrl =
    /^https?:\/\//i.test(normalizedDraftUrl);

  const canUseServer =
    hasValidServerUrl &&
    normalizedDraftUrl !== normalizedActiveServerUrl;

  async function ensureServerOnline(
    baseUrl: string,
  ): Promise<boolean> {
    setBusy(true);

    try {
      const result =
        await checkServerReachable(baseUrl);

      if (result.ok) {
        return true;
      }

      setGeneralError(
        t("errors.serverNotReachable"),
      );

      return false;
    } finally {
      setBusy(false);
    }
  }

  async function validateAndSaveOnly(
    options?: {
      forceCreate?: boolean;
    },
  ): Promise<{
    ok: boolean;
    baseUrl?: string;
    serverLabel?: string;
    id?: string;
  }> {
    resetErrors();

    const { name, baseUrl } =
      getCurrentInputsNormalized();

    const forceCreate =
      options?.forceCreate ?? false;

    if (!baseUrl) {
      setUrlError(t("errors.serverUrlRequired"));

      return {
        ok: false,
      };
    }

    if (!/^https?:\/\//i.test(baseUrl)) {
      setUrlError(t("errors.serverUrlInvalid"));

      return {
        ok: false,
      };
    }

    const editableServer =
      !forceCreate &&
      editMode &&
      currentDraftServer
        ? currentDraftServer
        : null;

    const editableServerId =
      editableServer?.id ?? null;

    const nameExists = servers.some((server) => {
      if (
        editableServerId &&
        server.id === editableServerId
      ) {
        return false;
      }

      return (
        normalizeName(server.name ?? "").toLowerCase() ===
        name.toLowerCase()
      );
    });

    if (nameExists) {
      setNameError(t("errors.serverNameExists"));

      return {
        ok: false,
      };
    }

    const urlExists = servers.some((server) => {
      if (
        editableServerId &&
        server.id === editableServerId
      ) {
        return false;
      }

      return (
        normalizeBaseUrl(
          server.baseUrl,
        ).toLowerCase() === baseUrl.toLowerCase()
      );
    });

    if (urlExists) {
      setUrlError(t("errors.serverUrlExists"));

      return {
        ok: false,
      };
    }

    const online = await ensureServerOnline(baseUrl);

    if (!online) {
      setUrlError(
        t("errors.serverNotReachable"),
      );

      return {
        ok: false,
      };
    }

    if (editableServer) {
      dispatch(
        updateServer({
          id: editableServer.id,
          name,
          baseUrl,
        }),
      );

      return {
        ok: true,
        baseUrl,
        serverLabel: name,
        id: editableServer.id,
      };
    }

    const id = `${normalizeName(name)
      .toLowerCase()
      .replace(/\s+/g, "-")}-${Date.now()}`;

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
    if (busy || loginLoading) {
      return;
    }

    const result = await validateAndSaveOnly({
      forceCreate: true,
    });

    if (
      !result.ok ||
      !result.baseUrl ||
      !result.id
    ) {
      return;
    }

    setDraftServerId(result.id);
    setNameInput(result.serverLabel ?? "");
    setUrlInput(result.baseUrl);

    resetErrors();
  }

  function handleSaveSide() {
    if (
      busy ||
      loginLoading ||
      !hasChanges
    ) {
      return;
    }

    setShowSaveConfirm(true);
  }

  async function confirmSaveSide() {
    setShowSaveConfirm(false);

    const result = await validateAndSaveOnly({
      forceCreate: false,
    });

    if (!result.ok) {
      return;
    }

    resetErrors();
  }

  function handleDeleteSelected() {
    if (
      !currentDraftServer ||
      busy ||
      loginLoading
    ) {
      return;
    }

    setShowDeleteConfirm(true);
  }

  function confirmDeleteSelected() {
    if (!currentDraftServer) {
      return;
    }

    dispatch(removeServer(currentDraftServer.id));

    setShowDeleteConfirm(false);

    const localServer = servers.find(
      (server) =>
        server.id === "local" &&
        server.id !== currentDraftServer.id,
    );

    if (localServer) {
      setDraftServerId(localServer.id);
      setNameInput(localServer.name ?? "");
      setUrlInput(localServer.baseUrl ?? "");
      setEditMode(true);
      resetErrors();

      return;
    }

    startAddNew();
  }

  async function proceedUseServerAfterOptionalSave(
    skipSave = false,
  ) {
    let targetUrl = "";
    let targetId: string | null = null;
    let targetLabel = "";

    if (hasUnsavedChanges() && !skipSave) {
      const saveResult = await validateAndSaveOnly({
        forceCreate: false,
      });

      if (
        !saveResult.ok ||
        !saveResult.baseUrl
      ) {
        return;
      }

      targetUrl = normalizeBaseUrl(
        saveResult.baseUrl,
      );

      targetId = saveResult.id ?? null;

      targetLabel =
        saveResult.serverLabel ??
        saveResult.baseUrl;
    } else {
      const draftServer = servers.find(
        (server) => server.id === draftServerId,
      );

      targetUrl = normalizeBaseUrl(
        draftServer?.baseUrl ?? urlInput,
      );

      targetId = draftServer?.id ?? null;

      targetLabel =
        draftServer?.name ??
        draftServer?.baseUrl ??
        targetUrl;

      if (!targetUrl) {
        setUrlError(
          t("errors.serverUrlRequired"),
        );

        return;
      }

      const online =
        await ensureServerOnline(targetUrl);

      if (!online) {
        setUrlError(
          t("errors.serverNotReachable"),
        );

        return;
      }
    }

    setBusy(true);

    let existingJwt: string | null = null;
    let authenticationInfo: ServerAuthInfo;

    try {
      existingJwt =
        await getJwtForServer(targetUrl);

      authenticationInfo =
        await checkServerAuthenticated(
          targetUrl,
          existingJwt,
        );
    } finally {
      setBusy(false);
    }

    if (authenticationInfo.authenticated) {
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

    if (
      authenticationInfo.authenticationMethod ===
      "jwt"
    ) {
      setPendingServerUrl(targetUrl);
      setPendingServerLabel(targetLabel);
      setPendingServerId(targetId);
      setLoginError(null);
      setLoginModalVisible(true);

      return;
    }

    setLoginLoading(true);

    try {
      await dispatch(
        switchServer({
          url: targetUrl,
          providedJwt:
            authenticationInfo.oidcBearer ??
            undefined,
          initializeMenu: Boolean(
            authenticationInfo.oidcBearer,
          ),
        }),
      );

      if (targetId) {
        dispatch(selectServer(targetId));
        setDraftServerId(targetId);
      }

      navigation.goBack();
    } finally {
      setLoginLoading(false);
    }
  }

  function handleUseServer() {
    if (
      busy ||
      loginLoading ||
      !canUseServer
    ) {
      return;
    }

    if (hasChanges) {
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
    if (!pendingServerUrl) {
      return;
    }

    setLoginLoading(true);
    setLoginError(null);

    try {
      const basicAuthentication = toBase64(
        `${params.username}:${params.password}`,
      );

      const response = await fetch(
        `${pendingServerUrl}/api/user/login`,
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${basicAuthentication}`,
            Accept: "application/json",
          },
          credentials: "include",
        },
      );

      const authenticationHeader =
        response.headers.get(
          "www-authenticate",
        ) ??
        response.headers.get(
          "WWW-Authenticate",
        ) ??
        response.headers.get("authorization") ??
        response.headers.get("Authorization");

      const responseText = await response.text();

      const bearerToken =
        extractBearerToken(
          authenticationHeader,
        ) ??
        extractBearerToken(responseText);

      if (!bearerToken) {
        throw new Error(
          "Anmeldung fehlgeschlagen.",
        );
      }

      await dispatch(
        switchServer({
          url: pendingServerUrl,
          providedJwt: bearerToken,
          initializeMenu: true,
        }),
      );

      if (pendingServerId) {
        dispatch(
          selectServer(pendingServerId),
        );

        setDraftServerId(pendingServerId);
      }

      resetPendingAuthState();
      navigation.goBack();
    } catch (error: any) {
      setLoginError(
        error?.message ??
          "Anmeldung fehlgeschlagen.",
      );
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
                  borderColor: nameError
                    ? "red"
                    : theme.colors.border,
                }}
                placeholder={t("serverLabel")}
                value={nameInput}
                onChangeText={(value) => {
                  setNameInput(value);
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
                  borderColor: urlError
                    ? "red"
                    : theme.colors.border,
                }}
                placeholder={t("serverUrl")}
                value={urlInput}
                onChangeText={(value) => {
                  setUrlInput(value);
                  setUrlError(null);
                  setGeneralError(null);
                }}
              />

              <ActionButton
                variant="secondary"
                icon="save"
                onPress={handleSaveSide}
                size="sm"
                disabled={
                  !hasChanges ||
                  busy ||
                  loginLoading
                }
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
            {busy ? (
              <ActivityIndicator size="small" />
            ) : null}

            {firstError ? (
              <ThemedText
                style={{
                  color: "red",
                  fontSize: 12,
                  lineHeight: 16,
                  flex: 1,
                }}
                numberOfLines={2}
              >
                {firstError}
              </ThemedText>
            ) : (
              <ThemedText
                style={{
                  fontSize: 12,
                  opacity: 0,
                  flex: 1,
                }}
              >
                Platzhalter
              </ThemedText>
            )}
          </View>

          <View
            style={{
              gap: 10,
              marginTop: -10,
            }}
          >
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
                  !currentDraftServer ||
                  busy ||
                  loginLoading
                }
              />
            </View>

            <SelectableList
              variant="secondary"
              size="xs0"
              items={serverItems}
              value={draftServerId}
              onChange={(id) => {
                if (busy || loginLoading) {
                  return;
                }

                setDraftServerId(id);

                const selectedServer = servers.find(
                  (server) => server.id === id,
                );

                if (selectedServer) {
                  setEditMode(true);

                  setNameInput(
                    selectedServer.name ?? "",
                  );

                  setUrlInput(
                    selectedServer.baseUrl ?? "",
                  );
                } else {
                  startAddNew();
                }

                resetErrors();
              }}
              maxHeight={260}
              showSearch={false}
              searchPlaceholder={
                t("search") ?? "Server suchen…"
              }
              emptyText={
                t("noServers") ??
                "Keine Server gefunden"
              }
            />

            <ActionButton
              label={t("useServer")}
              variant="secondary"
              icon="check"
              onPress={handleUseServer}
              size="sm"
              disabled={
                !canUseServer ||
                busy ||
                loginLoading
              }
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
          if (loginLoading) {
            return;
          }

          resetPendingAuthState();
        }}
        onSubmit={handleServerLoginSubmit}
      />

      <ConfirmModal
        visible={showSaveConfirm}
        title={t("confirmSaveChanges")}
        message={t(
          "confirmSaveChangesMessage",
        )}
        confirmLabel={t("yes")}
        cancelLabel={t("cancel")}
        onConfirm={confirmSaveSide}
        onCancel={() =>
          setShowSaveConfirm(false)
        }
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
        onCancel={() =>
          setShowDeleteConfirm(false)
        }
      />

      <ConfirmModal
        visible={showUseSaveConfirm}
        title={t("confirmSaveChanges")}
        message={t(
          "confirmSaveChangesMessage",
        )}
        confirmLabel={t("yes")}
        cancelLabel={t("cancel")}
        onConfirm={confirmUseWithSave}
        onCancel={() =>
          setShowUseSaveConfirm(false)
        }
      />
    </>
  );
}