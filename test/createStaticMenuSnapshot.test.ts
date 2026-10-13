import type { StaticMenuItem } from "../src/template/navigation/menu/types";

import {
  createStaticMenuSnapshot,
} from "../src/template/editor/adapters/createStaticMenuSnapshot";

const TestScreen = () => null;

function createMenuItems(): StaticMenuItem[] {
  return [
    {
      menuID: 100,
      caption: "Application",
      position: 1,
      Screen: TestScreen,
    },
    {
      menuID: 110,
      parentID: 100,
      caption: "Project Setup",
      position: 2,
      Screen: TestScreen,
    },
    {
      menuID: 120,
      parentID: 100,
      caption: "Documentation",
      Screen: TestScreen,
    },
  ];
}

describe("createStaticMenuSnapshot", () => {
  it("converts numeric menu IDs into stable editor IDs", () => {
    const snapshot = createStaticMenuSnapshot(
      "hems",
      createMenuItems(),
    );

    expect(snapshot.entries.map(entry => entry.id)).toEqual([
      "static:100",
      "static:110",
      "static:120",
    ]);

    expect(snapshot.entries.map(entry => entry.menuID)).toEqual([
      100,
      110,
      120,
    ]);
  });

  it("preserves parent relationships and positions", () => {
    const snapshot = createStaticMenuSnapshot(
      "hems",
      createMenuItems(),
    );

    expect(snapshot.entries[1].parentId).toBe("static:100");
    expect(snapshot.entries[1].position).toBe(2);
    expect(snapshot.entries[2].position).toBe(0);
  });

  it("does not expose React Screens in editor entries", () => {
    const snapshot = createStaticMenuSnapshot(
      "hems",
      createMenuItems(),
    );

    for (const entry of snapshot.entries) {
      expect(entry).not.toHaveProperty("Screen");
      expect(
        Object.values(entry).some(value => typeof value === "function"),
      ).toBe(false);
    }
  });

  it("protects all registered static menus", () => {
    const snapshot = createStaticMenuSnapshot(
      "hems",
      createMenuItems(),
    );

    expect(snapshot.protectedEntries).toHaveLength(3);

    for (const protectedEntry of snapshot.protectedEntries) {
      expect(protectedEntry.permissions).toEqual({
        allowCaptionChange: false,
        allowPositionChange: false,
        allowParentChange: false,
      });
    }
  });

  it("creates a complete trusted inventory", () => {
    const snapshot = createStaticMenuSnapshot(
      "hems",
      createMenuItems(),
    );

    expect(snapshot.inventory).toEqual({
      applicationId: "hems",
      staticMenuIds: [
        "static:100",
        "static:110",
        "static:120",
      ],
    });
  });

  it("creates detached copies of menu entries", () => {
    const items = createMenuItems();
    const snapshot = createStaticMenuSnapshot("hems", items);

    snapshot.entries[0].caption = "Changed";

    expect(items[0].caption).toBe("Application");
    expect(snapshot.protectedEntries[0].original.caption).toBe(
      "Application",
    );
  });
});
