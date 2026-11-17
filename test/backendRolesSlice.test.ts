import reducer, {
  backendRolesRequested,
  backendRolesReceived,
  backendRolesFailed,
  backendRolesReset,
} from "../src/template/state/authorization/backendRolesSlice";

describe("backendRolesSlice", () => {
  const requestA = {
    requestId: "request-a",
    sessionKey: "session-a",
  };

  const requestB = {
    requestId: "request-b",
    sessionKey: "session-b",
  };

  it("starts idle without backend roles", () => {
    const state = reducer(undefined, { type: "@@INIT" });

    expect(state.status).toBe("idle");
    expect(state.roles).toEqual([]);
    expect(state.error).toBeNull();
  });

  it("starts loading and clears previous roles", () => {
    const ready = reducer(
      reducer(undefined, backendRolesRequested(requestA)),
      backendRolesReceived({
        ...requestA,
        roles: ["EDITOR"],
      }),
    );

    const loading = reducer(
      ready,
      backendRolesRequested(requestB),
    );

    expect(loading.status).toBe("loading");
    expect(loading.roles).toEqual([]);
    expect(loading.sessionKey).toBe("session-b");
  });

  it("accepts the matching backend response", () => {
    const state = reducer(
      reducer(undefined, backendRolesRequested(requestA)),
      backendRolesReceived({
        ...requestA,
        roles: ["USER", "EDITOR"],
      }),
    );

    expect(state.status).toBe("ready");
    expect(state.roles).toEqual(["USER", "EDITOR"]);
  });

  it("rejects responses from an older request", () => {
    const loading = reducer(
      reducer(undefined, backendRolesRequested(requestA)),
      backendRolesRequested(requestB),
    );

    const result = reducer(
      loading,
      backendRolesReceived({
        ...requestA,
        roles: ["ADMIN"],
      }),
    );

    expect(result).toEqual(loading);
  });

  it("rejects mismatched session keys", () => {
    const loading = reducer(
      undefined,
      backendRolesRequested(requestA),
    );

    const result = reducer(
      loading,
      backendRolesReceived({
        requestId: "request-a",
        sessionKey: "other-session",
        roles: ["ADMIN"],
      }),
    );

    expect(result).toEqual(loading);
  });

  it("stores failures without granting roles", () => {
    const state = reducer(
      reducer(undefined, backendRolesRequested(requestA)),
      backendRolesFailed({
        ...requestA,
        error: "Request failed",
      }),
    );

    expect(state.status).toBe("error");
    expect(state.roles).toEqual([]);
    expect(state.error).toBe("Request failed");
  });

  it("ignores failures from an older request", () => {
    const loading = reducer(
      reducer(undefined, backendRolesRequested(requestA)),
      backendRolesRequested(requestB),
    );

    expect(
      reducer(
        loading,
        backendRolesFailed({
          ...requestA,
          error: "Old failure",
        }),
      ),
    ).toEqual(loading);
  });

  it("discards responses after reset", () => {
    const loading = reducer(
      undefined,
      backendRolesRequested(requestA),
    );

    const reset = reducer(
      loading,
      backendRolesReset(),
    );

    const result = reducer(
      reset,
      backendRolesReceived({
        ...requestA,
        roles: ["ADMIN"],
      }),
    );

    expect(result.status).toBe("idle");
    expect(result.roles).toEqual([]);
    expect(result).toEqual(reset);
  });
});
describe("backendRolesSlice authentication lifecycle", () => {
  const resetActionTypes = [
    "api/initialize/pending",
    "api/setIpAsync/pending",
    "api/switchServer/pending",
    "api/login/pending",
    "api/setConnectionLocal",
    "api/setJwtLocal",
    "api/logoutLocal",
    "api/logoutAsync/pending",
    "api/resetAuthAfterConfigurationChange/pending",
  ];

  it.each(resetActionTypes)(
    "clears backend roles on %s",
    (actionType) => {
      const request = {
        requestId: "old-request",
        sessionKey: "old-server",
      };

      const loading = reducer(
        undefined,
        backendRolesRequested(request),
      );

      const ready = reducer(
        loading,
        backendRolesReceived({
          ...request,
          roles: ["ADMIN"],
        }),
      );

      const reset = reducer(ready, {
        type: actionType,
      });

      expect(reset.status).toBe("idle");
      expect(reset.roles).toEqual([]);
      expect(reset.requestId).toBeNull();
      expect(reset.sessionKey).toBeNull();

      const delayed = reducer(
        reset,
        backendRolesReceived({
          ...request,
          roles: ["ADMIN"],
        }),
      );

      expect(delayed).toEqual(reset);
    },
  );
});