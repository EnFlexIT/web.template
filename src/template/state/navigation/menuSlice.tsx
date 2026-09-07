import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";

import type {
  TemplateRootState,
} from "@/template/state/store/templateStoreTypes";

import type {
  MenuItem as ApiMenuItem,
} from "@/api/implementation/Dynamic-Content-Api";

import type {
  AuthMethod,
} from "@/template/state/api/apiSlice";

import {
  internalSetLanguage,
} from "@/template/state/localization/languageSlice";

import {
  getNavigationRuntime,
} from "@/template/navigation/navigationRuntime";

interface BaseMenuItem<P = {}> {
  menuID: number;
  parentID?: number;
  position?: number;
  caption: string;
  Screen?: any;
}

interface DynamicMenuItem
  extends BaseMenuItem {
  position: number;
  Screen: undefined;
}

interface StaticMenuItem<P = {}>
  extends BaseMenuItem<P> {
  position?: number;
  Screen: any;
}

export type MenuItem<P = {}> =
  | DynamicMenuItem
  | StaticMenuItem<P>;

export type MenuTree = MenuNode;

interface MenuNode {
  val: MenuItem;
  children: MenuNode[];
}

export interface MenuState {
  menu: MenuTree[];
  rawMenu: MenuItem[];
  activeMenuId: number;
}

/**
 * Returns the static menu configured by the active Application.
 *
 * Visibility is resolved before the menu reaches the reducer.
 */
function getConfiguredStaticMenu(
  authenticationMethod?: AuthMethod,
): MenuItem[] {
  const { menu } =
    getNavigationRuntime();

  return menu.items.filter((item) =>
    menu.isEnabled(
      item.menuID,
      {
        authenticationMethod,
      },
    ),
  );
}

/**
 * Checks Application-specific menu visibility.
 *
 * This function must only be used outside Redux reducers.
 */
function isConfiguredMenuEnabled(
  menuID: number,
  authenticationMethod?: AuthMethod,
): boolean {
  return getNavigationRuntime()
    .menu
    .isEnabled(
      menuID,
      {
        authenticationMethod,
      },
    );
}

function addNodeToTree(
  tree: MenuTree,
  node: MenuNode,
): MenuTree {
  if (
    tree.val.menuID ===
    node.val.parentID
  ) {
    return {
      val: tree.val,
      children: [
        ...tree.children,
        node,
      ],
    };
  }

  return {
    val: tree.val,
    children:
      tree.children.map(
        (child) =>
          addNodeToTree(
            child,
            node,
          ),
      ),
  };
}

export function getDepthFromList(
  listOfNodes: MenuItem[],
  id: number,
): number {
  const item =
    listOfNodes.find(
      ({ menuID }) =>
        menuID === id,
    );

  if (!item) {
    return Number.POSITIVE_INFINITY;
  }

  if (!item.parentID) {
    return 0;
  }

  return (
    1 +
    getDepthFromList(
      listOfNodes,
      item.parentID,
    )
  );
}

export function rawListToTrees(
  items: MenuItem[],
): MenuTree[] {
  const sortedItems =
    items.toSorted(
      (a, b) =>
        getDepthFromList(
          items,
          a.menuID,
        ) -
        getDepthFromList(
          items,
          b.menuID,
        ),
    );

  return sortedItems.reduce<
    MenuTree[]
  >(
    (acc, curr) =>
      !curr.parentID
        ? [
            ...acc,
            {
              val: curr,
              children: [],
            },
          ]
        : acc.map(
            (node) =>
              addNodeToTree(
                node,
                {
                  val: curr,
                  children: [],
                },
              ),
          ),
    [],
  );
}

/**
 * Returns the menu ID path from the root
 * to the specified menu item.
 */
export function getIdPath(
  items: MenuItem[],
  menuId: number,
): number[] | undefined {
  const node =
    items.find(
      ({ menuID }) =>
        menuID === menuId,
    );

  if (!node) {
    return undefined;
  }

  if (node.parentID) {
    const parentPath =
      getIdPath(
        items,
        node.parentID,
      );

    return parentPath
      ? [
          ...parentPath,
          menuId,
        ]
      : undefined;
  }

  return [menuId];
}

export function isDynamicMenuItem(
  node: MenuItem,
): node is DynamicMenuItem {
  return (
    node.Screen === undefined
  );
}

export function hasId(
  tree: MenuTree,
  id: number,
): boolean {
  return (
    tree.val.menuID === id ||
    tree.children.some(
      (child) =>
        hasId(
          child,
          id,
        ),
    )
  );
}

/**
 * Returns the first available menu item.
 *
 * Visibility has already been resolved before
 * this function is called.
 */
function getFirstUsableMenuId(
  items: MenuItem[],
): number {
  const first =
    items.find(
      (item) =>
        Boolean(
          item.menuID,
        ),
    );

  return first?.menuID ?? 3003;
}

/**
 * Merges static and dynamic menu items.
 *
 * Static menu items have precedence.
 * Visibility has already been resolved before
 * the reducer runs.
 */
function mergeMenus(
  staticMenu: MenuItem[],
  dynamicMenu: MenuItem[],
): MenuItem[] {
  const staticIds =
    new Set(
      staticMenu.map(
        (item) =>
          item.menuID,
      ),
    );

  const filteredDynamic =
    dynamicMenu.filter(
      (item) =>
        !staticIds.has(
          item.menuID,
        ),
    );

  return [
    ...staticMenu,
    ...filteredDynamic,
  ];
}

/**
 * The initial Redux state intentionally contains
 * no concrete Application menu.
 *
 * Navigation is initialized through initializeMenu
 * after the navigation runtime has been configured.
 */
const initialState: MenuState = {
  menu: [],
  rawMenu: [],
  activeMenuId: 3003,
};

export const initializeMenu =
  createAsyncThunk(
    "menu/initialize",
    async (_, thunkAPI) => {
      const state =
        thunkAPI.getState() as TemplateRootState;

      const lang =
        state.language.language;

      const authenticationMethod =
        state.api.authenticationMethod;

      const staticMenu =
        getConfiguredStaticMenu(
          authenticationMethod,
        );

      if (
        !state.api
          .isPointingToServer ||
        state.api.isLoggedIn !==
          true
      ) {
        return {
          dynamicMenu: [],
          staticMenu,
          authenticationMethod,
        };
      }

      try {
        const response =
          await state.api
            .dynamic_content_api
            .defaultApi
            .menuGet(
              lang,
            );

        const raw =
          response?.data as unknown;

        const rawRecord =
          raw &&
          typeof raw ===
            "object" &&
          !Array.isArray(raw)
            ? (
                raw as Record<
                  string,
                  unknown
                >
              )
            : null;

        const data:
          ApiMenuItem[] =
          Array.isArray(raw)
            ? (
                raw as ApiMenuItem[]
              )
            : Array.isArray(
                  rawRecord?.data,
                )
              ? (
                  rawRecord.data as ApiMenuItem[]
                )
              : Array.isArray(
                    rawRecord?.items,
                  )
                ? (
                    rawRecord.items as ApiMenuItem[]
                  )
                : Array.isArray(
                      rawRecord?.menu,
                    )
                  ? (
                      rawRecord.menu as ApiMenuItem[]
                    )
                  : [];

        if (
          data.length === 0
        ) {
          return {
            dynamicMenu: [],
            staticMenu,
            authenticationMethod,
          };
        }

        /**
         * Dynamic entries are filtered here,
         * before they reach the Redux reducer.
         */
        const dynamicMenu:
          MenuItem[] =
          data
            .map(
              (node) => ({
                menuID:
                  node.menuID!,
                parentID:
                  node.parentID,
                position:
                  node.position,
                caption:
                  node.caption,
                Screen:
                  undefined,
              }),
            )
            .filter(
              (item) =>
                isConfiguredMenuEnabled(
                  item.menuID,
                  authenticationMethod,
                ),
            );

        return {
          dynamicMenu,
          staticMenu,
          authenticationMethod,
        };
      } catch (error) {
        console.warn(
          "initializeMenu failed, fallback to static menu",
          error,
        );

        return {
          dynamicMenu: [],
          staticMenu,
          authenticationMethod,
        };
      }
    },
  );

export const updateMenu =
  createAsyncThunk(
    "menu/update",
    async (_, thunkAPI) => {
      const state =
        thunkAPI.getState() as TemplateRootState;

      const previousActiveMenuId =
        state.menu.activeMenuId;

      await thunkAPI.dispatch(
        initializeMenu(),
      );

      const nextState =
        thunkAPI.getState() as TemplateRootState;

      const stillValid =
        nextState.menu.rawMenu.some(
          (item) =>
            item.menuID ===
            previousActiveMenuId,
        );

      if (stillValid) {
        thunkAPI.dispatch(
          setActiveMenuId(
            previousActiveMenuId,
          ),
        );
      }
    },
  );

export const menuSlice =
  createSlice({
    name: "menu",

    initialState,

    reducers: {
      setActiveMenuId: (
        state,
        action:
          PayloadAction<number>,
      ) => {
        state.activeMenuId =
          action.payload;
      },

      /**
       * Internal pure reducer.
       *
       * The Application navigation has already
       * been resolved before this action reaches
       * the reducer.
       */
      replaceWithStaticMenu: (
        state,
        action:
          PayloadAction<
            MenuItem[]
          >,
      ) => {
        const staticMenu =
          action.payload;

        state.rawMenu =
          staticMenu;

        state.menu =
          rawListToTrees(
            staticMenu,
          );

        state.activeMenuId =
          getFirstUsableMenuId(
            staticMenu,
          );
      },
    },

    extraReducers: (
      builder,
    ) => {
      builder.addCase(
        initializeMenu.fulfilled,
        (
          state,
          action,
        ) => {
          const {
            dynamicMenu,
            staticMenu,
          } =
            action.payload;

          state.rawMenu =
            mergeMenus(
              staticMenu,
              dynamicMenu,
            );

          state.menu =
            rawListToTrees(
              state.rawMenu,
            );

          const stillValid =
            state.rawMenu.some(
              (item) =>
                item.menuID ===
                state.activeMenuId,
            );

          if (!stillValid) {
            state.activeMenuId =
              getFirstUsableMenuId(
                state.rawMenu,
              );
          }
        },
      );

      builder.addCase(
        internalSetLanguage,
        () => {
          // No reducer change required.
          // Menu initialization is handled separately.
        },
      );
    },
  });

const {
  setActiveMenuId,
  replaceWithStaticMenu,
} = menuSlice.actions;

export {
  setActiveMenuId,
};

/**
 * Public compatibility action creator.
 *
 * Existing callers may continue to use:
 *
 * dispatch(clearMenu());
 * dispatch(clearMenu(authenticationMethod));
 *
 * Navigation runtime access happens before the
 * Redux reducer is executed.
 */
export function clearMenu(
  authenticationMethod?: AuthMethod,
) {
  const staticMenu =
    getConfiguredStaticMenu(
      authenticationMethod,
    );

  return replaceWithStaticMenu(
    staticMenu,
  );
}

export const selectMenu = (
  state: TemplateRootState,
) => state.menu;

export default menuSlice.reducer;