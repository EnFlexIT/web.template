// src/screens/login/ServerPickerContent.tsx
import React, { useCallback, useMemo, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useUnistyles } from "react-native-unistyles";

import { ThemedText } from "../components/themed/ThemedText";
import { StylisticTextInput } from "../components/stylistic/StylisticTextInput";
import { ActionButton } from "../components/ui-elements/ActionButton";
import { H4 } from "../components/stylistic/H4";
import {
  SelectableList,
  SelectableItem,
} from "../components/ui-elements/SelectableList";

import { useAppDispatch } from "../hooks/useAppDispatch";
import { setIpAsync } from "../redux/slices/apiSlice";
import { initializeMenu } from "../redux/slices/menuSlice";
import {
  addServer,
  selectServer,
  updateServer,
  removeServer,
} from "../redux/slices/serverSlice";

import {
  checkServerReachable,
  normalizeBaseUrl,
  normalizeName,
} from "./login/serverCheck"

type Server = {
  id: string;
  name: string;
  baseUrl: string;
};

/* ---------------------------
   Inline Confirm (NO Alert)
----------------------------*/
type InlineConfirmState = {
  visible: boolean;
  title?: string;
  message?: string;
  okText?: string;
  cancelText?: string;
  destructive?: boolean;
};

function useInlineConfirm() {
  const resolverRef = useRef<((v: boolean) => void) | null>(null);
  const [state, setState] = useState<InlineConfirmState>({ visible: false });

  const confirm = useCallback(
    (opts: {
      title: string;
      message: string;
      okText?: string;
      cancelText?: string;
      destructive?: boolean;
    }): Promise<boolean> => {
      setState({
        visible: true,
        title: opts.title,
        message: opts.message,
        okText: opts.okText ?? "OK",
        cancelText: opts.cancelText ?? "Abbrechen",
        destructive: opts.destructive ?? false,
      });

      return new Promise<boolean>((resolve) => {
        resolverRef.current = resolve;
      });
    },
    [],
  );

  const resolveConfirm = useCallback((value: boolean) => {
    setState((s) => ({ ...s, visible: false }));
    resolverRef.current?.(value);
    resolverRef.current = null;
  }, []);

  return { confirm, confirmState: state, resolveConfirm };
}

function InlineConfirmBar({
  state,
  onResolve,
}: {
  state: InlineConfirmState;
  onResolve: (value: boolean) => void;
}) {
  const FIXED_HEIGHT = 64;

  if (!state.visible) return <View style={{ height: FIXED_HEIGHT }} />;

  return (
    <View
      style={{
        height: FIXED_HEIGHT,
        justifyContent: "center",
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        gap: 8,
      }}
    >
      <View style={{ gap: 2 }}>
        <ThemedText style={{ fontSize: 12, fontWeight: "600" }}>
          {state.title}
        </ThemedText>
        <ThemedText style={{ fontSize: 12, opacity: 0.9 }} numberOfLines={2}>
          {state.message}
        </ThemedText>
      </View>

      <View style={{ flexDirection: "row", gap: 8, justifyContent: "flex-end" }}>
        <ActionButton
          variant="secondary"
          size="sm"
          label={state.cancelText ?? "Abbrechen"}
          onPress={() => onResolve(false)}
        />
        <ActionButton
          variant="secondary"
          size="sm"
          label={state.okText ?? "OK"}
          onPress={() => onResolve(true)}
        />
      </View>
    </View>
  );
}

/* ---------------------------
   Shared Content Props
----------------------------*/
type Props = {
  servers: Server[];
  selectedServerId: string;
  selectedBaseUrl: string;
  onDone?: () => void; // Modal: close, Screen: goBack etc.
  containerStyle?: any; // optional override
};

export function ServerPickerContent({
  servers,
  selectedServerId,
  selectedBaseUrl,
  onDone,
  containerStyle,
}: Props) {
  const { t } = useTranslation(["Login"]);
  const dispatch = useAppDispatch();
  const { theme } = useUnistyles();

  const { confirm, confirmState, resolveConfirm } = useInlineConfirm();

  const selectedServer = servers.find((s) => s.id === selectedServerId);

  const [busy, setBusy] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

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

  async function ensureSelectedServerOnline(url: string): Promise<boolean> {
    setBusy(true);
    const check = await checkServerReachable(url);
    setBusy(false);

    if (check.ok) return true;

    setGeneralError(t("errors.serverNotReachable"));
    return false;
  }

  async function validateAndSaveOnly(): Promise<{ ok: boolean; baseUrl?: string }> {
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
      return { ok: true, baseUrl };
    }

    const id =
      normalizeName(name).toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();

    dispatch(addServer({ id, name, baseUrl }));
    dispatch(selectServer(id));
    setEditMode(true);

    return { ok: true, baseUrl };
  }

  async function handleAddByPlus() {
    resetErrors();
    const { name, baseUrl } = getCurrentInputsNormalized();

    if (!baseUrl) return setUrlError(t("errors.serverUrlRequired"));
    if (!/^https?:\/\//i.test(baseUrl)) return setUrlError(t("errors.serverUrlInvalid"));

    const nameExists = servers.some((s) => (s.name ?? "").toLowerCase() === name.toLowerCase());
    if (nameExists) return setNameError(t("errors.serverNameExists"));

    const urlExists = servers.some(
      (s) => normalizeBaseUrl(s.baseUrl).toLowerCase() === baseUrl.toLowerCase(),
    );
    if (urlExists) return setUrlError(t("errors.serverUrlExists"));

    const online = await ensureSelectedServerOnline(baseUrl);
    if (!online) return setUrlError(t("errors.serverNotReachable"));

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
    if (!res.ok) return;
    setEditMode(true);
  }

  async function handleDeleteSelected() {
    if (!selectedServer) return;

    const ok = await confirm({
      title: "Server löschen?",
      message: `${selectedServer.name} (${selectedServer.baseUrl})`,
      okText: "Löschen",
      cancelText: "Abbrechen",
      destructive: true,
    });
    if (!ok) return;

    dispatch(removeServer(selectedServer.id));
  }

  async function handleUseServer() {
    if (hasUnsavedChanges()) {
      const proceed = await confirm({
        title: "Änderungen speichern?",
        message:
          "Du hast Änderungen gemacht.\n\nMöchtest du die Änderungen speichern und den Server verwenden?",
        okText: "Speichern & verwenden",
        cancelText: "Abbrechen",
      });

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

    onDone?.();
  }

  return (
    <View
      style={[
        {
          width: 500,
          maxWidth: "100%",
          padding: 16,
          gap: 14,
          borderWidth: 1,
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
          alignSelf: "center",
        },
        containerStyle,
      ]}
    >
      {/* Inputs */}
      <View style={{ gap: 12 }}>
        <H4>{t("addServer")}</H4>

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
          <ActionButton variant="secondary" icon="plus" onPress={handleAddByPlus} size="sm" />
        </View>

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
            autoCapitalize="none"
            autoCorrect={false}
          />
          <ActionButton variant="secondary" icon="save" onPress={handleSaveSide} size="sm" />
        </View>
      </View>

      {/* Inline Confirm */}
      <InlineConfirmBar state={confirmState} onResolve={resolveConfirm} />

      {/* Inline Error (no jumping) */}
      <View style={{ minHeight: 5, justifyContent: "center" }}>
        {firstError ? (
          <ThemedText style={{ color: "red", fontSize: 12, lineHeight: 16 }} numberOfLines={2}>
            {firstError}
          </ThemedText>
        ) : (
          <ThemedText style={{ fontSize: 12, opacity: 0 }}> </ThemedText>
        )}
      </View>

      {busy && <ActivityIndicator />}

      {/* List */}
      <View style={{ gap: 10, marginTop: -20 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
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
    </View>
  );
}
