// src/components/Navigation.tsx
import React, { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useLinkTo } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { ToolBox } from "./ToolBox";
import { Logo } from "./Logo";
import { Text } from "./stylistic/Text";

import { useAppDispatch } from "../hooks/useAppDispatch";
import { useAppSelector } from "../hooks/useAppSelector";

import {
  isDynamicMenuItem,
  MenuTree,
  selectMenu,
  setActiveMenuId,
} from "../redux/slices/menuSlice";
import { selectApi } from "../redux/slices/apiSlice";

import { buildMenuPaths } from "./routing/menuPaths";

/* =========================
   Drawer Item
   ========================= */

interface DrawerItemProps {
  node: MenuTree;
  expanded: Record<number, boolean>;
  toggleExpanded: (id: number) => void;
  pathById: Record<number, string>;
}

function DrawerItem({
  node,
  expanded,
  toggleExpanded,
  pathById,
}: DrawerItemProps) {
  const linkTo = useLinkTo();
  const dispatch = useAppDispatch();
  const { t } = useTranslation(["Drawer"]);

  const { activeMenuId } = useAppSelector(selectMenu);
  const [hovered, setHovered] = useState(false);

  const id = node.val.menuID!;
  const isFolder = node.children.length > 0;
  const isOpen = expanded[id] ?? true;

  const path = pathById[id] ?? `/${id}`;

  styles.useVariants({
    isCurrentRoute: activeMenuId === id,
    hovered,
  });

  return (
    <View style={styles.innerContainer}>
      <Pressable
        onPress={() => {
          if (isFolder) {
            toggleExpanded(id);
            return;
          }

          dispatch(setActiveMenuId(id));
          linkTo(path);
        }}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        style={styles.row}
      >
        <Text style={[styles.arrow, styles.noSelect]}>
          {isFolder ? (isOpen ? "▾" : "▸") : " "}
        </Text>

        <Text
          style={[
            styles.currentlyActiveMenuID,
            styles.highlight,
            styles.noSelect,
          ]}
        >
          {isDynamicMenuItem(node.val)
            ? node.val.caption
            : t(node.val.caption)}
        </Text>
      </Pressable>

      {isFolder && isOpen && (
        <View style={[styles.childrenContainer, styles.innerContainer]}>
          {node.children.map((child, i) => (
            <DrawerItem
              key={i}
              node={child}
              expanded={expanded}
              toggleExpanded={toggleExpanded}
              pathById={pathById}
            />
          ))}
        </View>
      )}
    </View>
  );
}

/* =========================
   Navigation
   ========================= */

interface NavigationProps {
  isWide: boolean;
  isLoggedIn: boolean;
  menu: MenuTree;
}

export function Navigation({ menu, isLoggedIn, isWide }: NavigationProps) {
  const linkTo = useLinkTo();
  const dispatch = useAppDispatch();
  const { t } = useTranslation(["Drawer"]);

  const api = useAppSelector(selectApi);
  const isBaseMode = api.isBaseMode === true;

  const { rawMenu, activeMenuId } = useAppSelector(selectMenu);

  // 🔑 Slug paths
  const { pathById } = useMemo(() => buildMenuPaths(rawMenu), [rawMenu]);

  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const toggleExpanded = (id: number) => {
    setExpanded((prev) => ({ ...prev, [id]: !(prev[id] ?? true) }));
  };

  const rootPath = pathById[menu.val.menuID!] ?? `/${menu.val.menuID!}`;

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Logo style={{ width: 28, height: 28 }} />
          <Text style={{ fontWeight: "bold" }}>
            {process.env.EXPO_PUBLIC_APPLICATION_TITLE}
            {isBaseMode ? " (Base)" : ""}
          </Text>
        </View>

        {/* Root */}
        <View style={[styles.innerContainer, styles.menuContainer]}>
          <Pressable
            onPress={() => {
              dispatch(setActiveMenuId(menu.val.menuID!));
              linkTo(rootPath);
            }}
            style={styles.row}
          >
            <Text style={styles.arrow}> </Text>
            <Text
              style={[
                styles.currentlyActiveMenuID,
                styles.highlight,
                styles.noSelect,
              ]}
            >
              {isDynamicMenuItem(menu.val)
                ? menu.val.caption
                : t(menu.val.caption)}
            </Text>
          </Pressable>

          <View style={[styles.innerContainer, styles.childrenContainer]}>
            {menu.children.map((node, i) => (
              <DrawerItem
                key={i}
                node={node}
                expanded={expanded}
                toggleExpanded={toggleExpanded}
                pathById={pathById}
              />
            ))}
          </View>
        </View>
      </View>

      {!isWide && (
        <View style={styles.toolboxContainer}>
          <ToolBox isLoggedIn={isLoggedIn} isBaseMode={isBaseMode} />
        </View>
      )}
    </View>
  );
}

/* =========================
   Styles
   ========================= */

const styles = StyleSheet.create((theme) => ({
  innerContainer: { gap: 10 },
  childrenContainer: { marginLeft: 10 },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  arrow: {
    width: 16,
    opacity: 0.8,
  },

  currentlyActiveMenuID: {
    variants: {
      isCurrentRoute: { true: { textDecorationLine: "underline" } },
    },
  },

  highlight: {
    variants: {
      hovered: { true: { color: theme.colors.highlight } },
    },
  },

  noSelect: { userSelect: "none" },

  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
    minHeight: 74,
    padding: 10,
  },

  menuContainer: {
    marginTop: 13,
    padding: 10,
  },

  toolboxContainer: {
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    padding: 10,
  },
}));
