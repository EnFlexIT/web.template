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
  useUnistyles,
} from "react-native-unistyles";

import {
  useLinkTo,
  useNavigation,
  type NavigationProp,
  type ParamListBase,
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
  Icon,
} from "@/template/components/design-system/ui-elements/Icon/Icon";

import {
  selectAuthenticationMethod,
  selectApi,
} from "@/template/state/api/apiSlice";

import {
  selectEffectiveRoles,
} from "@/template/state/authorization/authorizationSlice";

import {
  getNavigationRuntime,
} from "@/template/navigation/navigationRuntime";

import {
  filterVisibleMenuRoots,
} from "@/template/navigation/filterVisibleMenuRoots";

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

import {
  getLocalPreviewChildren,
} from "@/template/editor/utils/getLocalPreviewChildren";

import {
  LocalContentSidebarTree,
} from "@/template/editor/components/LocalContentSidebarTree";

import type {
  LocalContentPreviewNode,
} from "@/template/editor/adapters/buildLocalContentPreview";

import {
  useSharedLocalContentPreview,
} from "@/template/editor/context/LocalContentPreviewContext";

import { canEditLocalContent } from "@/template/editor/authorization/canEditLocalContent";
import { useLocalContentEditorPanel } from "@/template/editor/context/LocalContentEditorPanelContext";

import { Dropdown } from "@/template/components/design-system/ui-elements/Dropdown";

interface DrawerItemProps {
  node: MenuTree;

  expanded:
    Record<number, boolean>;

  setExpanded:
    React.Dispatch<
      React.SetStateAction<
        Record<number, boolean>
      >
    >;

  pathById:
    Record<number, string>;

  showIcons:
    boolean;
  localPreviewRoots: readonly LocalContentPreviewNode[];
  onLocalPagePress: (pageId: string) => void;
  onLocalCreate?: (mode: "folder" | "page", parentId: string) => void;
  onLocalManage?: (entryId: string) => void;
}

function DrawerItem({
  node,
  expanded,
  setExpanded,
  pathById,
  showIcons,
  localPreviewRoots,
  onLocalPagePress,
  onLocalCreate,
  onLocalManage,
}: DrawerItemProps) {
  const linkTo =
    useLinkTo();

  const dispatch =
    useAppDispatch();

  const {
    theme,
  } = useUnistyles();

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

  const effectiveRoles =
    useAppSelector(
      selectEffectiveRoles,
    );

  const [
    hovered,
    setHovered,
  ] = useState(false);


  const id =
    node.val.menuID;

  const localChildren =
    getNavigationRuntime().menu.items.some(
      item => item.menuID === id,
    )
      ? getLocalPreviewChildren(localPreviewRoots, id)
      : [];

  const isFolder =
    node.children.length > 0 ||
    localChildren.length > 0;

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
        effectiveRoles,
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

  const isActive =
    activeMenuId === id;

  const iconColor =
    isActive
      ? theme.colors.primary
      : hovered
        ? theme.colors.highlight
        : theme.colors.text;

  const chevronColor =
    hovered
      ? theme.colors.primary
      : theme.colors.text;

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
        style={
          styles.row
        }
      >
        <View
          style={
            styles.chevronSlot
          }
        >
          {isFolder ? (
            <Icon
              name={
                isOpen
                  ? "down"
                  : "right"
              }
              size={12}
              color={
                chevronColor
              }
            />
          ) : null}
        </View>

        {showIcons && (
          <View
            style={
              styles.iconSlot
            }
          >
            {node.val.icon ? (
              <Icon
                name={
                  node.val.icon
                }
                size={16}
                color={
                  iconColor
                }
              />
            ) : null}
          </View>
        )}

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
                  showIcons={
                    showIcons
                  }
                  localPreviewRoots={localPreviewRoots}
                  onLocalPagePress={onLocalPagePress}
                  onLocalCreate={onLocalCreate}
                  onLocalManage={onLocalManage}
                />
              ),
            )}
            {localChildren.length > 0 && (
              <LocalContentSidebarTree
                roots={localChildren}
                onPagePress={onLocalPagePress}
                onCreate={
                  canEditLocalContent(effectiveRoles)
                    ? onLocalCreate
                    : undefined
                }
                onManage={
                  canEditLocalContent(effectiveRoles)
                    ? onLocalManage
                    : undefined
                }
              />
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
  rootMenus?: MenuTree[];
}

export function Navigation({
  menu,
  rootMenus,
  isLoggedIn,
  isWide,

}: NavigationProps) {
  const localPreview =
    useSharedLocalContentPreview();

  const localPreviewRoots = localPreview.roots;

  const localNavigation =
    useNavigation<NavigationProp<ParamListBase>>();


  const { openPanel } = useLocalContentEditorPanel();

  const onLocalPagePress = (pageId: string) => {
    localNavigation.navigate("LocalContentPreview", { pageId });
  };

  const localRequestCounter = React.useRef(0);


  const onLocalCreate = (
    createMode: "folder" | "page",
    parentId: string,
  ) => {
    if (!canEditLocalContent(effectiveRoles)) return;

    if (createMode === "folder" || createMode === "page") {
      openPanel({ kind: "create", parentId, mode: createMode });
      return;
    }

    localRequestCounter.current += 1;
    localNavigation.navigate("3027", {
      createMode,
      parentId,
      requestId: `${Date.now()}-${localRequestCounter.current}`,
    });
  };

  const onLocalManage = (
    entryId: string,
    manageAction: "rename" | "move" | "delete" | "open" = "open",
  ) => {
    if (!canEditLocalContent(effectiveRoles)) return;

    if (
      manageAction === "rename" ||
      manageAction === "move" ||
      manageAction === "delete" ||
      manageAction === "open"
    ) {
      openPanel({ kind: "manage", entryId, action: manageAction });
      return;
    }

    localRequestCounter.current += 1;

    localNavigation.navigate("3027", {
      parentId: entryId,
      createMode: undefined,
      manageAction,
      requestId: `manage-${Date.now()}-${localRequestCounter.current}`,
    });
  };

  const availableRootMenus =
    rootMenus ?? [menu];
  const api =
    useAppSelector(
      selectApi,
    );

  const isBaseMode =
    api.isBaseMode === true;

  const {
    rawMenu,
    activeMenuId,
  } = useAppSelector(
    selectMenu,
  );

  const authenticationMethod =
    useAppSelector(selectAuthenticationMethod);

  const effectiveRoles =
    useAppSelector(selectEffectiveRoles);

  const visibleRootMenus =
    filterVisibleMenuRoots(
      availableRootMenus,
      id =>
        getNavigationRuntime().menu.isEnabled(
          id,
          {
            authenticationMethod,
            effectiveRoles,
          },
        ),
    );

  const {
    pathById,
  } = useMemo(
    () =>
      buildMenuPaths(
        rawMenu,
      ),
    [
      rawMenu,
    ],
  );

  const [
    expanded,
    setExpanded,
  ] = useState<
    Record<number, boolean>
  >({});

  const {
    displayName,
    navigation,
  } = useApplicationConfig();

  const showIcons =
    navigation.menu.showIcons ===
    true;


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
          </Text>
        </View>

        <View
          style={[
            styles.innerContainer,
            styles.menuContainer,
          ]}
        >
          {visibleRootMenus.map(root => (
            <DrawerItem
              key={root.val.menuID}
              node={root}
              expanded={expanded}
              setExpanded={setExpanded}
              pathById={pathById}
              showIcons={showIcons}
              localPreviewRoots={localPreviewRoots}
              onLocalPagePress={onLocalPagePress}
              onLocalCreate={onLocalCreate}
              onLocalManage={onLocalManage}
            />
          ))}
        </View>
      </View>

      {canEditLocalContent(effectiveRoles) &&
        navigation.editor?.allowedContentParentIds?.includes("static:3900") && (
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: "#d9d9d9",
              paddingHorizontal: 10,
              paddingVertical: 8,
            }}
          >
            <Dropdown<"folder" | "page">
              value="folder"
              options={{
                folder: "Neuer Menüordner",
                page: "Neue Inhaltsseite",
              }}
              triggerLabel="+ Hinzufügen"
              minimalMenu
              menuPlacement="above"
              onChange={mode => onLocalCreate(mode, "static:3900")}
              appearance="menu"
              size="sm"
              menuWidth={180}
            />
          </View>
        )}
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
            compact
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

      chevronSlot: {
        width: 16,
        height: 18,

        alignItems:
          "center",

        justifyContent:
          "center",
      },

      iconSlot: {
        width: 18,
        height: 18,

        alignItems:
          "center",

        justifyContent:
          "center",
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
        userSelect:
          "none",
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