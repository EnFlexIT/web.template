import { DrawerHeaderProps } from "@react-navigation/drawer";
import { FlexAlignType, Pressable, View } from "react-native";
import { Text } from "./stylistic/Text";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import {
  ImageBackground,
  StyleSheet as NativeStyleSheet,
  TextProps,
} from "react-native";
import AntDesign_ from "@expo/vector-icons/AntDesign";
import { useIsWide } from "../hooks/useIsWide";
import { H1 } from "./stylistic/H1";
import { Logo } from "./Logo";
import { ToolBox } from "./ToolBox";
import {
  getIdPath,
  isDynamicMenuItem,
  MenuTree,
  selectMenu,
  setActiveMenuId,
} from "../redux/slices/menuSlice";
import { useAppSelector } from "../hooks/useAppSelector";
import { selectIsLoggedIn } from "../redux/slices/apiSlice";
import { useAppDispatch } from "../hooks/useAppDispatch";
import { useLinkTo } from "@react-navigation/native";
import { useState } from "react";
import { MenuItem } from "../redux/slices/menuSlice";
import { useTranslation } from "react-i18next";
import { ThemedText } from "./themed/ThemedText";
import { useDrawerStatus } from "@react-navigation/drawer";

interface HeaderEntryProps {
  node: MenuItem;
}
function MenuLink({ node, ...rest }: HeaderEntryProps & TextProps) {
  const [hovered, setHovered] = useState(false);

  const dispatch = useAppDispatch();

  const linkTo = useLinkTo();

  styles.useVariants({
    hovered: hovered,
  });

  const { t } = useTranslation(["Drawer"]);

  return (
    <Pressable
      onPress={() => {
        linkTo("/" + node.menuID.toString());
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

function Breadcrumb() {
  const { menu: menuTrees, activeMenuId, rawMenu } = useAppSelector(selectMenu);

  const linkTo = useLinkTo();

  const dispatch = useAppDispatch();

  const activeMenuNode = rawMenu.find(({ menuID }) => menuID === activeMenuId)!;

  const pathIds = getIdPath(rawMenu, activeMenuNode.menuID);

  if (pathIds) {
    return (
      <View style={[styles.breadcrumbcontainer]}>
        {pathIds
          .map((id) => rawMenu.find(({ menuID }) => menuID === id)!)
          .flatMap((node, i) => [
            <MenuLink node={node} key={2 * i} style={[styles.noSelect]} />,
            <Text key={2 * i + 1} style={[styles.noSelect]}>
              /
            </Text>,
          ])
          .slice(0, -1)}
      </View>
    );
  } else {
    return undefined;
  }
}

export function Header({
  layout,
  navigation,
  options,
  route,
}: DrawerHeaderProps) {
  const isWide = useIsWide();
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const { menu, activeMenuId, rawMenu } = useAppSelector(selectMenu);

  const dispatch = useAppDispatch();

  const linkTo = useLinkTo();

  const drawerStatus = useDrawerStatus();
  const isDrawerOpen = drawerStatus === "open";

  return (
    <View style={styles.container}>
      {/* Left Header */}
      <View>
        <View style={[styles.leftHeaderContainer]}>
          {!isWide && (
            <View style={styles.navButtonContainer}>
              <Pressable
                style={styles.navButton}
                onPress={() => {
                  navigation.toggleDrawer();
                }}
              >
                <ThemedText>☰</ThemedText>
              </Pressable>
            </View>
          )}
          {menu
            .flatMap((node, i, arr) => [
              <MenuLink
                node={node.val}
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

        <View>
          <Breadcrumb />
        </View>
      </View>
      {/* Right Header */}
      {!isWide && <ToolBox isLoggedIn={isLoggedIn} />}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    // padding: 10,
    paddingHorizontal: theme.info.screenMargin,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    // gap: 10,
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
