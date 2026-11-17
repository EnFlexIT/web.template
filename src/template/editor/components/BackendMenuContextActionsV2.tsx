import React, { useState } from "react";
import {
  Pressable,
  Text,
  View,
} from "react-native";
import { useStore } from "react-redux";
import {
  useNavigation,
  type NavigationProp,
  type ParamListBase,
} from "@react-navigation/native";

import {
  Dropdown,
} from "@/template/components/design-system/ui-elements/Dropdown";

import {
  BaseModal,
} from "@/template/components/design-system/ui-elements/BaseModal";

import {
  TextInput,
} from "@/template/components/design-system/ui-elements/TextInput";

import {
  useAppSelector,
} from "@/template/state/store/useAppSelector";

import {
  useAppDispatch,
} from "@/template/state/store/useAppDispatch";

import {
  initializeMenu,
} from "@/template/state/navigation/menuSlice";

import type {
  TemplateRootState,
} from "@/template/state/store/templateStoreTypes";

import {
  selectCanEditInUiPreview,
} from "@/template/state/authorization/selectUiPreviewMode";

import {
  selectBackendContentWriteContext,
} from "../adapters/updateBackendContentElementFromStore";

import {
  renameBackendMenuV2,
} from "../adapters/renameBackendMenuV2";

export interface BackendMenuContextActionsV2Props {
  menuId: number;
}

export function BackendMenuContextActionsV2({
  menuId,
}: BackendMenuContextActionsV2Props) {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const dispatch = useAppDispatch();
  const store = useStore();

  const language = useAppSelector(
    state => state.language.language,
  );

  const allowed = useAppSelector(state => {
    const context = selectBackendContentWriteContext(state);

    return (
      state.backendRoles.status === "ready" &&
      selectCanEditInUiPreview(state) &&
      context.isLoggedIn &&
      context.canEdit &&
      !context.isSwitchingServer &&
      !context.isLoggingOut &&
      context.server.trim().length > 0
    );
  });

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameTitle, setRenameTitle] = useState("");
  const [renameError, setRenameError] = useState("");
  const [renameBusy, setRenameBusy] = useState(false);
  const [renameLoading, setRenameLoading] = useState(false);

  function getState(): TemplateRootState {
    return store.getState() as TemplateRootState;
  }

  function getRenameContext() {
    const state = getState();
    const context = selectBackendContentWriteContext(state);

    return {
      ...context,
      client: state.api.dynamic_content_api_v2.defaultApi,
    };
  }

  async function openRenameDialog() {
    setRenameTitle("");
    setRenameError("");
    setRenameOpen(true);
    setRenameLoading(true);

    try {
      const before = { ...getRenameContext() };

      if (
        !before.isLoggedIn ||
        !before.canEdit ||
        before.isLoggingOut ||
        before.isSwitchingServer
      ) {
        throw new Error("Keine Bearbeitungsberechtigung");
      }

      const response = await before.client.getMenus(language);

      const after = getRenameContext();

      if (
        after.client !== before.client ||
        after.server !== before.server ||
        after.authGeneration !== before.authGeneration ||
        !after.isLoggedIn ||
        after.isLoggingOut ||
        after.isSwitchingServer
      ) {
        throw new Error("Die Sitzung hat sich geändert");
      }

      const items = response.data?.menuList;

      if (!Array.isArray(items)) {
        throw new Error("Menüliste konnte nicht geladen werden");
      }

      const matches = items.filter(item => item.menuId === menuId);

      if (matches.length !== 1) {
        throw new Error("Menü wurde nicht eindeutig gefunden");
      }

      setRenameTitle(matches[0].caption);
    } catch (error) {
      setRenameError(
        error instanceof Error
          ? error.message
          : "Menü konnte nicht geladen werden",
      );
    } finally {
      setRenameLoading(false);
    }
  }

  async function saveRename() {
    if (renameBusy || renameLoading) return;

    setRenameBusy(true);
    setRenameError("");

    try {
      await renameBackendMenuV2({
        menuId,
        caption: renameTitle,
        language,
        getContext: getRenameContext,
      });

      await dispatch(initializeMenu()).unwrap();

      setRenameOpen(false);
    } catch (error) {
      setRenameError(
        error instanceof Error
          ? error.message
          : "Umbenennen fehlgeschlagen",
      );
    } finally {
      setRenameBusy(false);
    }
  }

  if (!allowed || !Number.isSafeInteger(menuId) || menuId <= 0) {
    return null;
  }

  return (
    <>
      <Dropdown<string>
        value="open"
        options={{
          open: "Bearbeiten",
          rename: "Umbenennen",
        }}
        optionIcons={{
          open: "edit-2",
          rename: "edit-2",
        }}
        triggerLabel="⋯"
        minimalMenu
        menuPlacement="auto"
        triggerWidth={32}
        hideChevron
        appearance="menu"
        menuWidth={220}
        size="sm"
        onChange={action => {
          if (action === "open") {
            navigation.navigate("3027", {
              backendMenuId: menuId,
            });
          }

          if (action === "rename") {
            void openRenameDialog();
          }
        }}
      />

      <BaseModal
        visible={renameOpen}
        onClose={() => {
          if (!renameBusy) setRenameOpen(false);
        }}
        width={520}
      >
        <View style={{ gap: 16 }}>
          <Text style={{ fontSize: 19, fontWeight: "600" }}>
            Menü umbenennen
          </Text>

          <TextInput
            label="Neuer Menüname"
            value={renameTitle}
            onChangeText={setRenameTitle}
            placeholder="Menüname eingeben"
          />

          {renameLoading && (
            <Text>Menü wird geladen ...</Text>
          )}

          {renameError !== "" && (
            <Text style={{ color: "#b42318" }}>
              {renameError}
            </Text>
          )}

          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              gap: 12,
            }}
          >
            <Pressable
              onPress={() => setRenameOpen(false)}
              disabled={renameBusy}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 10,
              }}
            >
              <Text>Abbrechen</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                void saveRename();
              }}
              disabled={
                renameBusy ||
                renameLoading ||
                !renameTitle.trim() ||
                renameError !== ""
              }
              style={{
                paddingHorizontal: 16,
                paddingVertical: 10,
                backgroundColor: "#2463eb",
                opacity:
                  renameBusy ||
                  renameLoading ||
                  !renameTitle.trim()
                    ? 0.5
                    : 1,
              }}
            >
              <Text style={{ color: "#ffffff" }}>
                {renameBusy ? "Speichert ..." : "Speichern"}
              </Text>
            </Pressable>
          </View>
        </View>
      </BaseModal>
    </>
  );
}