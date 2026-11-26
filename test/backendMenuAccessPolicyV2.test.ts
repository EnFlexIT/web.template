import {
  isValidBackendMenuAccessV2,
  type BackendMenuAccessMode,
} from "../src/template/editor/adapters/backendMenuAccessPolicyV2";

const validate = isValidBackendMenuAccessV2;

describe("backendMenuAccessPolicyV2", () => {
  it("allows explicitly public menus without roles", () => {
    expect(validate("public", [], ["Vermieter"]))
      .toBe(true);
  });

  it("allows public menus without available roles", () => {
    expect(validate("public", [], []))
      .toBe(true);
  });

  it("rejects public menus with selected roles", () => {
    expect(validate("public", ["Vermieter"], ["Vermieter"]))
      .toBe(false);
  });

  it("rejects restricted menus without selected roles", () => {
    expect(validate("restricted", [], ["Vermieter"]))
      .toBe(false);
  });

  it("allows a confirmed group role", () => {
    expect(validate("restricted", ["Vermieter"], ["Vermieter"]))
      .toBe(true);
  });

  it("allows multiple confirmed group roles", () => {
    expect(validate(
      "restricted",
      ["Vermieter", "Mieter"],
      ["Vermieter", "Mieter"],
    )).toBe(true);
  });

  it("rejects unknown group roles", () => {
    expect(validate(
      "restricted",
      ["Unknown"],
      ["Vermieter"],
    )).toBe(false);
  });

  it("rejects roles removed during editing", () => {
    expect(validate("restricted", ["Vermieter"], []))
      .toBe(false);
  });

  it("rejects partially valid role selections", () => {
    expect(validate(
      "restricted",
      ["Vermieter", "Unknown"],
      ["Vermieter"],
    )).toBe(false);
  });

  it("rejects blank role names", () => {
    expect(validate("restricted", [" "], [" "]))
      .toBe(false);
  });

  it("rejects malformed access modes", () => {
    expect(validate(
      "unknown" as BackendMenuAccessMode,
      [],
      [],
    )).toBe(false);
  });

  it("does not mutate role arrays", () => {
    const selected = ["Vermieter"];
    const available = ["Vermieter", "Mieter"];

    validate("restricted", selected, available);

    expect(selected).toEqual(["Vermieter"]);
    expect(available).toEqual(["Vermieter", "Mieter"]);
  });
});
