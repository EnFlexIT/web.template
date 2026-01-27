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
const staticMenu = getStaticMenu();
const initialState: MenuState = {
menu: rawListToTrees(staticMenu),
rawMenu: staticMenu,
activeMenuId: 3003,
};

export const initializeMenu = createAsyncThunk<MenuItem[]>(
  "menu/initialize",
  async (_, thunkAPI) => {
    const state = thunkAPI.getState() as RootState;
    const lang = state.language.language;

    if (!state.api.isPointingToServer) return [];

    // nur wenn Login aktiv ist
    if (state.api.isLoggedIn !== true) return [];

    try {
      const response = await state.api.dynamic_content_api.defaultApi.menuGet(lang);

      const raw = response?.data as any;

      // ✅ akzeptiere mehrere mögliche Shapes
      const data: ApiMenuItem[] = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw?.items)
        ? raw.items
        : Array.isArray(raw?.menu)
        ? raw.menu
        : [];

      // falls Server was Komisches liefert -> einfach kein dynamic menu
      if (!Array.isArray(data) || data.length === 0) return [];

      return data.map((node) => ({
        menuID: node.menuID!,
        parentID: node.parentID,
        position: node.position,
        caption: node.caption,
        Screen: undefined,
      }));
    } catch (e) {
      // 401 / Netzwerk / Format -> kein Crash, einfach fallback auf static
      console.warn("initializeMenu failed, fallback to static menu", e);
      return [];
    }
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


const dynamic = Array.isArray(action.payload) ? action.payload : [];


state.rawMenu = [...dynamic, ...staticMenu];
state.menu = rawListToTrees(state.rawMenu);


const stillValid = state.rawMenu.some((m) => m.menuID === state.activeMenuId);
if (!stillValid) state.activeMenuId = staticMenu[0]?.menuID ?? 3003;
});

    builder.addCase(internalSetLanguage, () => {
      // optional
    });
  },
});

export const { setActiveMenuId } = menuSlice.actions;
export const selectMenu = (state: RootState) => state.menu;

export default menuSlice.reducer;
