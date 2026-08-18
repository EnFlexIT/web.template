import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Pressable,
  View,
} from "react-native";

import {
  StyleSheet,
} from "react-native-unistyles";

import {
  useLinkTo,
} from "@react-navigation/native";

import {
  useTranslation,
} from "react-i18next";

import {
  useApplicationConfig,
} from "@/template/application/ApplicationConfigContext";

import {
  ToolBox,
} from "./ToolBox";

import {
  Logo,
} from "./Logo";

import {
  Text,
} from "@/template/components/design-system/stylistic/Text";

import {
  selectAuthenticationMethod,
  selectApi,
} from "@/template/state/api/apiSlice";

import {
  getNavigationRuntime,
} from "@/template/navigation/navigationRuntime";

import {
  useAppDispatch,
} from "@/template/state/store/useAppDispatch";

import {
  useAppSelector,
} from "@/template/state/store/useAppSelector";

import {
  getIdPath,
  isDynamicMenuItem,
  type MenuTree,
  selectMenu,
  setActiveMenuId,
} from "@/template/state/navigation/menuSlice";

import {
  buildMenuPaths,
} from "@/template/navigation/routing/menuPaths";

interface DrawerItemProps {
  node: MenuTree;
  expanded: Record<number, boolean>;
  setExpanded: React.Dispatch<
    React.SetStateAction<
      Record<number, boolean>
    >
  >;
  pathById: Record<number, string>;
}

function DrawerItem({
  node,
  expanded,
  setExpanded,
  pathById,
}: DrawerItemProps) {
  const linkTo =
    useLinkTo();

  const dispatch =
    useAppDispatch();

  const { t } =
    useTranslation([
      "Drawer",
    ]);

  const {
    rawMenu,
    activeMenuId,
  } = useAppSelector(
    selectMenu,
  );

  const authenticationMethod =
    useAppSelector(
      selectAuthenticationMethod,
    );

  const [
    hovered,
    setHovered,
  ] = useState(false);

  const id =
    node.val.menuID;

  const isFolder =
    node.children.length > 0;

  const isOpen =
    expanded[id] ?? false;

  const path =
    pathById[id] ??
    `/${id}`;

  const {
    menu: menuConfiguration,
  } = getNavigationRuntime();

  const isEnabled =
    menuConfiguration.isEnabled(
      id,
      {
        authenticationMethod,
      },
    );

  styles.useVariants({
    isCurrentRoute:
      activeMenuId === id,
    hovered,
  });

  const toggle = () => {
    setExpanded(
      (previous) => ({
        ...previous,
        [id]:
          !(
            previous[id] ??
            true
          ),
      }),
    );
  };

  useEffect(() => {
    if (!activeMenuId) {
      return;
    }

    const pathIds =
      getIdPath(
        rawMenu,
        activeMenuId,
      ) ?? [];

    setExpanded(
      (previous) => {
        const next = {
          ...previous,
        };

        for (
          const pathId of
          pathIds
        ) {
          next[pathId] =
            true;
        }

        return next;
      },
    );
  }, [
    activeMenuId,
    rawMenu,
    setExpanded,
  ]);

  if (!isEnabled) {
    return null;
  }

  return (
    <View
      style={
        styles.innerContainer
      }
    >
      <Pressable
        onPress={() => {
          dispatch(
            setActiveMenuId(
              id,
            ),
          );

          linkTo(path);

          if (isFolder) {
            toggle();
          }
        }}
        onHoverIn={() =>
          setHovered(true)
        }
        onHoverOut={() =>
          setHovered(false)
        }
        style={styles.row}
      >
        <Text
          style={[
            styles.arrow,
            styles.noSelect,
          ]}
        >
          {isFolder
            ? isOpen
              ? "▾"
              : "▸"
            : " "}
        </Text>

        <Text
          style={[
            styles.currentlyActiveMenuID,
            styles.highlight,
            styles.noSelect,
          ]}
        >
          {isDynamicMenuItem(
            node.val,
          )
            ? node.val.caption
            : t(
                node.val
                  .caption,
              )}
        </Text>
      </Pressable>

      {isFolder &&
        isOpen && (
          <View
            style={[
              styles.childrenContainer,
              styles.innerContainer,
            ]}
          >
            {node.children.map(
              (
                child,
                index,
              ) => (
                <DrawerItem
                  key={
                    child.val
                      .menuID ??
                    index
                  }
                  node={
                    child
                  }
                  expanded={
                    expanded
                  }
                  setExpanded={
                    setExpanded
                  }
                  pathById={
                    pathById
                  }
                />
              ),
            )}
          </View>
        )}
    </View>
  );
}

interface NavigationProps {
  isWide: boolean;
  isLoggedIn: boolean;
  menu: MenuTree;
}

export function Navigation({
  menu,
  isLoggedIn,
  isWide,
}: NavigationProps) {
  const linkTo =
    useLinkTo();

  const dispatch =
    useAppDispatch();

  const { t } =
    useTranslation([
      "Drawer",
    ]);

  const api =
    useAppSelector(
      selectApi,
    );

  const isBaseMode =
    api.isBaseMode === true;

  const { rawMenu } =
    useAppSelector(
      selectMenu,
    );

  const {
    pathById,
  } = useMemo(
    () =>
      buildMenuPaths(
        rawMenu,
      ),
    [rawMenu],
  );

  const [
    expanded,
    setExpanded,
  ] = useState<
    Record<number, boolean>
  >({});

  const {
    displayName,
  } = useApplicationConfig();

  const rootPath =
    pathById[
      menu.val.menuID
    ] ??
    `/${menu.val.menuID}`;

  return (
    <View
      style={{
        flex: 1,
      }}
    >
      <View
        style={{
          flex: 1,
        }}
      >
        <View
          style={
            styles.logoContainer
          }
        >
          <Logo
            style={{
              width: 28,
              height: 28,
            }}
          />

          <Text
            style={{
              fontWeight:
                "bold",
            }}
          >
            {displayName}
            {isBaseMode
              ? " (Base)"
              : ""}
          </Text>
        </View>

        <View
          style={[
            styles.innerContainer,
            styles.menuContainer,
          ]}
        >
          <Pressable
            onPress={() => {
              dispatch(
                setActiveMenuId(
                  menu.val
                    .menuID,
                ),
              );

              linkTo(
                rootPath,
              );
            }}
            style={
              styles.row
            }
          >
            <Text
              style={
                styles.arrow
              }
            >
              {" "}
            </Text>

            <Text
              style={[
                styles.currentlyActiveMenuID,
                styles.highlight,
                styles.noSelect,
              ]}
            >
              {isDynamicMenuItem(
                menu.val,
              )
                ? menu.val
                    .caption
                : t(
                    menu.val
                      .caption,
                  )}
            </Text>
          </Pressable>

          <View
            style={[
              styles.innerContainer,
              styles.childrenContainer,
            ]}
          >
            {menu.children.map(
              (
                node,
                index,
              ) => (
                <DrawerItem
                  key={
                    node.val
                      .menuID ??
                    index
                  }
                  node={node}
                  expanded={
                    expanded
                  }
                  setExpanded={
                    setExpanded
                  }
                  pathById={
                    pathById
                  }
                />
              ),
            )}
          </View>
        </View>
      </View>

      {!isWide && (
        <View
          style={
            styles.toolboxContainer
          }
        >
          <ToolBox
            isLoggedIn={
              isLoggedIn
            }
            isBaseMode={
              isBaseMode
            }
          />
        </View>
      )}
    </View>
  );
}

const styles =
  StyleSheet.create(
    (theme) => ({
      innerContainer: {
        gap: 10,
      },

      childrenContainer: {
        marginLeft: 10,
      },

      row: {
        flexDirection:
          "row",
        alignItems:
          "center",
        gap: 6,
      },

      arrow: {
        width: 16,
        opacity: 0.8,
      },

      currentlyActiveMenuID: {
        variants: {
          isCurrentRoute: {
            true: {
              textDecorationLine:
                "underline",
            },
          },
        },
      },

      highlight: {
        variants: {
          hovered: {
            true: {
              color:
                theme.colors
                  .highlight,
            },
          },
        },
      },

      noSelect: {
        userSelect: "none",
      },

      logoContainer: {
        flexDirection:
          "row",
        alignItems:
          "center",
        gap: 7,
        borderBottomColor:
          theme.colors.border,
        borderBottomWidth: 1,
        minHeight: 74,
        padding: 10,
      },

      menuContainer: {
        marginTop: 13,
        padding: 10,
      },

      toolboxContainer: {
        borderTopColor:
          theme.colors.border,
        borderTopWidth: 1,
        padding: 10,
      },
    }),
  );