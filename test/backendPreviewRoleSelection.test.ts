import reducer, {
  backendRolesRequested,
  backendRolesReceived,
  backendRolesReset,
  setBackendPreviewRole,
} from "../src/template/state/authorization/backendRolesSlice";

function readyState() {
  const loading = reducer(
    undefined,
    backendRolesRequested({
      requestId: "request-1",
      sessionKey: "session-1",
    }),
  );

  return reducer(
    loading,
    backendRolesReceived({
      requestId: "request-1",
      sessionKey: "session-1",
      roles: ["ADMIN", "EDITOR", "Vermieter"],
    }),
  );
}

describe("backend preview role selection", () => {
  it("starts without an explicit selection", () => {
    expect(readyState().selectedPreviewRole).toBeNull();
  });

  it("accepts a role confirmed by the backend", () => {
    const state = reducer(
      readyState(),
      setBackendPreviewRole("EDITOR"),
    );

    expect(state.selectedPreviewRole).toBe("EDITOR");
    expect(state.roles).toEqual([
      "ADMIN",
      "EDITOR",
      "Vermieter",
    ]);
  });

  it("rejects roles that the backend did not supply", () => {
    const selected = reducer(
      readyState(),
      setBackendPreviewRole("EDITOR"),
    );

    const state = reducer(
      selected,
      setBackendPreviewRole("SuperAdmin"),
    );

    expect(state.selectedPreviewRole).toBe("EDITOR");
  });

  it("does not treat a group role as a backend permission", () => {
    const state = reducer(
      readyState(),
      setBackendPreviewRole("Vermieter"),
    );

    expect(state.selectedPreviewRole).toBeNull();
  });
  it("rejects a selection before roles are ready", () => {
    const state = reducer(
      undefined,
      setBackendPreviewRole("EDITOR"),
    );

    expect(state.selectedPreviewRole).toBeNull();
  });

  it("clears the selection when roles are reloaded", () => {
    const selected = reducer(
      readyState(),
      setBackendPreviewRole("EDITOR"),
    );

    const state = reducer(
      selected,
      backendRolesRequested({
        requestId: "request-2",
        sessionKey: "session-2",
      }),
    );

    expect(state.selectedPreviewRole).toBeNull();
    expect(state.roles).toEqual([]);
  });

  it("clears the selection on reset", () => {
    const selected = reducer(
      readyState(),
      setBackendPreviewRole("ADMIN"),
    );

    const state = reducer(selected, backendRolesReset());

    expect(state.selectedPreviewRole).toBeNull();
    expect(state.roles).toEqual([]);
  });

  it("ignores selections while roles are loading", () => {
    const loading = reducer(
      readyState(),
      backendRolesRequested({
        requestId: "request-2",
        sessionKey: "session-2",
      }),
    );

    const state = reducer(
      loading,
      setBackendPreviewRole("EDITOR"),
    );

    expect(state.selectedPreviewRole).toBeNull();
  });
});