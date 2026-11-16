import {
  planBackendContentReorderV2,
  sortBackendContentV2,
} from "../src/template/editor/adapters/planBackendContentReorderV2";

import type {
  BackendEditorBlockV2,
} from "../src/template/editor/adapters/mapBackendContentToEditorV2";

function block(
  id: number,
  position: number,
): BackendEditorBlockV2 {
  return {
    kind: "text",
    backendContentId: id,
    position,
    editable: false,
    html: "<p>Testinhalt</p>",
    original: {
      uniqueContentId: id,
      abstractSiteContentType: "SiteContentText",
      text: "<p>Testinhalt</p>",
      mimeType: "text/html",
      editable: false,
      updatePeriodInSeconds: 30,
    },
  };
}

describe("planBackendContentReorderV2", () => {
  const blocks = [
    block(30, 3),
    block(10, 1),
    block(20, 2),
  ];

  it("sorts without mutating backend content", () => {
    const ordered = sortBackendContentV2(blocks);

    expect(ordered.map(b => b.backendContentId)).toEqual([
      10, 20, 30,
    ]);

    expect(blocks.map(b => b.backendContentId)).toEqual([
      30, 10, 20,
    ]);
  });

  it("moves the middle element upward", () => {
    expect(
      planBackendContentReorderV2(blocks, 5, 20, "up"),
    ).toEqual({
      elementId: 20,
      sourceMenuId: 5,
      targetMenuId: 5,
      position: 1,
    });
  });

  it("moves the middle element downward", () => {
    expect(
      planBackendContentReorderV2(blocks, 5, 20, "down"),
    ).toEqual({
      elementId: 20,
      sourceMenuId: 5,
      targetMenuId: 5,
      position: 3,
    });
  });

  it("returns null at the boundaries", () => {
    expect(
      planBackendContentReorderV2(blocks, 5, 10, "up"),
    ).toBeNull();

    expect(
      planBackendContentReorderV2(blocks, 5, 30, "down"),
    ).toBeNull();
  });

  it("rejects duplicate content IDs", () => {
    expect(() =>
      sortBackendContentV2([block(10, 1), block(10, 2)]),
    ).toThrow(/Ambiguous/);
  });

  it("rejects duplicate positions", () => {
    expect(() =>
      sortBackendContentV2([block(10, 1), block(20, 1)]),
    ).toThrow(/Ambiguous/);
  });

  it("rejects invalid positions", () => {
    expect(() =>
      sortBackendContentV2([block(10, -1)]),
    ).toThrow(/Ambiguous/);
  });

  it("supports an existing zero-based display order", () => {
    const zeroBased = [block(10, 0), block(20, 1)];

    expect(
      planBackendContentReorderV2(
        zeroBased, 5, 10, "down",
      ),
    ).toEqual({
      elementId: 10,
      sourceMenuId: 5,
      targetMenuId: 5,
      position: 2,
    });
  });

  it("rejects an element not present in the menu", () => {
    expect(() =>
      planBackendContentReorderV2(blocks, 5, 99, "up"),
    ).toThrow(/not found/);
  });

  it("rejects invalid identifiers", () => {
    expect(() =>
      planBackendContentReorderV2(blocks, 0, 20, "up"),
    ).toThrow(/Invalid/);
  });
});