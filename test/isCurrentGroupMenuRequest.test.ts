import {
  captureGroupMenuRequestIdentity,
  isCurrentGroupMenuRequest,
} from "../src/template/state/navigation/isCurrentGroupMenuRequest";

import type {
  TemplateRootState,
} from "../src/template/state/store/templateStoreTypes";

const client = {} as TemplateRootState["api"]["dynamic_content_api"]["defaultApi"];

function makeState(): TemplateRootState {
  return {
    api: {
      isLoggedIn: true,
      isPointingToServer: true,
      isSwitchingServer: false,
      isLoggingOut: false,
      ip: "server-a",
      jwt: "jwt-a",
      authenticationMethod: "JWT",
      dynamic_content_api: { defaultApi: client },
    },
    language: { language: "de" },
    groupRoles: {
      status: "ready",
      roles: ["Vermieter", "Mieter"],
      selectedGroupRole: "Vermieter",
      requestId: null,
      error: null,
    },
  } as unknown as TemplateRootState;
}

describe("group menu request identity", () => {
  it("captures only an assigned group role", () => {
    const state = makeState();
    const request = captureGroupMenuRequestIdentity(state);

    expect(request?.role).toBe("Vermieter");
    expect(request && isCurrentGroupMenuRequest(state, request)).toBe(true);
  });

  it("does not capture an unassigned role", () => {
    const state = makeState();
    state.groupRoles.selectedGroupRole = "EDITOR";

    expect(captureGroupMenuRequestIdentity(state)).toBeNull();
  });

  it("rejects results after switching group roles", () => {
    const state = makeState();
    const request = captureGroupMenuRequestIdentity(state)!;

    state.groupRoles.selectedGroupRole = "Mieter";

    expect(isCurrentGroupMenuRequest(state, request)).toBe(false);
  });

  it("rejects results after changing JWT", () => {
    const state = makeState();
    const request = captureGroupMenuRequestIdentity(state)!;

    state.api.jwt = "jwt-b";

    expect(isCurrentGroupMenuRequest(state, request)).toBe(false);
  });

  it("rejects results after switching servers", () => {
    const state = makeState();
    const request = captureGroupMenuRequestIdentity(state)!;

    state.api.ip = "server-b";

    expect(isCurrentGroupMenuRequest(state, request)).toBe(false);
  });

  it("rejects results after changing language", () => {
    const state = makeState();
    const request = captureGroupMenuRequestIdentity(state)!;

    state.language.language = "en";

    expect(isCurrentGroupMenuRequest(state, request)).toBe(false);
  });

  it("rejects results after reloading group roles", () => {
    const state = makeState();
    const request = captureGroupMenuRequestIdentity(state)!;

    state.groupRoles.roles = ["Vermieter", "Mieter"];

    expect(isCurrentGroupMenuRequest(state, request)).toBe(false);
  });

  it("rejects results after logout", () => {
    const state = makeState();
    const request = captureGroupMenuRequestIdentity(state)!;

    state.api.isLoggedIn = false;

    expect(isCurrentGroupMenuRequest(state, request)).toBe(false);
  });
});