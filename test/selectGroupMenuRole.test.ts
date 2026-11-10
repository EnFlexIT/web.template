import {
  selectAvailableGroupRoles,
  selectGroupMenuRole,
} from "../src/template/state/authorization/selectGroupMenuRole";

import type {
  TemplateRootState,
} from "../src/template/state/store/templateStoreTypes";

function makeState(
  groupRoles: Partial<TemplateRootState["groupRoles"]> = {},
  api: Partial<TemplateRootState["api"]> = {},
): TemplateRootState {
  return {
    api: {
      isLoggedIn: true,
      isPointingToServer: true,
      isSwitchingServer: false,
      isLoggingOut: false,
      ...api,
    },
    groupRoles: {
      status: "ready",
      roles: ["Vermieter", "Mieter"],
      selectedGroupRole: "Vermieter",
      requestId: null,
      error: null,
      ...groupRoles,
    },
  } as unknown as TemplateRootState;
}

describe("group menu role selectors", () => {
  it("returns confirmed group roles", () => {
    expect(selectAvailableGroupRoles(makeState()))
      .toEqual(["Vermieter", "Mieter"]);
  });

  it("returns the selected assigned group role", () => {
    expect(selectGroupMenuRole(makeState())).toBe("Vermieter");

    expect(selectGroupMenuRole(makeState({
      selectedGroupRole: "Mieter",
    }))).toBe("Mieter");
  });

  it("rejects an unassigned role", () => {
    expect(selectGroupMenuRole(makeState({
      selectedGroupRole: "AndereRolle",
    }))).toBeNull();
  });

  it("does not substitute backend ADMIN or EDITOR", () => {
    expect(selectGroupMenuRole(makeState({
      selectedGroupRole: "EDITOR",
    }))).toBeNull();
  });

  it("does not select a role while loading", () => {
    const state = makeState({ status: "loading" });
    expect(selectAvailableGroupRoles(state)).toEqual([]);
    expect(selectGroupMenuRole(state)).toBeNull();
  });

  it("handles no assigned group roles", () => {
    expect(selectGroupMenuRole(makeState({
      roles: [],
      selectedGroupRole: null,
    }))).toBeNull();
  });

  it("rejects roles after logout", () => {
    expect(selectGroupMenuRole(makeState(
      {},
      { isLoggedIn: false },
    ))).toBeNull();
  });

  it("rejects roles during server switching", () => {
    expect(selectGroupMenuRole(makeState(
      {},
      { isSwitchingServer: true },
    ))).toBeNull();
  });

  it("rejects roles during logout", () => {
    expect(selectGroupMenuRole(makeState(
      {},
      { isLoggingOut: true },
    ))).toBeNull();
  });

  it("rejects roles without an active server", () => {
    expect(selectGroupMenuRole(makeState(
      {},
      { isPointingToServer: false },
    ))).toBeNull();
  });
});