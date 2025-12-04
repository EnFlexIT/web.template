import {
  DrawerContentComponentProps,
  DrawerContentScrollView as DrawerContentScrollView_,
} from "@react-navigation/drawer";
import AntDesign_ from "@expo/vector-icons/AntDesign";
import { useAppSelector } from "../hooks/useAppSelector";
import { selectApi } from "../redux/slices/apiSlice";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import { Pressable, ScrollView, View } from "react-native";
import Feather_ from "@expo/vector-icons/Feather";
import { ToolBox } from "./ToolBox";
import { useTranslation } from "react-i18next";
import {
  isDynamicMenuItem,
  MenuTree,
  selectMenu,
  setActiveMenuId,
} from "../redux/slices/menuSlice";
import { Text } from "./stylistic/Text";
import { useLinkTo } from "@react-navigation/native";
import { useAppDispatch } from "../hooks/useAppDispatch";
import { useState } from "react";
import { Logo } from "./Logo";

const DrawerContentScrollView = withUnistyles(DrawerContentScrollView_);

interface DrawerItemProps {
  node: MenuTree;
}
function DrawerItem({ node }: DrawerItemProps) {
  const linkTo = useLinkTo();
  const dispatch = useAppDispatch();

  const { activeMenuId } = useAppSelector(selectMenu);

  const [hovered, setHovered] = useState(false);

  styles.useVariants({
    isCurrentRoute: activeMenuId === node.val.menuID!,
    hovered: hovered,
  });

  const { t } = useTranslation(["Drawer"]);

  return (
    <View style={[styles.innerContainer]}>
      <Pressable
        onPress={() => {
          linkTo("/" + node.val.menuID!.toString());
          dispatch(setActiveMenuId(node.val.menuID!));
        }}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
      >
        <Text
          style={[
            styles.currentlyActiveMenuID,
            styles.highlight,
            styles.noSelect,
          ]}
        >
          {isDynamicMenuItem(node.val) ? node.val.caption : t(node.val.caption)}
        </Text>
      </Pressable>
      {
        // This boolean is necessary. Otherwise the view gets rendered with the element `undefined` and the gap is applied
        node.children.length !== 0 && (
          <View style={[styles.childrenContainer, styles.innerContainer]}>
            {node.children.map((node, i) => (
              <DrawerItem node={node} key={i} />
            ))}
          </View>
        )
      }
    </View>
  );
}

interface NavigationProps {
  isWide: boolean;
  isLoggedIn: boolean;
  menu: MenuTree;
}
export function Navigation({ menu, isLoggedIn, isWide }: NavigationProps) {
  const linkTo = useLinkTo();
  const { activeMenuId } = useAppSelector(selectMenu);

  const [hovered, setHovered] = useState(false);

  // console.log(menu)

  styles.useVariants({
    isCurrentRoute: activeMenuId === menu.val.menuID!,
    hovered: hovered,
  });

  const dispatch = useAppDispatch();

  const { t } = useTranslation(["Drawer"]);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        {/* Logo */}

        <View style={[styles.logoContainer]}>
          <Logo
            style={{
              width: 28,
              height: 28,
            }}
          />
          <Text style={[{ fontWeight: "bold" }]}>
            {process.env.EXPO_PUBLIC_APPLICATION_TITLE}
          </Text>
        </View>

        {/* Navigation Menu */}

        <View style={[styles.innerContainer, styles.menuContainer]}>
          <Pressable
            onPress={() => {
              dispatch(setActiveMenuId(menu.val.menuID!));
              linkTo("/" + menu.val.menuID!.toString());
            }}
            onHoverIn={() => setHovered(true)}
            onHoverOut={() => setHovered(false)}
          >
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
              <DrawerItem key={i} node={node} />
            ))}
          </View>
        </View>
      </View>

      {/* Toolbox */}

      {!isWide && (
        <View style={styles.toolboxContainer}>
          <ToolBox isLoggedIn={isLoggedIn} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  childrenContainer: {
    marginLeft: 10,
  },
  innerContainer: {
    // backgroundColor: "green",
    gap: 10,
  },
  currentlyActiveMenuID: {
    variants: {
      isCurrentRoute: {
        true: {
          textDecorationLine: "underline",
          // fontWeight: "bold",
        },
      },
    },
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
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    flex: 1,
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
    // For some reason `height did not want to work`
    minHeight: 74,
    maxHeight: 74,
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
    justifyContent: "space-between",
  },
}));
