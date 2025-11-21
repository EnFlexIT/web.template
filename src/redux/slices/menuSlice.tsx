import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState, store } from "../store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18next from "i18next";
import { foldl } from "../../util/func";
import { PathConfigMap } from "@react-navigation/native";
import { ComponentClass, FunctionComponent, ReactNode } from "react";
import { SettingsScreen } from "../../screens/Settings";
import { MenuItem as ApiMenuItem } from "../../api/implementation/Dynamic-Content-Api";
import { UnauthenticatedSettings } from "../../screens/settings/Unauthenticated-Settings";
import { internalSetLanguage, setLanguage } from "./languageSlice";
import { PrivacySettings } from "../../screens/settings/PrivacySettings";

interface BaseMenuItem<P = {}> {
  menuID: number;
  parentID?: number;
  position?: number;
  caption: string;
  Screen?: ComponentClass<P> | FunctionComponent<P>;
}

interface DynamicMenuItem extends BaseMenuItem {
  position: number;
  Screen: undefined;
}

interface StaticMenuItem<P> extends BaseMenuItem<P> {
  position?: number;
  Screen: ComponentClass<P> | FunctionComponent<P>;
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

/**
 * adds the given node to the list of children of the node that is uniquely identified by the parentId inside of the tree
 *
 * If the parentId is not present in the tree, the tree is not modified
 *
 * @param tree The tree to which the node should be added
 * @param parentId the parentId that uniquely identifies one node of the tree to whose children the node will be added
 * @param node the node that will be added
 */
function addNodeToTree(tree: MenuTree, node: MenuNode): MenuTree {
  /**
   * Either the currently considered node is the one with the looked for parentId
   */
  if (tree.val.menuID === node.val.parentID) {
    /**
     * Then we simply return the value and add the node to the children
     */
    return {
      val: tree.val,
      children: [...tree.children, node],
    };
  } else {
  /**
   * If not, we return the value and try to add the node to any of the current children.
   */
    return {
      val: tree.val,
      children: tree.children.map((child) => addNodeToTree(child, node)),
    };
  }
}

/**
 * @param listOfNodes list of all menuItems
 * @param id the id that should be looked for
 * @returns the depth of an item to its root
 */
export function getDepthFromList(listOfNodes: MenuItem[], id: number): number {
  const r = listOfNodes.find(({ menuID }) => menuID === id);
  if (r) {
    /**
     * If parentId === undefined, then we are at the root -> the headmenu
     */
    if (!r.parentID) {
      return 0;
    } else {
      return 1 + getDepthFromList(listOfNodes, r.parentID!);
    }
  } else {
    return Number.POSITIVE_INFINITY;
  }
}

/**
 * Given a list of nodes that internally represent a tree, we convert that to an actual tree
 *
 * @param xs List of Nodes that should be converted to a tree
 * @returns tree with same semantic as the list
 */
export function rawListToTrees(xs: MenuItem[]): MenuTree[] {
  /**
   * Then we sort the array by depth of nodes (relative to the tree structure that the array represents)
   * We do this so we can be sure that for every element, assuming it has a parent, the parent element was
   *  already added to the tree
   */
  const sortedXs = xs.toSorted(
    (a, b) => getDepthFromList(xs, a.menuID!) - getDepthFromList(xs, b.menuID!),
  );

  /**
   * We then construct the tree by:
   *  1) Adding all the head menues at the root of the array
   *  2) adding all the submenues onto their respective menue.
   */
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
    sortedXs,
  );
}

/**
 * Return the list of ids making up the path to the desired id inside of the tree
 * @param xs the raw list of menuItems
 * @param xId the id to construct the path for
 * @returns path leading to the id, or undefined if there is no path up to the root
 */
export function getIdPath(xs: MenuItem[], xId: number): undefined | number[] {
  const node = xs.find(({ menuID }) => menuID === xId);

  if (node) {
    if (node.parentID) {
      const rest = getIdPath(xs, node.parentID);
      if (rest) {
        return [...rest, xId];
      } else {
        return undefined;
      }
    } else {
      return [xId];
    }
  } else {
    return undefined;
  }
}

/**
 * Header Guard that tells you wether or not a provided MenuItem is Dynamic or not
 */
export function isDynamicMenuItem<P>(
  node: MenuItem<P>,
): node is DynamicMenuItem {
  return node.Screen === undefined;
}

/**
 * Header Guard that tells you wether or not a provided MenuItem is Static or not
 */
export function isStaticMenuItem<P>(
  node: MenuItem<P>,
): node is StaticMenuItem<P> {
  return !isDynamicMenuItem(node);
}

const initialState: MenuState = {
  menu: [],
  rawMenu: [],
  activeMenuId: 1,
};

export const initializeMenu = createAsyncThunk<MenuItem[]>(
  "menu/initialize",
  async (_, thunkAPI) => {
    const state = thunkAPI.getState() as RootState;
    const lang = state.language.language;

    // if (state.api.isPointingToServer && state.api.isLoggedIn) {
    const response =
      await state.api.dynamic_content_api.defaultApi.menuGet(lang);

    /**
     * First we unfortunately have to cast the type due to missmatch
     */
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
  "menu/initialize",
  async (_, thunkAPI) => {
    const state = thunkAPI.getState() as RootState;
    const id = state.menu.activeMenuId;

    await thunkAPI.dispatch(initializeMenu());
    await thunkAPI.dispatch(setActiveMenuId(id));
  },
);

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

export const menuSlice = createSlice({
  name: "lng",
  initialState,
  reducers: {
    setActiveMenuId: (state, action: PayloadAction<number>) => {
      state.activeMenuId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeMenu.fulfilled, (state, action) => {
        state.rawMenu = [
          ...action.payload,
          {
            caption: "settings",
            menuID: 3003,
            Screen: SettingsScreen,
          },
          {
            caption: "general",
            menuID: 3004,
            parentID: 3003,
            Screen: UnauthenticatedSettings,
          },
          {
            caption: "privacysettings",
            menuID: 3005,
            parentID: 3003,
            Screen: PrivacySettings,
          },
        ];

        state.menu = rawListToTrees(state.rawMenu);
        state.activeMenuId = 1;
      })
      .addCase(internalSetLanguage, (state, action) => {});
  },
});

export const { setActiveMenuId } = menuSlice.actions;

export const selectMenu = (state: RootState) => state.menu;

export default menuSlice.reducer;
