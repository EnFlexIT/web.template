jest.mock(
  "@react-native-async-storage/async-storage",
  () =>
    require(
      "@react-native-async-storage/async-storage/jest/async-storage-mock",
    ),
);

import reducer, {
  getDepthFromList,
  initializeMenu,
  isDynamicMenuItem,
  rawListToTrees,
  setActiveMenuId,
} from "@/template/state/navigation/menuSlice";

import type {
  MenuItem,
  MenuState,
} from "@/template/state/navigation/menuSlice";

describe("menuSlice", () => {
  const emptyState: MenuState = {
    menu: [],
    rawMenu: [],
    activeMenuId: 1,
  };

  it("should return a neutral initial state", () => {
    const state = reducer(
      undefined,
      {
        type: "unknown",
      },
    );

    expect(
      state.activeMenuId,
    ).toBe(3003);

    expect(
      state.rawMenu,
    ).toHaveLength(0);

    expect(
      state.menu,
    ).toHaveLength(0);
  });

  it("should set activeMenuId", () => {
    const state = reducer(
      emptyState,
      setActiveMenuId(5),
    );

    expect(
      state.activeMenuId,
    ).toBe(5);
  });

  it(
    "should handle initializeMenu.fulfilled",
    () => {
      const dynamicMenu: MenuItem[] = [
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

      const staticMenu: MenuItem[] = [
        {
          menuID: 3003,
          caption: "settings",
          position: 0,
          Screen: () => null,
        },
      ];

      const action = {
        type:
          initializeMenu.fulfilled.type,

        payload: {
          dynamicMenu,
          staticMenu,
          authenticationMethod:
            "jwt" as const,
        },
      };

      const state = reducer(
        emptyState,
        action,
      );

      expect(
        state.rawMenu,
      ).toHaveLength(3);

      expect(
        state.rawMenu.some(
          (item) =>
            item.menuID === 1,
        ),
      ).toBe(true);

      expect(
        state.rawMenu.some(
          (item) =>
            item.menuID === 2,
        ),
      ).toBe(true);

      expect(
        state.rawMenu.some(
          (item) =>
            item.menuID === 3003,
        ),
      ).toBe(true);

      expect(
        state.menu.length,
      ).toBeGreaterThan(0);

      expect(
        state.activeMenuId,
      ).toBe(1);
    },
  );
});

describe(
  "menuSlice helpers",
  () => {
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

    it(
      "calculates the correct menu depth",
      () => {
        expect(
          getDepthFromList(
            flatMenu,
            1,
          ),
        ).toBe(0);

        expect(
          getDepthFromList(
            flatMenu,
            2,
          ),
        ).toBe(1);

        expect(
          getDepthFromList(
            flatMenu,
            3,
          ),
        ).toBe(2);
      },
    );

    it(
      "builds the correct menu tree",
      () => {
        const tree =
          rawListToTrees(
            flatMenu,
          );

        expect(
          tree,
        ).toHaveLength(1);

        expect(
          tree[0].val.menuID,
        ).toBe(1);

        expect(
          tree[0].children,
        ).toHaveLength(1);

        expect(
          tree[0]
            .children[0]
            .val.menuID,
        ).toBe(2);

        expect(
          tree[0]
            .children[0]
            .children,
        ).toHaveLength(1);

        expect(
          tree[0]
            .children[0]
            .children[0]
            .val.menuID,
        ).toBe(3);
      },
    );

    it(
      "detects dynamic and static menu items",
      () => {
        const dynamicItem: MenuItem = {
          menuID: 10,
          caption: "Dynamic",
          position: 0,
          Screen: undefined,
        };

        const staticItem: MenuItem = {
          menuID: 11,
          caption: "Static",
          position: 0,
          Screen: () => null,
        };

        expect(
          isDynamicMenuItem(
            dynamicItem,
          ),
        ).toBe(true);

        expect(
          isDynamicMenuItem(
            staticItem,
          ),
        ).toBe(false);
      },
    );
  },
);

/**
 * ============================================================
 * FILE
 * ============================================================
 * test/menuSlice.test.ts
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
 * - leeres Menü nach einem Refactoring
 * - falsche activeMenuId
 * - kaputten Menübaum
 * - fehlerhafte Verarbeitung dynamischer Menüs
 * - Fehler beim Zusammenführen statischer und dynamischer Menüs
 *
 * ============================================================
 * DEPENDENCIES MOCKED
 * ============================================================
 * - AsyncStorage
 * - staticMenu
 * - featureFlags
 *
 * ============================================================
 * GOAL
 * ============================================================
 * Der Slice wird isoliert und ohne React-Native-UI getestet.
 * ============================================================
 */