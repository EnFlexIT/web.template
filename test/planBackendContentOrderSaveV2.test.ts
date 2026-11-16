import {
  planBackendContentOrderSaveV2,
} from "../src/template/editor/adapters/planBackendContentOrderSaveV2";

describe("planBackendContentOrderSaveV2", () => {
  it("returns no requests when the order is unchanged", () => {
    expect(
      planBackendContentOrderSaveV2(
        10003,
        [1, 2, 3],
        [1, 2, 3],
      ),
    ).toEqual([]);
  });

  it("plans one operation when one element moves to the front", () => {
    expect(
      planBackendContentOrderSaveV2(
        10003,
        [1, 2, 3, 4],
        [3, 1, 2, 4],
      ),
    ).toEqual([
      {
        elementId: 3,
        sourceMenuId: 10003,
        targetMenuId: 10003,
        position: 1,
      },
    ]);
  });

  it("plans multiple operations when necessary", () => {
    expect(
      planBackendContentOrderSaveV2(
        10003,
        [1, 2, 3, 4],
        [4, 3, 2, 1],
      ),
    ).toEqual([
      {
        elementId: 4,
        sourceMenuId: 10003,
        targetMenuId: 10003,
        position: 1,
      },
      {
        elementId: 3,
        sourceMenuId: 10003,
        targetMenuId: 10003,
        position: 2,
      },
      {
        elementId: 2,
        sourceMenuId: 10003,
        targetMenuId: 10003,
        position: 3,
      },
    ]);
  });

  it("rejects changed inventories", () => {
    expect(() =>
      planBackendContentOrderSaveV2(
        10003,
        [1, 2, 3],
        [1, 2, 4],
      ),
    ).toThrow("Backend content inventory changed");
  });

  it("rejects duplicate IDs", () => {
    expect(() =>
      planBackendContentOrderSaveV2(
        10003,
        [1, 2, 3],
        [1, 1, 3],
      ),
    ).toThrow();
  });

  it("rejects invalid menu IDs", () => {
    expect(() =>
      planBackendContentOrderSaveV2(
        0,
        [1, 2],
        [2, 1],
      ),
    ).toThrow();
  });

  it("does not mutate input arrays", () => {
    const current = [1, 2, 3];
    const desired = [3, 1, 2];

    planBackendContentOrderSaveV2(10003, current, desired);

    expect(current).toEqual([1, 2, 3]);
    expect(desired).toEqual([3, 1, 2]);
  });
});