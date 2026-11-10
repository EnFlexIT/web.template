import type {
  TemplateRootState,
} from "../src/template/state/store/templateStoreTypes";

import {
  selectBackendMenuPreviewRole,
} from "../src/template/state/authorization/selectBackendMenuPreviewRole";

function makeState({
  loggedIn = true,
  pointingToServer = true,
  switchingServer = false,
  loggingOut = false,
  groupStatus = "ready",
  groups = ["Vermieter", "Mieter"],
  selected = "Vermieter",
  backendRoles = ["ADMIN", "EDITOR", "Vermieter"],
}: {
  loggedIn?: boolean;
  pointingToServer?: boolean;
  switchingServer?: boolean;
  loggingOut?: boolean;
  groupStatus?: "idle" | "loading" | "ready" | "error";
  groups?: string[];
  selected?: string | null;
  backendRoles?: string[];
} = {}): TemplateRootState {
  return {
    api: {
      isLoggedIn: loggedIn,
      isPointingToServer: pointingToServer,
      isSwitchingServer: switchingServer,
      isLoggingOut: loggingOut,
    },
    backendRoles: {
      status: "ready",
      roles: backendRoles,
      selectedPreviewRole: "ADMIN",
    },
    groupRoles: {
      status: groupStatus,
      roles: groups,
      selectedGroupRole: selected,
      requestId: null,
      error: null,
    },
  } as unknown as TemplateRootState;
}

describe("backend menu role must be a confirmed group role", () => {
  it("uses the selected group role", () => {
    expect(selectBackendMenuPreviewRole(makeState()))
      .toBe("Vermieter");
  });

  it("uses another assigned group role", () => {
    expect(selectBackendMenuPreviewRole(
      makeState({ selected: "Mieter" }),
    )).toBe("Mieter");
  });

  it("does not use ADMIN as a group role", () => {
    expect(selectBackendMenuPreviewRole(
      makeState({ selected: "ADMIN" }),
    )).toBeNull();
  });

  it("does not use EDITOR as a group role", () => {
    expect(selectBackendMenuPreviewRole(
      makeState({ selected: "EDITOR" }),
    )).toBeNull();
  });

  it("does not substitute a mixed backend role", () => {
    expect(selectBackendMenuPreviewRole(
      makeState({ groups: [], selected: null }),
    )).toBeNull();
  });

  it("rejects unassigned groups", () => {
    expect(selectBackendMenuPreviewRole(
      makeState({ selected: "Unbekannt" }),
    )).toBeNull();
  });

  it("rejects loading group roles", () => {
    expect(selectBackendMenuPreviewRole(
      makeState({ groupStatus: "loading" }),
    )).toBeNull();
  });

  it("rejects logged-out sessions", () => {
    expect(selectBackendMenuPreviewRole(
      makeState({ loggedIn: false }),
    )).toBeNull();
  });

  it("rejects switching servers", () => {
    expect(selectBackendMenuPreviewRole(
      makeState({ switchingServer: true }),
    )).toBeNull();
  });

  it("rejects logout in progress", () => {
    expect(selectBackendMenuPreviewRole(
      makeState({ loggingOut: true }),
    )).toBeNull();
  });

  it("rejects disconnected backend", () => {
    expect(selectBackendMenuPreviewRole(
      makeState({ pointingToServer: false }),
    )).toBeNull();
  });

  it("does not grant a role from backend permissions", () => {
    expect(selectBackendMenuPreviewRole(
      makeState({
        groups: [],
        selected: null,
        backendRoles: ["ADMIN", "EDITOR"],
      }),
    )).toBeNull();
  });
});
