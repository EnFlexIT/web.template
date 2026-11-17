import type {
  TemplateRootState,
} from "../src/template/state/store/templateStoreTypes";

import {
  selectCanUseContentEditor,
  selectVerifiedBackendRoles,
} from "../src/template/state/authorization/selectVerifiedBackendRoles";

function makeState(
  roles: string[],
  status: "idle" | "loading" | "ready" | "error" = "ready",
  isLoggedIn = true,
  isSwitchingServer = false,
  isLoggingOut = false,
): TemplateRootState {
  return {
    api: {
      isLoggedIn,
      isSwitchingServer,
      isLoggingOut,
    },
    backendRoles: {
      status,
      roles,
    },
  } as unknown as TemplateRootState;
}

describe("verified backend role selectors", () => {
  it("preserves application-specific roles", () => {
    const state = makeState(["Vermieter", "EDITOR"]);

    expect(selectVerifiedBackendRoles(state)).toEqual([
      "Vermieter",
      "EDITOR",
    ]);

    expect(selectCanUseContentEditor(state)).toBe(true);
  });

  it("does not grant editor rights to Vermieter", () => {
    expect(
      selectCanUseContentEditor(makeState(["Vermieter"])),
    ).toBe(false);
  });

  it("does not automatically equate ADMIN with EDITOR", () => {
    expect(
      selectCanUseContentEditor(makeState(["ADMIN"])),
    ).toBe(false);
  });

  it("rejects roles while loading", () => {
    expect(
      selectVerifiedBackendRoles(
        makeState(["EDITOR"], "loading"),
      ),
    ).toEqual([]);
  });

  it("rejects roles after an API error", () => {
    expect(
      selectCanUseContentEditor(
        makeState(["EDITOR"], "error"),
      ),
    ).toBe(false);
  });

  it("rejects roles without login", () => {
    expect(
      selectCanUseContentEditor(
        makeState(["EDITOR"], "ready", false),
      ),
    ).toBe(false);
  });

  it("rejects roles during server switching", () => {
    expect(
      selectCanUseContentEditor(
        makeState(["EDITOR"], "ready", true, true),
      ),
    ).toBe(false);
  });

  it("rejects roles during logout", () => {
    expect(
      selectCanUseContentEditor(
        makeState(["EDITOR"], "ready", true, false, true),
      ),
    ).toBe(false);
  });

  it("does not invent USER for an empty backend response", () => {
    expect(
      selectVerifiedBackendRoles(makeState([])),
    ).toEqual([]);
  });
});
