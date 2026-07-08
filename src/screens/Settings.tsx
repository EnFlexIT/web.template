// src/screens/SettingsScreen.tsx
import React, { useMemo, useState, useCallback } from "react";
import { Platform, Pressable, View } from "react-native";
import { useTranslation } from "react-i18next";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { H4 } from "../components/stylistic/H4";
import { Card } from "../components/ui-elements/Card";
import { Screen } from "../components/Screen";
import { ThemedText } from "../components/themed/ThemedText";

import { getStaticMenu, StaticMenuItem } from "../redux/slices/staticMenu";
import { isMenuEnabled } from "../redux/slices/featureFlags";

import { useMenuNavigation } from "../components/routing/useMenuNavigation";

const SETTINGS_ROOT_ID = 3003;

type UiNode = {
  item: StaticMenuItem;
  children: UiNode[];
};

type HoverCardProps = {
  children: React.ReactNode;
  onPress: () => void;
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

function HoverCard({ children, onPress }: HoverCardProps) {
  const { theme } = useUnistyles();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={
        Platform.OS === "web" ? () => setIsHovered(true) : undefined
      }
      onHoverOut={
        Platform.OS === "web" ? () => setIsHovered(false) : undefined
      }
      style={({ pressed }) => [
        styles.cardPressable,
        Platform.OS === "web" && styles.cardWebTransition,
        {
          transform: [
            {
              translateY:
                Platform.OS === "web" && isHovered && !pressed ? -3 : 0,
            },
            {
              scale: pressed
                ? 0.99
                : Platform.OS === "web" && isHovered
                  ? 1.006
                  : 1,
            },
          ],
        },
      ]}
    >
      <Card
        style={[
          styles.cardBase,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
          Platform.OS === "web" && isHovered && styles.cardHovered,
        ]}
      >
        {children}
      </Card>
    </Pressable>
  );
}

export function SettingsScreen() {
  const { theme } = useUnistyles();
  const { t } = useTranslation(["Settings", "Drawer"]);
  const { goTo } = useMenuNavigation();

  const staticMenu = useMemo(() => getStaticMenu(), []);

  const enabledMenu = useMemo(
    () => staticMenu.filter((it) => it.menuID && isMenuEnabled(it.menuID)),
    [staticMenu],
  );

  const settingsNodes = useMemo(() => buildTree(enabledMenu), [enabledMenu]);

  const pruneEmptyFolders = useCallback((nodes: UiNode[]): UiNode[] => {
    return nodes
      .map((n) => ({
        ...n,
        children: pruneEmptyFolders(n.children),
      }))
      .filter((n) => {
        const isFolder = n.children.length > 0;

        return isFolder || (!isFolder && n.item.menuID !== SETTINGS_ROOT_ID);
      });
  }, []);

  const visibleNodes = useMemo(
    () => pruneEmptyFolders(settingsNodes),
    [settingsNodes, pruneEmptyFolders],
  );

  const renderNode = useCallback(
    (node: UiNode) => {
      const id = node.item.menuID;
      const isFolder = node.children.length > 0;

      const folderHasOwnScreen =
        isFolder && node.item.Screen && node.item.menuID !== SETTINGS_ROOT_ID;

      if (folderHasOwnScreen) {
        return (
          <HoverCard key={id} onPress={() => goTo(id)}>
            <View style={styles.folderHeader}>
              <H4>{t(`Drawer:${node.item.caption}`)}</H4>
            </View>

            <ThemedText style={{ opacity: 0.85 }}>
              {t(`cards.${node.item.caption}.description`)}
            </ThemedText>
          </HoverCard>
        );
      }

      return (
        <HoverCard key={id} onPress={() => goTo(id)}>
          <H4>{t(`Drawer:${node.item.caption}`)}</H4>

          <ThemedText style={{ opacity: 0.85 }}>
            {t(`cards.${node.item.caption}.description`)}
          </ThemedText>
        </HoverCard>
      );
    },
    [goTo, t],
  );

  return (
    <Screen>
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.background,
          },
        ]}
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
    alignItems: "flex-start",
    width: "100%",
  },

  cardPressable: {
    width: "100%",
    maxWidth: 800,
    borderRadius: 2,
  },

  cardWebTransition: {
    cursor: "pointer",
    transitionProperty: "transform, box-shadow",
    transitionDuration: "160ms",
    transitionTimingFunction: "ease-out",
  } as any,

  cardBase: {
    width: "100%",
  },

  cardHovered: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 4,
  },

  folderHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    width: "100%",
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