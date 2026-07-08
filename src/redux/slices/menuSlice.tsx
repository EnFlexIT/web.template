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
    return { val: tree.val, children: [...tree.children, node] };
  }

  return {
    val: tree.val,
    children: tree.children.map((child) => addNodeToTree(child, node)),
  };
}

export function getDepthFromList(listOfNodes: MenuItem[], id: number): number {
  const r = listOfNodes.find(({ menuID }) => menuID === id);

  if (!r) return Number.POSITIVE_INFINITY;
  if (!r.parentID) return 0;

  return 1 + getDepthFromList(listOfNodes, r.parentID);
}

export function rawListToTrees(xs: MenuItem[]): MenuTree[] {
  const sortedXs = xs.toSorted(
    (a, b) => getDepthFromList(xs, a.menuID) - getDepthFromList(xs, b.menuID),
  );

  return foldl<MenuTree[], MenuItem>(
    (acc, curr) =>
      !curr.parentID
        ? [...acc, { val: curr, children: [] }]
        : acc.map((node) => addNodeToTree(node, { children: [], val: curr })),
    [],
    sortedXs,
  );
}

/**
 * Pfad von Root -> id
 */
export function getIdPath(xs: MenuItem[], xId: number): undefined | number[] {
  const node = xs.find(({ menuID }) => menuID === xId);

  if (!node) return undefined;

  if (node.parentID) {
    const rest = getIdPath(xs, node.parentID);
    return rest ? [...rest, xId] : undefined;
  }

  return [xId];
}

export function isDynamicMenuItem<P>(node: MenuItem<P>): node is DynamicMenuItem {
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
    (m) => m.menuID && isMenuEnabled(m.menuID, authenticationMethod),
  );

  return first?.menuID ?? 3003;
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
    } catch (e) {
      console.warn("initializeMenu failed, fallback to static menu", e);

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
    const id = state.menu.activeMenuId;

    await thunkAPI.dispatch(initializeMenu());

    const nextState = thunkAPI.getState() as RootState;
    const stillValid = nextState.menu.rawMenu.some((m) => m.menuID === id);

    if (stillValid) {
      await thunkAPI.dispatch(setActiveMenuId(id));
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

    clearMenu: (
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
  },

  extraReducers: (builder) => {
    builder.addCase(initializeMenu.fulfilled, (state, action) => {
      const {
        dynamicMenu,
        staticMenu,
        authenticationMethod,
      } = action.payload;

      const filteredDynamic = dynamicMenu.filter((m) =>
        isMenuEnabled(m.menuID, authenticationMethod),
      );

      state.rawMenu = [...filteredDynamic, ...staticMenu];
      state.menu = rawListToTrees(state.rawMenu);

      const stillValid = state.rawMenu.some(
        (m) => m.menuID === state.activeMenuId,
      );

      if (!stillValid) {
        state.activeMenuId = getFirstUsableMenuId(
          state.rawMenu,
          authenticationMethod,
        );
      }
    });

    builder.addCase(internalSetLanguage, () => {
      // bleibt leer wie vorher
    });
  },
});

export const { setActiveMenuId, clearMenu } = menuSlice.actions;

export const selectMenu = (state: RootState) => state.menu;

export default menuSlice.reducer;