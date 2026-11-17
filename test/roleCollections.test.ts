import {
  getConfirmedGroupRoles,
  hasConfirmedBackendRole,
  resolveGroupMenuPreviewRole,
  unavailableRoleCollections,
} from "../src/template/state/authorization/roleCollections";

describe("separate role collections", () => {
  const collections = {
    backendRoles: ["ADMIN", "EDITOR"],
    groupRoles: ["Vermieter"],
  };

  it("fails closed when no API result is available", () => {
    expect(
      hasConfirmedBackendRole(unavailableRoleCollections, "EDITOR"),
    ).toBe(false);

    expect(
      getConfirmedGroupRoles(unavailableRoleCollections),
    ).toEqual([]);

    expect(
      resolveGroupMenuPreviewRole(unavailableRoleCollections, null),
    ).toBeNull();
  });

  it("checks backend roles separately", () => {
    expect(hasConfirmedBackendRole(collections, "EDITOR")).toBe(true);
    expect(hasConfirmedBackendRole(collections, "ADMIN")).toBe(true);
    expect(hasConfirmedBackendRole(collections, "Vermieter")).toBe(false);
  });

  it("does not confuse a group role with a backend role", () => {
    expect(
      hasConfirmedBackendRole(
        { backendRoles: [], groupRoles: ["EDITOR"] },
        "EDITOR",
      ),
    ).toBe(false);
  });

  it("exposes only confirmed group roles for menu preview", () => {
    expect(getConfirmedGroupRoles(collections)).toEqual(["Vermieter"]);
    expect(resolveGroupMenuPreviewRole(collections, null)).toBe("Vermieter");
  });

  it("rejects backend-only roles as menu preview roles", () => {
    expect(
      resolveGroupMenuPreviewRole(collections, "EDITOR"),
    ).toBe("Vermieter");
  });

  it("returns null when no group roles are assigned", () => {
    expect(
      resolveGroupMenuPreviewRole(
        { backendRoles: ["ADMIN"], groupRoles: [] },
        null,
      ),
    ).toBeNull();
  });

  it("preserves a confirmed selected group role", () => {
    expect(
      resolveGroupMenuPreviewRole(
        {
          backendRoles: ["EDITOR"],
          groupRoles: ["Vermieter", "Mieter"],
        },
        "Mieter",
      ),
    ).toBe("Mieter");
  });
});