import { formatBackendRoles } from "../src/template/state/authorization/formatBackendRoles";

describe("formatBackendRoles", () => {
  it("shows original backend role names", () => {
    expect(
      formatBackendRoles("ready", [
        "ADMIN",
        "Vermieter",
        "Mieter",
      ]),
    ).toBe("Rollen: ADMIN, Vermieter, Mieter");
  });

  it("shows USER only after a successful empty response", () => {
    expect(formatBackendRoles("ready", [])).toBe(
      "Rolle: USER (Standard)",
    );
  });

  it("does not turn a failed request into USER", () => {
    expect(formatBackendRoles("error", [])).toBe(
      "Rollen nicht verfügbar",
    );
  });

  it("keeps the loading state distinct", () => {
    expect(formatBackendRoles("loading", [])).toBe(
      "Rollen werden geladen",
    );
  });

  it("keeps the initial state distinct", () => {
    expect(formatBackendRoles("idle", [])).toBe(
      "Rollen noch nicht geladen",
    );
  });
});
