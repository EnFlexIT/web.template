import React, { useMemo, useState, useCallback } from "react";
import { Pressable, View } from "react-native";
import { useTranslation } from "react-i18next";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { H4 } from "../components/stylistic/H4";
import { H3 } from "../components/stylistic/H3";
import { Card } from "../components/ui-elements/Card";
import { Screen } from "../components/Screen";
import { ThemedText } from "../components/themed/ThemedText";

import { getStaticMenu, StaticMenuItem } from "../redux/slices/staticMenu";
import { isMenuEnabled } from "../redux/slices/featureFlags";

//  Navigation per menuID
import { useMenuNavigation } from "../components/routing/useMenuNavigation";

const SETTINGS_ROOT_ID = 3003;

type UiNode = {
  item: StaticMenuItem;
  children: UiNode[];
};

function buildTree(items: StaticMenuItem[]): UiNode[] {
  const byParent = new Map<number, StaticMenuItem[]>();

  for (const it of items) {
    const p = it.parentID ?? 0;
    if (!byParent.has(p)) byParent.set(p, []);
    byParent.get(p)!.push(it);
  }

  const sortItems = (arr: StaticMenuItem[]) =>
    [...arr].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  const build = (parentId: number): UiNode[] => {
    const children = sortItems(byParent.get(parentId) ?? []);
    return children.map((child) => ({
      item: child,
      children: build(child.menuID),
    }));
  };

  return build(SETTINGS_ROOT_ID);
}

export function SettingsScreen() {
  const { theme } = useUnistyles();
  const { t } = useTranslation(["Settings"]);

  // goTo() navigiert automatisch per menuID auf den slug-path
  const { goTo } = useMenuNavigation();

  // Folder open/close pro menuID
  const [openById, setOpenById] = useState<Record<number, boolean>>({});

  const toggleFolder = useCallback((id: number) => {
    setOpenById((prev) => ({ ...prev, [id]: !(prev[id] ?? true) }));
  }, []);

  // static menu (safety: enabled)
  const staticMenu = useMemo(() => getStaticMenu(), []);
  const enabledMenu = useMemo(
    () => staticMenu.filter((it) => it.menuID && isMenuEnabled(it.menuID)),
    [staticMenu]
  );

  // Baum für Settings Children bauen
  const settingsNodes = useMemo(() => buildTree(enabledMenu), [enabledMenu]);

  // Folder nur anzeigen, wenn mind. 1 Kind existiert
  const pruneEmptyFolders = useCallback((nodes: UiNode[]): UiNode[] => {
    return nodes
      .map((n) => ({
        ...n,
        children: pruneEmptyFolders(n.children),
      }))
      .filter((n) => {
        const isFolder = n.children.length > 0;
        // leaf immer ok (außer root), folder nur ok wenn kinder existieren
        return isFolder || (!isFolder && n.item.menuID !== SETTINGS_ROOT_ID);
      });
  }, []);

  const visibleNodes = useMemo(
    () => pruneEmptyFolders(settingsNodes),
    [settingsNodes, pruneEmptyFolders]
  );

  const renderNode = useCallback(
  (node: UiNode) => {
    const id = node.item.menuID;
    const isFolder = node.children.length > 0;

   
    const folderHasOwnScreen =
      isFolder && node.item.Screen && node.item.menuID !== SETTINGS_ROOT_ID;

    //   navigieren
    if (folderHasOwnScreen) {
      return (
        <Card
          key={id}
          onPress={() => goTo(id)}
          style={[
            styles.cardBase,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.folderHeader}>
            <H4>{t(`cards.${node.item.caption}.title`)}</H4>
          </View>

          <ThemedText style={{ opacity: 0.85 }}>
            {t(`cards.${node.item.caption}.description`)}
          </ThemedText>
        </Card>
      );
    }
    return (
      <Card
        key={id}
        onPress={() => goTo(id)}
        style={[
          styles.cardBase,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <H4>{t(`cards.${node.item.caption}.title`)}</H4>
        <ThemedText style={{ opacity: 0.85 }}>
          {t(`cards.${node.item.caption}.description`)}
        </ThemedText>
      </Card>
    );
  },
  [goTo, openById, theme.colors, t, toggleFolder]
);


  return (
    <Screen>
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.cardsRow}>{visibleNodes.map(renderNode)}</View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create(() => ({
  container: {
    flex: 1,
    padding: 24,
    gap: 24,
   
  },
  cardsRow: {
    gap: 12,
    flexDirection: "column",
    flexWrap: "wrap",

  },
  cardBase: {},
  folderHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    width:800,

  },
  subList: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 10,
  
  },
  subItem: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    alignItems: "center",
  
  },
  subArrow: {
    width: "auto",
    opacity: 0.7,
    fontSize: 16,
    
  },
}));
