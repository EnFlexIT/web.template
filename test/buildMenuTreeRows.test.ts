import type {
  EditorMenuEntry,
} from "../src/template/editor/model/editorTypes";

import {
  buildMenuTreeRows,
} from "../src/template/editor/utils/buildMenuTreeRows";

function menu(
  id: string,
  position: number,
  parentId?: string,
): EditorMenuEntry {
  return {
    id,
    source: "application",
    caption: id,
    position,
    parentId,
  };
}

describe("buildMenuTreeRows", () => {
  it("places children directly below their parents", () => {
    const entries = [
      menu("child-a", 1, "root-a"),
      menu("root-b", 2),
      menu("root-a", 1),
      menu("child-b", 1, "root-b"),
      menu("grandchild", 1, "child-a"),
    ];

    const rows = buildMenuTreeRows(entries);

    expect(rows.map(row => row.entry.id)).toEqual([
      "root-a",
      "child-a",
      "grandchild",
      "root-b",
      "child-b",
    ]);

    expect(rows.map(row => row.depth)).toEqual([
      0, 1, 2, 0, 1,
    ]);
  });

  it("sorts sibling menus by position", () => {
    const rows = buildMenuTreeRows([
      menu("root", 0),
      menu("second", 2, "root"),
      menu("first", 1, "root"),
    ]);

    expect(rows.map(row => row.entry.id)).toEqual([
      "root",
      "first",
      "second",
    ]);
  });

  it("sorts equal positions by ID", () => {
    const rows = buildMenuTreeRows([
      menu("z", 1),
      menu("a", 1),
    ]);

    expect(rows.map(row => row.entry.id)).toEqual([
      "a",
      "z",
    ]);
  });

  it("shows entries with missing parents", () => {
    const rows = buildMenuTreeRows([
      menu("orphan", 1, "missing"),
    ]);

    expect(rows.map(row => row.entry.id)).toEqual([
      "orphan",
    ]);

    expect(rows[0].depth).toBe(0);
  });

  it("handles cyclic relationships without infinite recursion", () => {
    const rows = buildMenuTreeRows([
      menu("a", 1, "b"),
      menu("b", 1, "a"),
    ]);

    expect(rows).toHaveLength(2);
    expect(new Set(rows.map(row => row.entry.id)).size).toBe(2);
  });

  it("does not modify the original array", () => {
    const entries = [
      menu("second", 2),
      menu("first", 1),
    ];

    const originalOrder = entries.map(entry => entry.id);

    buildMenuTreeRows(entries);

    expect(entries.map(entry => entry.id)).toEqual(originalOrder);
  });
});
