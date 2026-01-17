import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { foldl } from "../../util/func";

import { MenuItem as ApiMenuItem } from "../../api/implementation/Dynamic-Content-Api";
import { internalSetLanguage } from "./languageSlice";
import { getStaticMenu } from "../slices/staticMenu";

interface BaseMenuItem<P = {}> {
  menuID: number;
  parentID?: number;
  position?: number;
  caption: string;
  Screen?: any; // Screen ist nur für static items gesetzt
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
 * wieder rein, weil Header/Breadcrumb es braucht
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

const initialState: MenuState = {
  menu: [],
  rawMenu: [],
  activeMenuId: 3003, // settings default
};

export const initializeMenu = createAsyncThunk<MenuItem[]>(
  "menu/initialize",
  async (_, thunkAPI) => {
    const state = thunkAPI.getState() as RootState;
    const lang = state.language.language;

    //  Nur dynamisches Menü holen, wenn JWT-login aktiv ist
    if (!state.api.isPointingToServer) return [];

    const canLoadDynamicMenu = state.api.isLoggedIn === true;
    if (!canLoadDynamicMenu) return [];

    const response = await state.api.dynamic_content_api.defaultApi.menuGet(lang);
    const data = response.data as ApiMenuItem[];

    return data.map((node) => ({
      menuID: node.menuID!,
      parentID: node.parentID,
      position: node.position,
      caption: node.caption,
      Screen: undefined,
    }));
  },
);

export const updateMenu = createAsyncThunk(
  "menu/update",
  async (_, thunkAPI) => {
    const state = thunkAPI.getState() as RootState;
    const id = state.menu.activeMenuId;

    await thunkAPI.dispatch(initializeMenu());
    await thunkAPI.dispatch(setActiveMenuId(id));
  },
);

export const menuSlice = createSlice({
  name: "menu",
  initialState,
  reducers: {
    setActiveMenuId: (state, action: PayloadAction<number>) => {
      state.activeMenuId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(initializeMenu.fulfilled, (state, action) => {
      const staticMenu = getStaticMenu();

      //  dynamic + static
      state.rawMenu = [...action.payload, ...staticMenu];

      state.menu = rawListToTrees(state.rawMenu);

      //  activeMenuId muss existieren
      const stillValid = state.rawMenu.some((m) => m.menuID === state.activeMenuId);
      if (!stillValid) {
        state.activeMenuId = staticMenu[0]?.menuID ?? 3003;
      }
    });

    builder.addCase(internalSetLanguage, () => {
      // optional
    });
  },
});

export const { setActiveMenuId } = menuSlice.actions;
export const selectMenu = (state: RootState) => state.menu;

export default menuSlice.reducer;
