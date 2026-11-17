import type {
  TemplateRootState,
} from "../src/template/state/store/templateStoreTypes";

import {
  captureBackendMenuRequestIdentity,
  isCurrentBackendMenuRequest,
} from "../src/template/state/navigation/isCurrentBackendMenuRequest";

const client = {} as TemplateRootState["api"]["dynamic_content_api"]["defaultApi"];

function state(
  changes: {
    role?: string | null;
    groups?: string[];
    backendRoles?: string[];
    loggedIn?: boolean;
    switching?: boolean;
    loggingOut?: boolean;
    language?: string;
    server?: string;
    jwt?: string | null;
    client?: typeof client;
    rolesRequestId?: string | null;
    groupStatus?: "ready" | "loading";
  } = {},
): TemplateRootState {
  return {
    api: {
      isLoggedIn: changes.loggedIn ?? true,
      isPointingToServer: true,
      isSwitchingServer: changes.switching ?? false,
      isLoggingOut: changes.loggingOut ?? false,
      ip: changes.server ?? "https://server-a.invalid",
      jwt: changes.jwt === undefined ? "token-a" : changes.jwt,
      authenticationMethod: "jwt",
      dynamic_content_api: {
        defaultApi: changes.client ?? client,
      },
    },
    language: {
      language: changes.language ?? "de",
    },
    backendRoles: {
      status: "ready",
      roles: changes.backendRoles ?? ["ADMIN", "EDITOR"],
      selectedPreviewRole: "ADMIN",
      requestId:
        changes.rolesRequestId === undefined
          ? "roles-request-a"
          : changes.rolesRequestId,
    },
    groupRoles: {
      status: changes.groupStatus ?? "ready",
      roles: changes.groups ?? ["Vermieter", "Mieter"],
      selectedGroupRole:
        changes.role === undefined ? "Vermieter" : changes.role,
      requestId: null,
      error: null,
    },
  } as unknown as TemplateRootState;
}

describe("backend menu request identity with group roles", () => {
  const original = state();
  const request = captureBackendMenuRequestIdentity(original);

  if (request === null) {
    throw new Error("Expected a valid group-role request identity");
  }

  it("accepts unchanged context", () => {
    expect(isCurrentBackendMenuRequest(original, request)).toBe(true);
  });

  it("rejects selected group changes", () => {
    expect(isCurrentBackendMenuRequest(
      state({ role: "Mieter" }), request,
    )).toBe(false);
  });

  it("rejects removal of group membership", () => {
    expect(isCurrentBackendMenuRequest(
      state({ groups: ["Mieter"] }), request,
    )).toBe(false);
  });

  it("rejects changes in the confirmed groups snapshot", () => {
    expect(isCurrentBackendMenuRequest(
      state({ groups: ["Vermieter"] }), request,
    )).toBe(false);
  });

  it("rejects logout", () => {
    expect(isCurrentBackendMenuRequest(
      state({ loggedIn: false }), request,
    )).toBe(false);
  });

  it("rejects server switching", () => {
    expect(isCurrentBackendMenuRequest(
      state({ switching: true }), request,
    )).toBe(false);
  });

  it("rejects logout in progress", () => {
    expect(isCurrentBackendMenuRequest(
      state({ loggingOut: true }), request,
    )).toBe(false);
  });

  it("rejects a different backend server", () => {
    expect(isCurrentBackendMenuRequest(
      state({ server: "https://server-b.invalid" }), request,
    )).toBe(false);
  });

  it("rejects a different JWT session", () => {
    expect(isCurrentBackendMenuRequest(
      state({ jwt: "token-b" }), request,
    )).toBe(false);
  });

  it("rejects a language change", () => {
    expect(isCurrentBackendMenuRequest(
      state({ language: "en" }), request,
    )).toBe(false);
  });

  it("rejects a replaced API client", () => {
    expect(isCurrentBackendMenuRequest(
      state({ client: {} as typeof client }), request,
    )).toBe(false);
  });

  it("rejects a changed backend roles request", () => {
    expect(isCurrentBackendMenuRequest(
      state({ rolesRequestId: "roles-request-b" }), request,
    )).toBe(false);
  });

  it("rejects loading group roles", () => {
    expect(isCurrentBackendMenuRequest(
      state({ groupStatus: "loading" }), request,
    )).toBe(false);
  });

  it("cannot capture ADMIN as a group role", () => {
    expect(captureBackendMenuRequestIdentity(
      state({ role: "ADMIN" }),
    )).toHaveProperty("role", null);
  });

  it("cannot capture EDITOR as a group role", () => {
    expect(captureBackendMenuRequestIdentity(
      state({ role: "EDITOR" }),
    )).toHaveProperty("role", null);
  });

  it("does not start without confirmed groups", () => {
    expect(captureBackendMenuRequestIdentity(
      state({ groups: [], role: null }),
    )).toHaveProperty("role", null);
  });
});
