import {
  configureNavigationRuntime,
  resetNavigationRuntime,
} from "../src/template/navigation/navigationRuntime";

import {
  createRuntimeMenuSnapshot,
} from "../src/template/editor/adapters/createRuntimeMenuSnapshot";

const TestScreen = () => null;

function configureTestNavigation() {
  configureNavigationRuntime({
    menu: {
      defaultMenuID: 100,
      items: [
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
      ],
      isEnabled: () => true,
    },
    tabs: {
      items: [],
      isEnabled: () => true,
    },
  });
}

describe("createRuntimeMenuSnapshot", () => {
  beforeEach(() => {
    resetNavigationRuntime();
  });

  afterEach(() => {
    resetNavigationRuntime();
  });

  it("reads registered static menus from the runtime", () => {
    configureTestNavigation();

    const snapshot = createRuntimeMenuSnapshot("hems");

    expect(snapshot.entries.map(entry => entry.id)).toEqual([
      "static:100",
      "static:110",
    ]);

    expect(snapshot.entries[1].parentId).toBe("static:100");
    expect(snapshot.inventory.applicationId).toBe("hems");
  });

  it("does not depend on menu visibility filtering", () => {
    configureTestNavigation();

    const snapshot = createRuntimeMenuSnapshot("hems");

    expect(snapshot.entries).toHaveLength(2);
    expect(snapshot.protectedEntries).toHaveLength(2);
  });

  it("rejects access before runtime configuration", () => {
    expect(() => createRuntimeMenuSnapshot("hems")).toThrow(
      "Navigation runtime has not been configured.",
    );
  });
});
