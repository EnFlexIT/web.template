import {
  filterVisibleLocalContent,
} from "../src/template/editor/utils/filterVisibleLocalContent";

import type {
  LocalContentPreviewNode,
} from "../src/template/editor/adapters/buildLocalContentPreview";

const roots: LocalContentPreviewNode[] = [
  {
    id: "visible-folder",
    parentId: "static:3900",
    caption: "Dokumentation",
    position: 1,
    children: [
      {
        id: "visible-page",
        parentId: "visible-folder",
        caption: "Anleitung",
        position: 1,
        children: [],
      },
      {
        id: "hidden-page",
        parentId: "visible-folder",
        caption: "Intern",
        position: 2,
        hidden: true,
        children: [],
      },
    ],
  },
  {
    id: "hidden-folder",
    parentId: "static:3900",
    caption: "Versteckt",
    position: 2,
    hidden: true,
    children: [
      {
        id: "nested-page",
        parentId: "hidden-folder",
        caption: "Unterseite",
        position: 1,
        children: [],
      },
    ],
  },
];

describe("filterVisibleLocalContent", () => {
  it("excludes hidden pages", () => {
    const result = filterVisibleLocalContent(roots);

    expect(result[0].children.map(node => node.id))
      .toEqual(["visible-page"]);
  });

  it("excludes hidden folders and descendants", () => {
    const result = filterVisibleLocalContent(roots);

    expect(result.map(node => node.id))
      .toEqual(["visible-folder"]);
  });

  it("does not modify the editor tree", () => {
    filterVisibleLocalContent(roots);

    expect(roots).toHaveLength(2);
    expect(roots[0].children).toHaveLength(2);
    expect(roots[1].children).toHaveLength(1);
  });

  it("keeps entries without a hidden flag visible", () => {
    const result = filterVisibleLocalContent(roots);

    expect(result[0].children[0].id)
      .toBe("visible-page");
  });
});