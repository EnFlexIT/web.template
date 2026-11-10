import reducer, {
  groupRolesRequested,
  groupRolesReceived,
  groupRolesFailed,
  selectGroupRole,
  selectPublicGroupView,
  resetGroupRoles,
  initialGroupRolesState,
} from "../src/template/state/authorization/groupRolesSlice";

describe("groupRolesSlice", () => {
  it("starts without group roles", () => {
    expect(reducer(undefined, { type: "@@INIT" }))
      .toEqual(initialGroupRolesState);
  });

  it("loads multiple assigned group roles", () => {
    const pending = reducer(
      undefined,
      groupRolesRequested("request-1"),
    );

    const ready = reducer(
      pending,
      groupRolesReceived({
        requestId: "request-1",
        roles: ["Vermieter", "Mieter"],
      }),
    );

    expect(ready.status).toBe("ready");
    expect(ready.roles).toEqual(["Vermieter", "Mieter"]);
    expect(ready.selectedGroupRole).toBeNull();
  });

  it("allows selecting only assigned group roles", () => {
    const pending = reducer(
      undefined,
      groupRolesRequested("request-1"),
    );

    const ready = reducer(
      pending,
      groupRolesReceived({
        requestId: "request-1",
        roles: ["Vermieter", "Mieter"],
      }),
    );

    const selected = reducer(
      ready,
      selectGroupRole("Mieter"),
    );

    expect(selected.selectedGroupRole).toBe("Mieter");

    const rejected = reducer(
      selected,
      selectGroupRole("UnbekannteRolle"),
    );

    expect(rejected.selectedGroupRole).toBe("Mieter");
  });

  it("returns to the public USER view", () => {
    const pending = reducer(
      undefined,
      groupRolesRequested("request-public"),
    );

    const ready = reducer(
      pending,
      groupRolesReceived({
        requestId: "request-public",
        roles: ["Vermieter", "Mieter"],
      }),
    );

    expect(ready.selectedGroupRole).toBeNull();

    const selected = reducer(
      ready,
      selectGroupRole("Mieter"),
    );

    expect(selected.selectedGroupRole).toBe("Mieter");

    const publicView = reducer(
      selected,
      selectPublicGroupView(),
    );

    expect(publicView.selectedGroupRole).toBeNull();
    expect(publicView.roles).toEqual(["Vermieter", "Mieter"]);
  });

  it("supports an empty group role response", () => {
    const pending = reducer(
      undefined,
      groupRolesRequested("request-1"),
    );

    const ready = reducer(
      pending,
      groupRolesReceived({
        requestId: "request-1",
        roles: [],
      }),
    );

    expect(ready.roles).toEqual([]);
    expect(ready.selectedGroupRole).toBeNull();
  });

  it("ignores outdated API responses", () => {
    const first = reducer(
      undefined,
      groupRolesRequested("request-1"),
    );

    const second = reducer(
      first,
      groupRolesRequested("request-2"),
    );

    const stale = reducer(
      second,
      groupRolesReceived({
        requestId: "request-1",
        roles: ["Vermieter"],
      }),
    );

    expect(stale.status).toBe("loading");
    expect(stale.roles).toEqual([]);

    const current = reducer(
      stale,
      groupRolesReceived({
        requestId: "request-2",
        roles: ["Mieter"],
      }),
    );

    expect(current.roles).toEqual(["Mieter"]);
  });

  it("handles API errors", () => {
    const pending = reducer(
      undefined,
      groupRolesRequested("request-1"),
    );

    const failed = reducer(
      pending,
      groupRolesFailed({
        requestId: "request-1",
        error: "HTTP 403",
      }),
    );

    expect(failed.status).toBe("error");
    expect(failed.selectedGroupRole).toBeNull();
  });

  it("resets manually", () => {
    const pending = reducer(
      undefined,
      groupRolesRequested("request-1"),
    );

    expect(reducer(pending, resetGroupRoles()))
      .toEqual(initialGroupRolesState);
  });

  it.each([
    "api/login/pending",
    "api/logoutLocal",
    "api/switchServer/pending",
    "api/setJwtLocal",
  ])("resets on %s", type => {
    const pending = reducer(
      undefined,
      groupRolesRequested("request-1"),
    );

    expect(reducer(pending, { type }))
      .toEqual(initialGroupRolesState);
  });
});
