import {
  getLocalPreviewChildren,
} from "../src/template/editor/utils/getLocalPreviewChildren";

import type {
  LocalContentPreviewNode,
} from "../src/template/editor/adapters/buildLocalContentPreview";

const roots: LocalContentPreviewNode[] = [
  {
    id: "content:docs",
    parentId: "static:3900",
    caption: "Dokumentation",
    position: 1,
    children: [
      {
        id: "content:guide",
        parentId: "content:docs",
        caption: "Anleitung",
        position: 1,
        contentPageId: "page:guide",
        children: [],
      },
    ],
  },
  {
    id: "content:help",
    parentId: "static:3900",
    caption: "Hilfe",
    position: 2,
    children: [],
  },
  {
    id: "content:other",
    parentId: "static:4000",
    caption: "Anderes Menü",
    position: 1,
    children: [],
  },
];

describe("getLocalPreviewChildren", () => {
  it("returns only children of the requested static menu", () => {
    const result = getLocalPreviewChildren(roots, 3900);

    expect(result.map(node => node.id)).toEqual([
      "content:docs",
      "content:help",
    ]);
  });

  it("supports a different static parent", () => {
    const result = getLocalPreviewChildren(roots, 4000);

    expect(result.map(node => node.id)).toEqual([
      "content:other",
    ]);
  });

  it("returns an empty array for a parent without local children", () => {
    expect(getLocalPreviewChildren(roots, 5000)).toEqual([]);
  });

  it("rejects invalid numeric menu IDs", () => {
    expect(getLocalPreviewChildren(roots, NaN)).toEqual([]);
    expect(getLocalPreviewChildren(roots, Infinity)).toEqual([]);
    expect(getLocalPreviewChildren(roots, 3900.5)).toEqual([]);
  });

  it("preserves nested content folders and pages", () => {
    const result = getLocalPreviewChildren(roots, 3900);

    expect(result[0].children[0].caption).toBe("Anleitung");
    expect(result[0].children[0].contentPageId).toBe("page:guide");
  });

  it("does not modify the original preview tree", () => {
    const original = JSON.stringify(roots);

    getLocalPreviewChildren(roots, 3900);

    expect(JSON.stringify(roots)).toBe(original);
  });
});