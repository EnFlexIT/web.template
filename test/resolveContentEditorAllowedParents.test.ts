import fs from "node:fs";
import path from "node:path";

const resolverPath = path.join(
  process.cwd(),
  "src/template/config/build/resolveContentEditorAllowedParents.mjs",
);

const resolverSource = fs.readFileSync(
  resolverPath,
  "utf8",
);

const executableSource = resolverSource.replace(
  "export function resolveContentEditorAllowedParents",
  "function resolveContentEditorAllowedParents",
);

// Evaluate the standalone build-time resolver without invoking
// the full generator or spawning child processes.
const resolveContentEditorAllowedParents = new Function(
  `${executableSource}
   return resolveContentEditorAllowedParents;`,
)() as (options: {
  rawValue: string;
  enabledApplicationMenus: Array<{ key: string }>;
  selectedMenuKeys: Set<string>;
  menuItems: Array<{ menuID: number }>;
  getMenuId: (key: string) => number;
}) => string[];

function context(rawValue: string) {
  return {
    rawValue,
    enabledApplicationMenus: [
      { key: "example" },
      { key: "disabled" },
    ],
    selectedMenuKeys: new Set(["example"]),
    menuItems: [{ menuID: 3900 }],
    getMenuId: (key: string) => {
      if (key === "example") return 3900;
      if (key === "disabled") return 3901;
      throw new Error(`Unknown menu: ${key}`);
    },
  };
}

describe("resolveContentEditorAllowedParents", () => {
  it("returns an empty list without configuration", () => {
    expect(
      resolveContentEditorAllowedParents(context("")),
    ).toEqual([]);
  });

  it("accepts an active generated Application menu", () => {
    expect(
      resolveContentEditorAllowedParents(context("example")),
    ).toEqual(["static:3900"]);
  });

  it("rejects unknown menus", () => {
    expect(() =>
      resolveContentEditorAllowedParents(context("unknown")),
    ).toThrow(/not an active Application menu/);
  });

  it("rejects disabled or unselected menus", () => {
    expect(() =>
      resolveContentEditorAllowedParents(context("disabled")),
    ).toThrow(/not an active Application menu/);
  });

  it("rejects Template menus", () => {
    expect(() =>
      resolveContentEditorAllowedParents(context("settings")),
    ).toThrow(/not an active Application menu/);
  });

  it("rejects duplicates", () => {
    expect(() =>
      resolveContentEditorAllowedParents(context("example,example")),
    ).toThrow(/empty or duplicate menu key/);
  });

  it("rejects empty list elements", () => {
    expect(() =>
      resolveContentEditorAllowedParents(context("example,")),
    ).toThrow(/empty or duplicate menu key/);
  });

  it("rejects menus missing from generated navigation", () => {
    const input = context("example");
    input.menuItems = [];

    expect(() =>
      resolveContentEditorAllowedParents(input),
    ).toThrow(/is not generated/);
  });
});