import {
  executeBackendContentOrderSaveV2,
  BackendOrderSaveError,
} from "../src/template/editor/adapters/executeBackendContentOrderSaveV2";

const original = [
  { backendContentId: 1, position: 1 },
  { backendContentId: 2, position: 2 },
  { backendContentId: 3, position: 3 },
];

describe("executeBackendContentOrderSaveV2", () => {
  it("saves and verifies a new order", async () => {
    const move = jest.fn().mockResolvedValue(undefined);

    const load = jest.fn()
      .mockResolvedValueOnce(original)
      .mockResolvedValueOnce([
        { backendContentId: 3, position: 1 },
        { backendContentId: 1, position: 2 },
        { backendContentId: 2, position: 3 },
      ]);

    await executeBackendContentOrderSaveV2({
      menuId: 10003,
      original,
      desiredIds: [3, 1, 2],
      load,
      move,
      isCurrent: () => true,
    });

    expect(move).toHaveBeenCalledTimes(1);
    expect(move).toHaveBeenCalledWith({
      elementId: 3,
      sourceMenuId: 10003,
      targetMenuId: 10003,
      position: 1,
    });
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("does not write when the backend order changed", async () => {
    const move = jest.fn();

    const load = jest.fn().mockResolvedValue([
      { backendContentId: 2, position: 1 },
      { backendContentId: 1, position: 2 },
      { backendContentId: 3, position: 3 },
    ]);

    await expect(
      executeBackendContentOrderSaveV2({
        menuId: 10003,
        original,
        desiredIds: [3, 1, 2],
        load,
        move,
        isCurrent: () => true,
      }),
    ).rejects.toThrow("Backend content order changed");

    expect(move).not.toHaveBeenCalled();
  });

  it("stops after the first failed operation", async () => {
    const move = jest.fn().mockRejectedValue(
      new Error("Backend unavailable"),
    );

    const load = jest.fn().mockResolvedValue(original);

    await expect(
      executeBackendContentOrderSaveV2({
        menuId: 10003,
        original,
        desiredIds: [3, 2, 1],
        load,
        move,
        isCurrent: () => true,
      }),
    ).rejects.toMatchObject({
      attemptedWrites: 1,
    });

    expect(move).toHaveBeenCalledTimes(1);
  });

  it("reports attempted writes after partial failure", async () => {
    const move = jest.fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("Second move failed"));

    const load = jest.fn()
      .mockResolvedValueOnce(original)
      .mockResolvedValueOnce([
        { backendContentId: 3, position: 1 },
        { backendContentId: 1, position: 2 },
        { backendContentId: 2, position: 3 },
      ]);

    await expect(
      executeBackendContentOrderSaveV2({
        menuId: 10003,
        original,
        desiredIds: [3, 2, 1],
        load,
        move,
        isCurrent: () => true,
      }),
    ).rejects.toMatchObject({
      attemptedWrites: 2,
    });

    expect(move).toHaveBeenCalledTimes(2);
  });

  it("rejects an inactive session before writing", async () => {
    const move = jest.fn();
    const load = jest.fn();

    await expect(
      executeBackendContentOrderSaveV2({
        menuId: 10003,
        original,
        desiredIds: [3, 1, 2],
        load,
        move,
        isCurrent: () => false,
      }),
    ).rejects.toMatchObject({
      attemptedWrites: 0,
    });

    expect(load).not.toHaveBeenCalled();
    expect(move).not.toHaveBeenCalled();
  });

  it("rejects an unverified final order", async () => {
    const move = jest.fn().mockResolvedValue(undefined);
    const load = jest.fn().mockResolvedValue(original);

    await expect(
      executeBackendContentOrderSaveV2({
        menuId: 10003,
        original,
        desiredIds: [3, 1, 2],
        load,
        move,
        isCurrent: () => true,
      }),
    ).rejects.toMatchObject({
      attemptedWrites: 1,
    });
  });

  it("exposes a distinct error type", () => {
    const error = new BackendOrderSaveError(
      "Test",
      1,
    );

    expect(error.name).toBe("BackendOrderSaveError");
    expect(error.attemptedWrites).toBe(1);
  });

  it("simulates multiple backend position updates", async () => {
    const initialIds = [1, 2, 3, 4];
    const desiredIds = [4, 2, 1, 3];

    let backendIds = [...initialIds];

    const load = jest.fn(async () =>
      backendIds.map((backendContentId, index) => ({
        backendContentId,
        position: index + 1,
      })),
    );

    const move = jest.fn(async (request: {
      elementId: number;
      position: number;
    }) => {
      const sourceIndex = backendIds.indexOf(request.elementId);
      const targetIndex = request.position - 1;

      if (
        sourceIndex < 0 ||
        targetIndex < 0 ||
        targetIndex >= backendIds.length
      ) {
        throw new Error("Invalid simulated backend move");
      }

      backendIds.splice(sourceIndex, 1);
      backendIds.splice(targetIndex, 0, request.elementId);
    });

    const result = await executeBackendContentOrderSaveV2({
      menuId: 10003,
      original: initialIds.map((backendContentId, index) => ({
        backendContentId,
        position: index + 1,
      })),
      desiredIds,
      load,
      move,
      isCurrent: () => true,
    });

    expect(backendIds).toEqual(desiredIds);

    expect(
      result
        .slice()
        .sort((a, b) => a.position - b.position)
        .map(entry => entry.backendContentId),
    ).toEqual(desiredIds);

    // Zwei Verschiebungen reichen aus, um die Zielreihenfolge zu erreichen.
    expect(move).toHaveBeenCalledTimes(2);

    // Vor dem Speichern und nach jeder Verschiebung laden.
    expect(load).toHaveBeenCalledTimes(3);
  });
});
