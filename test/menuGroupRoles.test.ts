import type {
  EditorDraft,
} from "../src/template/editor/model/editorTypes";

import {
  validateMenuDraft,
} from "../src/template/editor/validation/validateMenuDraft";

function createDraft(groupRoles?: unknown): EditorDraft {
  return {
    schemaVersion: 1,
    applicationId: "test-app",
    entries: [
      {
        id: "content:test-folder",
        source: "content",
        caption: "Testordner",
        position: 1,
        ...(groupRoles === undefined
          ? {}
          : { groupRoles }),
      },
    ],
    pages: [],
  } as EditorDraft;
}

describe("menu group roles", () => {
  it("accepts a public menu without group roles", () => {
    expect(validateMenuDraft(createDraft()))
      .toEqual([]);
  });

  it("accepts an explicit empty group list", () => {
    expect(validateMenuDraft(createDraft([])))
      .toEqual([]);
  });

  it("accepts one assigned group", () => {
    expect(validateMenuDraft(createDraft(["Vermieter"])))
      .toEqual([]);
  });

  it("accepts multiple assigned groups", () => {
    expect(validateMenuDraft(
      createDraft(["Vermieter", "Mieter"]),
    )).toEqual([]);
  });

  it.each([
    ["invalid type", "Vermieter"],
    ["non-string role", [12]],
    ["blank role", [""]],
    ["whitespace role", [" Vermieter"]],
    ["duplicate role", ["Mieter", "Mieter"]],
    ["null", null],
  ])("rejects %s", (_, roles) => {
    expect(
      validateMenuDraft(createDraft(roles))
        .some(error => error.code === "INVALID_GROUP_ROLES"),
    ).toBe(true);
  });

  it("preserves schema version 1", () => {
    expect(createDraft(["Vermieter"]).schemaVersion)
      .toBe(1);
  });
});