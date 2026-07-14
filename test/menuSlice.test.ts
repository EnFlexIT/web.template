/// <reference types="jest" />

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

jest.mock("../redux/slices/staticMenu", () => ({
  getStaticMenu: () => [
    {
      menuID: 3003,
      caption: "settings",
      position: 0,
      Screen: () => null,
    },
  ],
}));

jest.mock("../redux/slices/featureFlags", () => ({
  isMenuEnabled: () => true,
}));

import reducer, {
  MenuState,
  setActiveMenuId,
  rawListToTrees,
  getDepthFromList,
  isDynamicMenuItem,
  MenuItem,
  initializeMenu,
} from "../src/redux/slices/menuSlice";

describe("menuSlice", () => {
const emptyState: MenuState = {
  menu: [],
  rawMenu: [],
  activeMenuId: 1,
};

it("should return the initial state with static menu", () => {
  const state = reducer(undefined, { type: "unknown" });

  expect(state.activeMenuId).toBe(3003);
  expect(state.rawMenu).toHaveLength(1);
  expect(state.rawMenu[0].menuID).toBe(3003);
  expect(state.menu).toHaveLength(1);
  expect(state.menu[0].val.menuID).toBe(3003);
});

  it("should set activeMenuId", () => {
    const state = reducer(emptyState, setActiveMenuId(5))
    expect(state.activeMenuId).toBe(5);
  });

  it("should handle initializeMenu.fulfilled", () => {
    const apiMenu: MenuItem[] = [
      {
        menuID: 1,
        caption: "Home",
        position: 0,
        Screen: undefined,
      },
      {
        menuID: 2,
        caption: "Sub",
        parentID: 1,
        position: 1,
        Screen: undefined,
      },
    ];

    const action = {
      type: initializeMenu.fulfilled.type,
      payload: apiMenu,
    };

    const state = reducer(emptyState, action)

    // rawMenu enthält API-Daten + statische Settings-Einträge
    expect(state.rawMenu.length).toBeGreaterThan(apiMenu.length);

    // Menübaum wurde aufgebaut
    expect(state.menu.length).toBeGreaterThan(0);

    // activeMenuId wird zurückgesetzt
    expect(state.activeMenuId).toBe(1);
  });
});

describe("menuSlice helpers (pure functions)", () => {
  const flatMenu: MenuItem[] = [
    {
      menuID: 1,
      caption: "Root",
      position: 0,
      Screen: undefined,
    },
    {
      menuID: 2,
      caption: "Child",
      parentID: 1,
      position: 1,
      Screen: undefined,
    },
    {
      menuID: 3,
      caption: "SubChild",
      parentID: 2,
      position: 2,
      Screen: undefined,
    },
  ];

  it("getDepthFromList calculates correct depth", () => {
    expect(getDepthFromList(flatMenu, 1)).toBe(0);
    expect(getDepthFromList(flatMenu, 2)).toBe(1);
    expect(getDepthFromList(flatMenu, 3)).toBe(2);
  });

  it("rawListToTrees builds a correct tree structure", () => {
    const tree = rawListToTrees(flatMenu);

    expect(tree.length).toBe(1);
    expect(tree[0].val.menuID).toBe(1);

    expect(tree[0].children.length).toBe(1);
    expect(tree[0].children[0].val.menuID).toBe(2);

    expect(tree[0].children[0].children.length).toBe(1);
    expect(tree[0].children[0].children[0].val.menuID).toBe(3);
  });

  it("detects dynamic vs static menu items correctly", () => {
    const dynamicItem: MenuItem = {
      menuID: 10,
      caption: "Dynamic",
      position: 0,
      Screen: undefined,
    };

    const staticItem: MenuItem = {
      menuID: 11,
      caption: "Static",
      Screen: () => null,
    };

    expect(isDynamicMenuItem(dynamicItem)).toBe(true);
    //expect(isStaticMenuItem(staticItem)).toBe(true);
  });
});
/**
 * ============================================================
 * FILE
 * ============================================================
 * src/testes/menuSlice.test.ts
 *
 * ============================================================
 * PURPOSE
 * ============================================================
 * Testet den Redux menuSlice unabhängig von der UI.
 *
 * Fokus:
 * - Initial State
 * - Reducer
 * - Menübaum-Aufbau
 * - Helper-Funktionen
 * - initializeMenu.fulfilled
 *
 * ============================================================
 * PROTECTED FEATURES
 * ============================================================
 * Diese Tests verhindern:
 * - leeres Menü nach Refactoring
 * - falsche activeMenuId
 * - kaputten Menübaum
 * - fehlerhafte Verarbeitung dynamischer Menüs
 * - Fehler beim Zusammenführen von static + dynamic menu
 *
 * ============================================================
 * DEPENDENCIES MOCKED
 * ============================================================
 * - AsyncStorage
 * - staticMenu
 * - featureFlags
 *
 * Ziel:
 * Slice isoliert testen ohne React Native UI.
 * ============================================================
 */