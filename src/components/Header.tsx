import { DrawerHeaderProps, useDrawerStatus } from "@react-navigation/drawer";
import { Pressable, View } from "react-native";
import { Text } from "./stylistic/Text";
import { StyleSheet } from "react-native-unistyles";

import { useIsWide } from "../hooks/useIsWide";
import { ToolBox } from "./ToolBox";

import {
  getIdPath,
  isDynamicMenuItem,
  selectMenu,
  setActiveMenuId,
  MenuItem,
} from "../redux/slices/menuSlice";

import { useAppSelector } from "../hooks/useAppSelector";
import { selectIsLoggedIn } from "../redux/slices/apiSlice";
import { useAppDispatch } from "../hooks/useAppDispatch";
import { useLinkTo } from "@react-navigation/native";
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ThemedText } from "./themed/ThemedText";

//  Slug builder
import { buildMenuPaths } from "./routing/menuPaths";

interface HeaderEntryProps {
  node: MenuItem;
  pathById: Record<number, string>;
}

function MenuLink({ node, pathById, ...rest }: HeaderEntryProps & any) {
  const [hovered, setHovered] = useState(false);
  const dispatch = useAppDispatch();
  const linkTo = useLinkTo();
  const { t } = useTranslation(["Drawer"]);

  styles.useVariants({ hovered });

  const path = pathById[node.menuID] ?? `/${node.menuID}`;

  return (
    <Pressable
      onPress={() => {
        linkTo(path); // Slug
        dispatch(setActiveMenuId(node.menuID));
      }}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
    >
      <Text style={[styles.highlight, rest.style]}>
        {isDynamicMenuItem(node) ? node.caption : t(node.caption)}
      </Text>
    </Pressable>
  );
}

function Breadcrumb({ pathById }: { pathById: Record<number, string> }) {
  const { activeMenuId, rawMenu } = useAppSelector(selectMenu);

  const activeMenuNode = rawMenu.find(({ menuID }) => menuID === activeMenuId);
  if (!activeMenuNode) return null;

  const pathIds = getIdPath(rawMenu, activeMenuNode.menuID);
  if (!pathIds) return null;

  return (
    <View style={styles.breadcrumbcontainer}>
      {pathIds
        .map((id) => rawMenu.find(({ menuID }) => menuID === id)!)
        .flatMap((node, i) => [
          <MenuLink
            node={node}
            pathById={pathById}
            key={2 * i}
            style={[styles.noSelect]}
          />,
          <Text key={2 * i + 1} style={[styles.noSelect]}>
            /
          </Text>,
        ])
        .slice(0, -1)}
    </View>
  );
}

export function Header({ navigation }: DrawerHeaderProps) {
  const isWide = useIsWide();
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const { menu, rawMenu } = useAppSelector(selectMenu);

  const drawerStatus = useDrawerStatus();
  const isDrawerOpen = drawerStatus === "open";

  // Slug mapping einmal aus rawMenu bauen
  const { pathById } = useMemo(() => buildMenuPaths(rawMenu), [rawMenu]);

  return (
    <View style={styles.container}>
      {/* Left Header */}
      <View>
        <View style={styles.leftHeaderContainer}>
          {!isWide && (
            <View style={styles.navButtonContainer}>
              <Pressable
                style={styles.navButton}
                onPress={() => navigation.toggleDrawer()}
              >
                <ThemedText>☰</ThemedText>
              </Pressable>
            </View>
          )}

          {menu
            .flatMap((node, i) => [
              <MenuLink
                node={node.val}
                pathById={pathById}
                key={2 * i}
                style={[styles.headMenueTitle, styles.noSelect]}
              />,
              <Text
                key={2 * i + 1}
                style={[styles.headMenueTitle, styles.noSelect]}
              >
                |
              </Text>,
            ])
            .slice(0, -1)}
        </View>

        <Breadcrumb pathById={pathById} />
      </View>

      {/* Right Header */}
      {isWide && <ToolBox isLoggedIn={isLoggedIn} />}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    paddingHorizontal: theme.info.screenMargin,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 74,
    borderColor: theme.colors.border,
    borderBottomWidth: 1,
  },
  leftHeaderContainer: {
    flexDirection: "row",
    gap: 15,
  },
  headMenueTitle: {
    fontSize: 26,
    fontWeight: "600",
  },
  breadcrumbcontainer: {
    flexDirection: "row",
    gap: 5,
  },
  highlight: {
    variants: {
      hovered: {
        true: {
          color: theme.colors.highlight,
        },
      },
    },
  },
  noSelect: {
    userSelect: "none",
  },
  navButtonContainer: {
    width: theme.info.screenMargin / 2,
  },
  navButton: { position: "absolute", top: 10 },
}));
