import { useTranslation } from "react-i18next";
import {
  selectVerifiedBackendRoles,
} from "@/template/state/authorization/selectVerifiedBackendRoles";
import {
  canEditLocalContent,
} from "@/template/editor/authorization/canEditLocalContent";
import React, { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import {
  useNavigation,
  type NavigationProp,
  type ParamListBase,
} from "@react-navigation/native";
import { useStore } from "react-redux";
import { useUnistyles } from "react-native-unistyles";

import { ThemedText } from "@/template/components/design-system/themed/ThemedText";
import { ActionButton } from "@/template/components/design-system/ui-elements/ActionButton";
import { useAppSelector } from "@/template/state/store/useAppSelector";

import type {
  TemplateRootState,
} from "@/template/state/store/templateStoreTypes";

import {
  loadBackendMenusForEditorV2,
} from "../adapters/loadBackendMenusForEditorV2";

import {
  buildBackendMenuTreeV2,
  type BackendMenuTreeNodeV2,
} from "../adapters/buildBackendMenuTreeV2";

function getInventorySessionKey(state: TemplateRootState): string {
  return JSON.stringify([
    state.api.ip,
    state.api.authGeneration,
    state.api.isLoggedIn,
    state.api.isLoggingOut,
    state.api.isSwitchingServer,
  ]);
}

interface TreeItemProps {
  node: BackendMenuTreeNodeV2;
  depth: number;
  selectedMenuId: number;
  onSelect: (menuId: number) => void;
  selectionDisabled: boolean;
}

function TreeItem({
  node,
  depth,
  selectedMenuId,
  onSelect,
  selectionDisabled,
}: TreeItemProps) {
  const { theme } = useUnistyles();
  const [expanded, setExpanded] = useState(true);
  const { t } = useTranslation(["Editor"]);

  const hasChildren = node.children.length > 0;
  const selected = node.menuId === selectedMenuId;

  return (
    <View>
      <View
        style={{
          marginLeft: Math.min(depth, 8) * 12,
          flexDirection: "row",
          alignItems: "center",
          borderWidth: selected ? 1 : 0,
          borderColor: theme.colors.highlight,
          backgroundColor: selected
            ? theme.colors.card
            : "transparent",
        }}
      >
        {hasChildren ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              expanded ? t("backendTree.collapse") : t("backendTree.expand")
            }
            accessibilityState={{ expanded }}
            onPress={() => setExpanded(value => !value)}
            style={{ padding: 10 }}
          >
            <ThemedText>
              {expanded ? "\u25be" : "\u25b8"}
            </ThemedText>
          </Pressable>
        ) : (
          <View style={{ width: 32 }} />
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={node.caption}
          accessibilityState={{
            selected,
            disabled: selectionDisabled,
          }}
          disabled={selectionDisabled}
          onPress={() => !selectionDisabled && onSelect(node.menuId)}
          style={{
            flex: 1,
            paddingVertical: 10,
            paddingRight: 8,
          }}
        >
          <ThemedText
            style={{
              fontWeight: selected ? "700" : "400",
            }}
          >
            {node.caption}
          </ThemedText>
        </Pressable>
      </View>

      {hasChildren && expanded && node.children.map(child => (
        <TreeItem
          key={child.menuId}
          node={child}
          depth={depth + 1}
          selectedMenuId={selectedMenuId}
          onSelect={onSelect}
          selectionDisabled={selectionDisabled}
        />
      ))}
    </View>
  );
}

/**
 * Read-only backend menu tree.
 * Uses the existing editor route for menu selection.
 * Does not modify backend data or local editor drafts.
 */
export function BackendMenuTreeV2({
  selectedMenuId,
  selectionDisabled = false,
}: {
  selectedMenuId: number;
  selectionDisabled?: boolean;
}) {
  const store = useStore();
  const { t } = useTranslation(["Editor"]);

  const canRead = useAppSelector(state =>
    canEditLocalContent(selectVerifiedBackendRoles(state)),
  );

  const language = useAppSelector(
    state => state.language.language,
  );

  const apiClient = useAppSelector(
    state => state.api.dynamic_content_api_v2?.defaultApi,
  );
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const { theme } = useUnistyles();

  const [roots, setRoots] = useState<BackendMenuTreeNodeV2[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadVersion, setReloadVersion] = useState(0);
  const [loadedScope, setLoadedScope] = useState<{
    key: string;
    client: unknown;
  } | null>(null);

  const sessionKey = useAppSelector(getInventorySessionKey);

  const scopeKey = JSON.stringify([
    sessionKey,
    canRead,
    language,
    reloadVersion,
  ]);

  const ready =
    canRead &&
    loadedScope?.key === scopeKey &&
    loadedScope?.client === apiClient;

  const getState = useCallback(
    () => store.getState() as TemplateRootState,
    [store],
  );

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError("");
    setRoots([]);
    setLoadedScope(null);

    if (!canRead) {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const menus = await loadBackendMenusForEditorV2({
          getState,
        });

        const tree = buildBackendMenuTreeV2(menus);

        if (!active) return;

        setRoots(tree);
        setLoadedScope({
          key: scopeKey,
          client: apiClient,
        });
      } catch {
        if (!active) return;

        setRoots([]);
        setError("backendTree.loadError");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [getState, scopeKey, canRead, apiClient]);

  if (!canRead) {
    return null;
  }

  return (
    <View
      style={{
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        maxHeight: 280,
        minHeight: 80,
        padding: 10,
        gap: 8,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <ThemedText style={{ fontSize: 16, fontWeight: "700" }}>
          {t("backendTree.title")}
        </ThemedText>

        <ActionButton
          label={t("backendTree.reload")}
          variant="secondary"
          disabled={loading}
          onPress={() => setReloadVersion(value => value + 1)}
        />
      </View>

      {loading && (
        <ThemedText>{t("backendTree.loading")}</ThemedText>
      )}

      {error.length > 0 && (
        <ThemedText>{t(error)}</ThemedText>
      )}

      {ready && !loading && !error && roots.length === 0 && (
        <ThemedText>{t("backendTree.empty")}</ThemedText>
      )}

      <ScrollView style={{ flexGrow: 0 }} nestedScrollEnabled>
        {ready && roots.map(node => (
          <TreeItem
            key={node.menuId}
            node={node}
            depth={0}
            selectedMenuId={selectedMenuId}
            selectionDisabled={selectionDisabled}
            onSelect={menuId => {
              const current = getState();

              if (
                ready &&
                !selectionDisabled &&
                getInventorySessionKey(current) === sessionKey &&
                canEditLocalContent(
                  selectVerifiedBackendRoles(current),
                ) &&
                current.api.dynamic_content_api_v2?.defaultApi === apiClient &&
                current.language.language === language &&
                menuId !== selectedMenuId
              ) {
                navigation.navigate("3027", {
                  backendMenuId: menuId,
                });
              }
            }}
          />
        ))}
      </ScrollView>
    </View>
  );
}