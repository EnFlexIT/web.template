import {
  filterVisibleMenuRoots,
} from "../src/template/navigation/filterVisibleMenuRoots";

import type {
  MenuTree,
} from "../src/template/state/navigation/menuSlice";

function createRoot(
  id: number,
  children: MenuTree[] = [],
): MenuTree {
  return {
    val: {
      menuID: id,
      caption: `Menu ${id}`,
      position: 1,
      Screen: undefined,
    },
    children,
  };
}

describe("filterVisibleMenuRoots", () => {
  const roots: MenuTree[] = [
    createRoot(100, [
      createRoot(101),
      createRoot(102),
    ]),
    createRoot(200, [
      createRoot(201),
    ]),
    createRoot(300),
  ];

  it("keeps all permitted roots", () => {
    const result = filterVisibleMenuRoots(
      roots,
      () => true,
    );

    expect(result).toEqual(roots);
  });

  it("excludes a denied root and its descendants", () => {
    const result = filterVisibleMenuRoots(
      roots,
      id => id !== 200,
    );

    expect(
      result.map(root => root.val.menuID),
    ).toEqual([100, 300]);

    expect(JSON.stringify(result)).not.toContain(
      '"menuID":201',
    );
  });

  it("returns an empty list if every root is denied", () => {
    const result = filterVisibleMenuRoots(
      roots,
      () => false,
    );

    expect(result).toEqual([]);
  });

  it("does not mutate the original hierarchy", () => {
    const before = JSON.stringify(roots);

    filterVisibleMenuRoots(
      roots,
      id => id !== 100,
    );

    expect(JSON.stringify(roots)).toBe(before);
  });
});
