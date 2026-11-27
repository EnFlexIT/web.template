import {
  validateBackendMenuPositionsV2,
  validateBackendMenuSiblingPositionsV2,
  type BackendMenuPositionEntryV2,
} from "../src/template/editor/adapters/backendMenuPositionValidatorV2";

function item(
  menuId: number,
  parentId: number | null,
  position: number,
): BackendMenuPositionEntryV2 {
  return { menuId, parentId, position };
}

describe("backendMenuPositionValidatorV2", () => {
  it("accepts an empty inventory", () => {
    expect(() =>
      validateBackendMenuPositionsV2([]),
    ).not.toThrow();
  });

  it("accepts contiguous root positions", () => {
    expect(() =>
      validateBackendMenuPositionsV2([
        item(1, null, 1),
        item(2, null, 2),
      ]),
    ).not.toThrow();
  });

  it("accepts identical positions under different parents", () => {
    expect(() =>
      validateBackendMenuPositionsV2([
        item(1, null, 1),
        item(2, null, 2),
        item(3, 1, 1),
        item(4, 2, 1),
      ]),
    ).not.toThrow();
  });

  it("rejects duplicate root positions", () => {
    expect(() =>
      validateBackendMenuPositionsV2([
        item(1, null, 1),
        item(2, null, 1),
      ]),
    ).toThrow("Invalid existing menu positions");
  });

  it("rejects duplicate child positions", () => {
    expect(() =>
      validateBackendMenuPositionsV2([
        item(1, null, 1),
        item(2, 1, 1),
        item(3, 1, 1),
      ]),
    ).toThrow("Invalid existing menu positions");
  });

  it("rejects gaps in sibling positions", () => {
    expect(() =>
      validateBackendMenuPositionsV2([
        item(1, null, 1),
        item(2, null, 3),
      ]),
    ).toThrow("Invalid existing menu positions");
  });

  it.each([
    0,
    -1,
    1.5,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.MAX_SAFE_INTEGER + 1,
  ])("rejects invalid position %s", position => {
    expect(() =>
      validateBackendMenuPositionsV2([
        item(1, null, position),
      ]),
    ).toThrow("Invalid existing menu positions");
  });

  it("rejects duplicate menu IDs", () => {
    expect(() =>
      validateBackendMenuPositionsV2([
        item(1, null, 1),
        item(1, null, 2),
      ]),
    ).toThrow("Invalid backend menu inventory");
  });

  it("treats missing parentId as a root", () => {
    expect(() =>
      validateBackendMenuPositionsV2([
        { menuId: 1, position: 1 },
        item(2, null, 2),
      ]),
    ).not.toThrow();
  });

  it("accepts unsorted valid input without mutating it", () => {
    const items = [
      item(2, null, 2),
      item(1, null, 1),
    ];

    const original = items.map(entry => ({ ...entry }));

    validateBackendMenuPositionsV2(items);

    expect(items).toEqual(original);
  });

  it("can validate only the affected sibling group", () => {
    const items = [
      item(1, null, 1),
      item(2, null, 2),
      item(3, 1, 1),
      item(4, 1, 2),
      item(5, 2, 1),
      item(6, 2, 1),
    ];

    expect(() =>
      validateBackendMenuSiblingPositionsV2(items, 1),
    ).not.toThrow();

    expect(() =>
      validateBackendMenuSiblingPositionsV2(items, 2),
    ).toThrow("Invalid existing menu positions");
  });

  it("accepts an empty target sibling group", () => {
    expect(() =>
      validateBackendMenuSiblingPositionsV2(
        [item(1, null, 1)],
        1,
      ),
    ).not.toThrow();
  });

  it("rejects null inventory entries", () => {
    expect(() =>
      validateBackendMenuPositionsV2([
        null as unknown as BackendMenuPositionEntryV2,
      ]),
    ).toThrow("Invalid backend menu inventory");
  });
});
