import {
  isStoredContentEntry,
} from "../src/template/editor/storage/storedDraftGuards";

function entry(groupRoles?: unknown): unknown {
  return {
    id: "content:folder-1",
    source: "content",
    parentId: "application:root",
    caption: "Dokumentation",
    position: 1,
    ...(groupRoles === undefined ? {} : { groupRoles }),
  };
}

describe("stored menu group roles", () => {
  it("accepts legacy entries", () => {
    expect(isStoredContentEntry(entry())).toBe(true);
  });

  it("accepts public menus", () => {
    expect(isStoredContentEntry(entry([]))).toBe(true);
  });

  it("accepts one group", () => {
    expect(isStoredContentEntry(entry(["Vermieter"]))).toBe(true);
  });

  it("accepts multiple groups", () => {
    expect(
      isStoredContentEntry(entry(["Vermieter", "Mieter"])),
    ).toBe(true);
  });

  it.each([
    ["string", "Vermieter"],
    ["null", null],
    ["number", [123]],
    ["empty role", [""]],
    ["whitespace", [" Vermieter"]],
    ["duplicate", ["Mieter", "Mieter"]],
  ])("rejects invalid %s", (_, roles) => {
    expect(isStoredContentEntry(entry(roles))).toBe(false);
  });
});