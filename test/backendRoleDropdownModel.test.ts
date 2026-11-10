import { getBackendRoleDropdownModel } from "../src/template/state/authorization/backendRoleDropdownModel";

describe("getBackendRoleDropdownModel", () => {
  const roles = ["EDITOR", "ADMIN", "Vermieter"];

  it("uses only backend roles as options", () => {
    expect(
      getBackendRoleDropdownModel(roles, null),
    ).toEqual({
      options: {
        EDITOR: "EDITOR",
        ADMIN: "ADMIN",
        Vermieter: "Vermieter",
      },
      value: "EDITOR",
    });
  });

  it("preserves a valid selection", () => {
    expect(
      getBackendRoleDropdownModel(roles, "Vermieter").value,
    ).toBe("Vermieter");
  });

  it("discards a role removed by the backend", () => {
    expect(
      getBackendRoleDropdownModel(["Mieter"], "ADMIN").value,
    ).toBe("Mieter");
  });

  it("does not invent options for empty roles", () => {
    expect(
      getBackendRoleDropdownModel([], null),
    ).toEqual({
      options: {},
      value: null,
    });
  });
});
