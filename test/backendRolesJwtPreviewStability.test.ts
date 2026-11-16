import reducer, {
  backendRolesRequested,
  backendRolesReceived,
  setBackendPreviewRole,
} from "../src/template/state/authorization/backendRolesSlice";

function readyWithEditor() {
  let state = reducer(undefined, { type: "test/init" });

  state = reducer(
    state,
    backendRolesRequested({
      requestId: "1",
      sessionKey: "server-a",
    }),
  );

  state = reducer(
    state,
    backendRolesReceived({
      requestId: "1",
      sessionKey: "server-a",
      roles: ["USER", "EDITOR", "ADMIN"],
    }),
  );

  return reducer(state, setBackendPreviewRole("EDITOR"));
}

describe("Backend preview across JWT renewal", () => {
  it("keeps preview inactive until refreshed roles are verified", () => {
    let state = readyWithEditor();

    expect(state.selectedPreviewRole).toBe("EDITOR");

    state = reducer(state, {
      type: "api/setJwtLocal",
      payload: "renewed-jwt",
    });

    expect(state.status).toBe("idle");
    expect(state.roles).toEqual([]);
    expect(state.selectedPreviewRole).toBeNull();
    expect(state.previewRoleToRestore).toBe("EDITOR");

    state = reducer(
      state,
      backendRolesRequested({
        requestId: "2",
        sessionKey: "server-a",
      }),
    );

    expect(state.selectedPreviewRole).toBeNull();

    state = reducer(
      state,
      backendRolesReceived({
        requestId: "2",
        sessionKey: "server-a",
        roles: ["USER", "EDITOR", "ADMIN"],
      }),
    );

    expect(state.status).toBe("ready");
    expect(state.selectedPreviewRole).toBe("EDITOR");
    expect(state.previewRoleToRestore).toBeNull();
  });

  it("does not restore a role the backend revoked", () => {
    let state = readyWithEditor();

    state = reducer(state, {
      type: "api/setJwtLocal",
      payload: "renewed-jwt",
    });

    state = reducer(
      state,
      backendRolesRequested({
        requestId: "2",
        sessionKey: "server-a",
      }),
    );

    state = reducer(
      state,
      backendRolesReceived({
        requestId: "2",
        sessionKey: "server-a",
        roles: ["USER"],
      }),
    );

    expect(state.selectedPreviewRole).toBeNull();
    expect(state.previewRoleToRestore).toBeNull();
  });

  it("drops the saved preference when switching servers", () => {
    let state = readyWithEditor();

    state = reducer(state, {
      type: "api/setJwtLocal",
      payload: "renewed-jwt",
    });

    state = reducer(state, {
      type: "api/switchServer/pending",
    });

    expect(state.selectedPreviewRole).toBeNull();
    expect(state.previewRoleToRestore).toBeNull();
    expect(state.roles).toEqual([]);
  });

  it("drops the saved preference on logout", () => {
    let state = readyWithEditor();

    state = reducer(state, {
      type: "api/setJwtLocal",
      payload: "renewed-jwt",
    });

    state = reducer(state, {
      type: "api/logoutLocal",
    });

    expect(state.selectedPreviewRole).toBeNull();
    expect(state.previewRoleToRestore).toBeNull();
  });
});