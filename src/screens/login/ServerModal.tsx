// src/screens/login/ServerModal.tsx

import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useUnistyles } from "react-native-unistyles";

import { H1 } from "../../components/stylistic/H1";
import { H4 } from "../../components/stylistic/H4";
import { StylisticTextInput } from "../../components/stylistic/StylisticTextInput";
import { ThemedText } from "../../components/themed/ThemedText";
import { ActionButton } from "../../components/ui-elements/ActionButton";
import { ConfirmModal } from "../../components/ui-elements/ConfirmModal";
import { Icon } from "../../components/ui-elements/Icon/Icon";
import {
  SelectableItem,
  SelectableList,
} from "../../components/ui-elements/SelectableList";

import { detectServerEnvironment } from "../../core/server/detectServerEnvironment";
import { normalizeServerInputs } from "../../core/server/normalizeServerInputs";
import {
  checkServerReachable,
  normalizeBaseUrl,
  normalizeName,
} from "../../core/server/serverCheck";
import {
  ServerValidationResult,
  validateServerInput,
} from "../../core/server/serverValidation";

import { useAppDispatch } from "../../hooks/useAppDispatch";
import { switchServer } from "../../redux/slices/apiSlice";
import {
  addServer,
  removeServer,
  selectServer,
  updateServer,
} from "../../redux/slices/serverSlice";

import { modalStyles } from "./styles";

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

type SaveServerResult = {
  ok: boolean;
  baseUrl?: string;
  serverLabel?: string;
};

const validationTranslationKeys = {
  urlRequired: "errors.serverUrlRequired",
  urlInvalid: "errors.serverUrlInvalid",
  nameExists: "errors.serverNameExists",
  urlExists: "errors.serverUrlExists",
} as const;

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

  const selectedServer = servers.find(
    (server) => server.id === selectedServerId,
  );

  const [busy, setBusy] = useState(false);

  const [nameError, setNameError] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const [nameInput, setNameInput] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [editMode, setEditMode] = useState(false);

  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showUseSaveConfirm, setShowUseSaveConfirm] = useState(false);

  const serverItems = useMemo<SelectableItem<string>[]>(() => {
    return servers.map((server) => ({
      id: server.id,
      label: server.name,
      subtitle: server.baseUrl,
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
    return normalizeServerInputs(nameInput, urlInput);
  }

  function hasUnsavedChanges(): boolean {
    const { name, baseUrl } = getCurrentInputsNormalized();

    const normalizedNameInput = normalizeName(nameInput);
    const normalizedUrlInput = normalizeBaseUrl(urlInput);

    if (!normalizedNameInput && !normalizedUrlInput) {
      return false;
    }

    if (editMode && selectedServer) {
      const currentName = normalizeName(selectedServer.name ?? "") || "";
      const currentUrl = normalizeBaseUrl(selectedServer.baseUrl ?? "");

      return currentName !== name || currentUrl !== baseUrl;
    }

    return Boolean(nameInput.trim() || urlInput.trim());
  }

  function showValidationError(validation: ServerValidationResult) {
    if (validation.ok) {
      return;
    }

    const message = t(validationTranslationKeys[validation.reason]);

    if (validation.field === "name") {
      setNameError(message);
      return;
    }

    setUrlError(message);
  }

  useEffect(() => {
    if (!visible) {
      return;
    }

    if (selectedServer) {
      setEditMode(true);
      setNameInput(selectedServer.name ?? "");
      setUrlInput(selectedServer.baseUrl ?? "");
    } else {
      setEditMode(false);
      setNameInput("");
      setUrlInput(selectedBaseUrl ?? "");
    }

    setShowSaveConfirm(false);
    setShowDeleteConfirm(false);
    setShowUseSaveConfirm(false);

    resetErrors();
  }, [
    visible,
    selectedServerId,
    selectedServer,
    selectedBaseUrl,
  ]);

  async function ensureSelectedServerOnline(
    url: string,
  ): Promise<boolean> {
    setBusy(true);

    try {
      const check = await checkServerReachable(url);

      if (check.ok) {
        return true;
      }

      setGeneralError(t("errors.serverNotReachable"));
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function validateAndSaveOnly(): Promise<SaveServerResult> {
    resetErrors();

    const { name, baseUrl } = getCurrentInputsNormalized();

    const validation = validateServerInput({
      servers,
      name,
      baseUrl,
      selectedServerId:
        editMode && selectedServer
          ? selectedServer.id
          : undefined,
    });

    if (!validation.ok) {
      showValidationError(validation);
      return { ok: false };
    }

    const online = await ensureSelectedServerOnline(baseUrl);

    if (!online) {
      setUrlError(t("errors.serverNotReachable"));
      return { ok: false };
    }

    if (editMode && selectedServer) {
      dispatch(
        updateServer({
          id: selectedServer.id,
          name,
          baseUrl,
        }),
      );

      return {
        ok: true,
        baseUrl,
        serverLabel: name,
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
        environment: detectServerEnvironment(baseUrl),
      }),
    );

    dispatch(selectServer(id));

    return {
      ok: true,
      baseUrl,
      serverLabel: name,
    };
  }

  async function handleAddByPlus() {
    resetErrors();

    const { name, baseUrl } = getCurrentInputsNormalized();

    const validation = validateServerInput({
      servers,
      name,
      baseUrl,
    });

    if (!validation.ok) {
      showValidationError(validation);
      return;
    }

    const online = await ensureSelectedServerOnline(baseUrl);

    if (!online) {
      setUrlError(t("errors.serverNotReachable"));
      return;
    }

    const id = `${normalizeName(name)
      .toLowerCase()
      .replace(/\s+/g, "-")}-${Date.now()}`;

    dispatch(
      addServer({
        id,
        name,
        baseUrl,
        environment: detectServerEnvironment(baseUrl),
      }),
    );

    dispatch(selectServer(id));

    setEditMode(true);
    setNameInput(name);
    setUrlInput(baseUrl);
  }

  function handleSaveSide() {
    if (!hasUnsavedChanges()) {
      return;
    }

    setShowSaveConfirm(true);
  }

  async function confirmSaveSide() {
    setShowSaveConfirm(false);

    const result = await validateAndSaveOnly();

    if (!result.ok || !result.baseUrl) {
      return;
    }

    const nextUrl = normalizeBaseUrl(result.baseUrl);

    setEditMode(true);

    await dispatch(switchServer(nextUrl));

    onClose();
  }

  function handleDeleteSelected() {
    if (!selectedServer) {
      return;
    }

    setShowDeleteConfirm(true);
  }

  function confirmDeleteSelected() {
    if (!selectedServer) {
      return;
    }

    dispatch(removeServer(selectedServer.id));
    setShowDeleteConfirm(false);
  }

  async function proceedUseServerAfterOptionalSave(
    skipSave = false,
  ) {
    let url = "";

    if (hasUnsavedChanges() && !skipSave) {
      const saved = await validateAndSaveOnly();

      if (!saved.ok || !saved.baseUrl) {
        return;
      }

      url = normalizeBaseUrl(saved.baseUrl);
    } else {
      const currentSelected = servers.find(
        (server) => server.id === selectedServerId,
      );

      url = normalizeBaseUrl(
        currentSelected?.baseUrl ?? selectedBaseUrl,
      );
    }

    const online = await ensureSelectedServerOnline(url);

    if (!online) {
      return;
    }

    await dispatch(switchServer(url));

    onClose();
  }

  function handleUseServer() {
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

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
      >
        <Pressable
          style={modalStyles.backdrop}
          onPress={onClose}
        >
          <Pressable
            onPress={() => undefined}
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
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <H1>{t("changeOrganization")}</H1>

              <Pressable
                onPress={onClose}
                hitSlop={10}
              >
                <Icon
                  name="close"
                  size={20}
                  color={theme.colors.text}
                />
              </Pressable>
            </View>

            <View style={{ gap: 12 }}>
              <H4>{t("addServer")}</H4>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
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
                  tooltip={t("addServer")}
                />
              </View>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
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
                  tooltip={t("saveAndUse")}
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
                  Placeholder
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
                  disabled={!selectedServer}
                />
              </View>

              <SelectableList
                variant="secondary"
                size="xs0"
                items={serverItems}
                value={selectedServerId}
                onChange={(id) => {
                  dispatch(selectServer(id));

                  const server = servers.find(
                    (item) => item.id === id,
                  );

                  if (server) {
                    setEditMode(true);
                    setNameInput(server.name ?? "");
                    setUrlInput(server.baseUrl ?? "");
                  } else {
                    startAddNew();
                  }

                  resetErrors();
                }}
                maxHeight={260}
                showSearch={false}
                searchPlaceholder={
                  t("search") ?? "Search server..."
                }
                emptyText={
                  t("noServers") ?? "No servers found"
                }
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
          selectedServer
            ? `${selectedServer.name} (${selectedServer.baseUrl})`
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