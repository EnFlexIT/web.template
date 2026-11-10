import reducer, {
  initializeMenu,
  type MenuItem,
} from "../src/template/state/navigation/menuSlice";

function item(
  menuID: number,
  dynamic: boolean,
): MenuItem {
  return {
    menuID,
    caption: `Menu ${menuID}`,
    position: 0,
    Screen: dynamic ? undefined : (() => null),
  };
}

const staticMenu = [item(3003, false)];
const dynamicA = [item(101, true)];
const dynamicB = [item(202, true)];

function fulfilled(
  requestId: string,
  dynamicMenu: MenuItem[],
) {
  return initializeMenu.fulfilled(
    {
      staticMenu,
      dynamicMenu,
      authenticationMethod: "jwt",
      defaultMenuID: 3003,
    },
    requestId,
    undefined,
  );
}

describe("backend menu request ordering", () => {
  it("accepts the newest response", () => {
    const pending = reducer(
      undefined,
      initializeMenu.pending("request-A", undefined),
    );

    const result = reducer(
      pending,
      fulfilled("request-A", dynamicA),
    );

    expect(result.rawMenu.map((x) => x.menuID))
      .toEqual([3003, 101]);
  });

  it("ignores an older response after a new request starts", () => {
    const first = reducer(
      undefined,
      initializeMenu.pending("request-A", undefined),
    );

    const second = reducer(
      first,
      initializeMenu.pending("request-B", undefined),
    );

    const stale = reducer(
      second,
      fulfilled("request-A", dynamicA),
    );

    expect(stale.rawMenu).toEqual([]);

    const current = reducer(
      stale,
      fulfilled("request-B", dynamicB),
    );

    expect(current.rawMenu.map((x) => x.menuID))
      .toEqual([3003, 202]);
  });

  it("removes old dynamic menus as soon as a new request starts", () => {
    const loaded = reducer(
      reducer(
        undefined,
        initializeMenu.pending("request-A", undefined),
      ),
      fulfilled("request-A", dynamicA),
    );

    const reloading = reducer(
      loaded,
      initializeMenu.pending("request-B", undefined),
    );

    expect(reloading.rawMenu.map((x) => x.menuID))
      .toEqual([3003]);
  });

  it("clears dynamic menus on preview role selection", () => {
    const loaded = reducer(
      reducer(
        undefined,
        initializeMenu.pending("request-A", undefined),
      ),
      fulfilled("request-A", dynamicA),
    );

    const changed = reducer(loaded, {
      type: "groupRoles/selectGroupRole",
      payload: "Vermieter",
    });

    expect(changed.rawMenu.map((x) => x.menuID))
      .toEqual([3003]);
  });

  it("rejects an old response after logout", () => {
    const pending = reducer(
      undefined,
      initializeMenu.pending("request-A", undefined),
    );

    const loggedOut = reducer(pending, {
      type: "api/logoutLocal",
    });

    const stale = reducer(
      loggedOut,
      fulfilled("request-A", dynamicA),
    );

    expect(stale.rawMenu).toEqual([]);
  });

  it("rejects an old response after server switching", () => {
    const pending = reducer(
      undefined,
      initializeMenu.pending("request-A", undefined),
    );

    const switching = reducer(pending, {
      type: "api/switchServer/pending",
    });

    const stale = reducer(
      switching,
      fulfilled("request-A", dynamicA),
    );

    expect(stale.rawMenu).toEqual([]);
  });

  it("rejects an old response after language change", () => {
    const pending = reducer(
      undefined,
      initializeMenu.pending("request-A", undefined),
    );

    const changed = reducer(pending, {
      type: "lng/internalSetLanguage",
      payload: { language: "en" },
    });

    const stale = reducer(
      changed,
      fulfilled("request-A", dynamicA),
    );

    expect(stale.rawMenu).toEqual([]);
  });
});
