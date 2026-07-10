import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

import { RootState } from "../store";
import { foldl } from "../../util/func";

import { MenuItem as ApiMenuItem } from "../../api/implementation/Dynamic-Content-Api";
import { internalSetLanguage } from "./languageSlice";
import { getStaticMenu } from "../slices/staticMenu";
import { isMenuEnabled } from "./featureFlags";
import type { AuthMethod } from "./apiSlice";

interface BaseMenuItem<P = {}> {
  menuID: number;
  parentID?: number;
  position?: number;
  caption: string;
  Screen?: any;
}

interface DynamicMenuItem extends BaseMenuItem {
  position: number;
  Screen: undefined;
}

interface StaticMenuItem<P> extends BaseMenuItem<P> {
  position?: number;
  Screen: any;
}

export type MenuItem<P = {}> = DynamicMenuItem | StaticMenuItem<P>;

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

type InitializeMenuResult = {
  dynamicMenu: MenuItem[];
  staticMenu: MenuItem[];
  authenticationMethod?: AuthMethod;
};

function addNodeToTree(tree: MenuTree, node: MenuNode): MenuTree {
  if (tree.val.menuID === node.val.parentID) {
    return {
      val: tree.val,
      children: [...tree.children, node],
    };
  }

  return {
    val: tree.val,
    children: tree.children.map((child) => addNodeToTree(child, node)),
  };
}

export function getDepthFromList(listOfNodes: MenuItem[], id: number): number {
  const item = listOfNodes.find(({ menuID }) => menuID === id);

  if (!item) return Number.POSITIVE_INFINITY;
  if (!item.parentID) return 0;

  return 1 + getDepthFromList(listOfNodes, item.parentID);
}

export function rawListToTrees(items: MenuItem[]): MenuTree[] {
  const sortedItems = items.toSorted(
    (a, b) =>
      getDepthFromList(items, a.menuID) -
      getDepthFromList(items, b.menuID),
  );

  return foldl<MenuTree[], MenuItem>(
    (acc, curr) =>
      !curr.parentID
        ? [...acc, { val: curr, children: [] }]
        : acc.map((node) =>
            addNodeToTree(node, {
              children: [],
              val: curr,
            }),
          ),
    [],
    sortedItems,
  );
}

/**
 * Pfad von Root -> id
 */
export function getIdPath(
  items: MenuItem[],
  menuId: number,
): undefined | number[] {
  const node = items.find(({ menuID }) => menuID === menuId);

  if (!node) return undefined;

  if (node.parentID) {
    const parentPath = getIdPath(items, node.parentID);
    return parentPath ? [...parentPath, menuId] : undefined;
  }

  return [menuId];
}

export function isDynamicMenuItem<P>(
  node: MenuItem<P>,
): node is DynamicMenuItem {
  return node.Screen === undefined;
}

export function hasId(tree: MenuTree, id: number): boolean {
  return (
    tree.val.menuID === id ||
    foldl<boolean, MenuNode>(
      (acc, curr) => acc || hasId(curr, id),
      false,
      tree.children,
    )
  );
}

function getFirstUsableMenuId(
  items: MenuItem[],
  authenticationMethod?: AuthMethod,
): number {
  const first = items.find(
    (item) =>
      item.menuID &&
      isMenuEnabled(item.menuID, authenticationMethod),
  );

  return first?.menuID ?? 3003;
}

/**
 * Static + Dynamic Menu sauber zusammenführen.
 *
 * Wichtig:
 * - Static Menu hat Vorrang.
 * - Dynamische Menüpunkte mit gleicher menuID werden entfernt.
 * - Sonst kann ein dynamischer Eintrag ohne Screen einen statischen Screen überschreiben.
 */
function mergeMenus(
  staticMenu: MenuItem[],
  dynamicMenu: MenuItem[],
  authenticationMethod?: AuthMethod,
): MenuItem[] {
  const staticIds = new Set(staticMenu.map((item) => item.menuID));

  const filteredDynamic = dynamicMenu.filter(
    (item) =>
      !staticIds.has(item.menuID) &&
      isMenuEnabled(item.menuID, authenticationMethod),
  );

  return [...staticMenu, ...filteredDynamic];
}

/**
 * Initial wird noch ohne Auth-Methode gebaut.
 * Nach Login wird initializeMenu() mit aktueller Auth-Methode neu aufgebaut.
 */
const initialStaticMenu = getStaticMenu();

const initialState: MenuState = {
  menu: rawListToTrees(initialStaticMenu),
  rawMenu: initialStaticMenu,
  activeMenuId: getFirstUsableMenuId(initialStaticMenu),
};

export const initializeMenu = createAsyncThunk<InitializeMenuResult>(
  "menu/initialize",
  async (_, thunkAPI) => {
    const state = thunkAPI.getState() as RootState;

    const lang = state.language.language;
    const authenticationMethod = state.api.authenticationMethod;

    const staticMenu = getStaticMenu(authenticationMethod);

    if (!state.api.isPointingToServer) {
      return {
        dynamicMenu: [],
        staticMenu,
        authenticationMethod,
      };
    }

    if (state.api.isLoggedIn !== true) {
      return {
        dynamicMenu: [],
        staticMenu,
        authenticationMethod,
      };
    }

    try {
      const response =
        await state.api.dynamic_content_api.defaultApi.menuGet(lang);

      const raw = response?.data as any;

      const data: ApiMenuItem[] = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data)
          ? raw.data
          : Array.isArray(raw?.items)
            ? raw.items
            : Array.isArray(raw?.menu)
              ? raw.menu
              : [];

      if (!Array.isArray(data) || data.length === 0) {
        return {
          dynamicMenu: [],
          staticMenu,
          authenticationMethod,
        };
      }

      const dynamicMenu: MenuItem[] = data.map((node) => ({
        menuID: node.menuID!,
        parentID: node.parentID,
        position: node.position,
        caption: node.caption,
        Screen: undefined,
      }));

      return {
        dynamicMenu,
        staticMenu,
        authenticationMethod,
      };
    } catch (error) {
      console.warn("initializeMenu failed, fallback to static menu", error);

      return {
        dynamicMenu: [],
        staticMenu,
        authenticationMethod,
      };
    }
  },
);

export const updateMenu = createAsyncThunk(
  "menu/update",
  async (_, thunkAPI) => {
    const state = thunkAPI.getState() as RootState;
    const previousActiveMenuId = state.menu.activeMenuId;

    await thunkAPI.dispatch(initializeMenu());

    const nextState = thunkAPI.getState() as RootState;

    const stillValid = nextState.menu.rawMenu.some(
      (item) => item.menuID === previousActiveMenuId,
    );

    if (stillValid) {
      await thunkAPI.dispatch(setActiveMenuId(previousActiveMenuId));
    }
  },
);

export const menuSlice = createSlice({
  name: "menu",
  initialState,

  reducers: {
    setActiveMenuId: (state, action: PayloadAction<number>) => {
      state.activeMenuId = action.payload;
    },

    clearMenu: {
      reducer: (
        state,
        action: PayloadAction<AuthMethod | undefined>,
      ) => {
        const authenticationMethod = action.payload;
        const staticMenu = getStaticMenu(authenticationMethod);

        state.rawMenu = staticMenu;
        state.menu = rawListToTrees(staticMenu);
        state.activeMenuId = getFirstUsableMenuId(
          staticMenu,
          authenticationMethod,
        );
      },

      prepare: (authenticationMethod?: AuthMethod) => ({
        payload: authenticationMethod,
      }),
    },
  },

  extraReducers: (builder) => {
    builder.addCase(initializeMenu.fulfilled, (state, action) => {
      const {
        dynamicMenu,
        staticMenu,
        authenticationMethod,
      } = action.payload;

      state.rawMenu = mergeMenus(
        staticMenu,
        dynamicMenu,
        authenticationMethod,
      );

      state.menu = rawListToTrees(state.rawMenu);

      const stillValid = state.rawMenu.some(
        (item) => item.menuID === state.activeMenuId,
      );

      if (!stillValid) {
        state.activeMenuId = getFirstUsableMenuId(
          state.rawMenu,
          authenticationMethod,
        );
      }

      console.log(
        "[MENU DEBUG UserProfile]",
        state.rawMenu
          .filter((item) => item.menuID === 3025)
          .map((item) => ({
            id: item.menuID,
            caption: item.caption,
            parentID: item.parentID,
            hasScreen: !!item.Screen,
          })),
      );
    });

    builder.addCase(internalSetLanguage, () => {
      // bleibt leer wie vorher
    });
  },
});

export const { setActiveMenuId, clearMenu } = menuSlice.actions;

export const selectMenu = (state: RootState) => state.menu;

export default menuSlice.reducer;