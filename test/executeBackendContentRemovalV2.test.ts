import {
  executeBackendContentRemovalV2,
  type RemovalContentEntry,
} from "../src/template/editor/adapters/executeBackendContentRemovalV2";

function setup() {
  const original: RemovalContentEntry[] = [
    {
      backendContentId: 1,
      position: 1,
      kind: "text",
      editable: true,
    },
    {
      backendContentId: 2,
      position: 2,
      kind: "text",
      editable: true,
    },
    {
      backendContentId: 3,
      position: 3,
      kind: "unsupported",
    },
  ];

  const load = jest.fn()
    .mockResolvedValueOnce(original)
    .mockResolvedValueOnce([
      original[0],
      { ...original[2], position: 2 },
    ]);

  const remove = jest.fn().mockResolvedValue(undefined);
  const isCurrent = jest.fn(() => true);

  const params = {
    elementId: 2,
    original,
    load,
    remove,
    isCurrent,
  };

  return {
    original,
    load,
    remove,
    isCurrent,
    params,
  };
}

describe("executeBackendContentRemovalV2", () => {
  it("removes and verifies exactly one assignment", async () => {
    const { params, remove, load } = setup();

    const result =
      await executeBackendContentRemovalV2(params);

    expect(result.map(entry => entry.backendContentId))
      .toEqual([1, 3]);

    expect(remove).toHaveBeenCalledTimes(1);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("blocks invalid IDs", async () => {
    const { params, remove } = setup();

    await expect(
      executeBackendContentRemovalV2({
        ...params,
        elementId: 0,
      }),
    ).rejects.toMatchObject({
      attemptedWrite: false,
    });

    expect(remove).not.toHaveBeenCalled();
  });

  it("blocks a changed backend inventory", async () => {
    const { params, load, remove, original } = setup();

    load.mockReset().mockResolvedValue([
      original[0],
      original[2],
    ]);

    await expect(
      executeBackendContentRemovalV2(params),
    ).rejects.toMatchObject({
      attemptedWrite: false,
    });

    expect(remove).not.toHaveBeenCalled();
  });

  it("blocks content that became non-editable", async () => {
    const { params, load, remove, original } = setup();

    load.mockReset().mockResolvedValue(
      original.map(entry =>
        entry.backendContentId === 2
          ? { ...entry, editable: false }
          : entry,
      ),
    );

    await expect(
      executeBackendContentRemovalV2(params),
    ).rejects.toMatchObject({
      attemptedWrite: false,
    });

    expect(remove).not.toHaveBeenCalled();
  });

  it("blocks unsupported content types", async () => {
    const { params, remove } = setup();

    await expect(
      executeBackendContentRemovalV2({
        ...params,
        elementId: 3,
      }),
    ).rejects.toMatchObject({
      attemptedWrite: false,
    });

    expect(remove).not.toHaveBeenCalled();
  });

  it("rejects duplicate content IDs", async () => {
    const { params, remove, original } = setup();

    await expect(
      executeBackendContentRemovalV2({
        ...params,
        original: [
          ...original,
          { ...original[0], position: 4 },
        ],
      }),
    ).rejects.toMatchObject({
      attemptedWrite: false,
    });

    expect(remove).not.toHaveBeenCalled();
  });

  it("rejects duplicate content positions", async () => {
    const { params, load, remove, original } = setup();

    load.mockReset().mockResolvedValue(
      original.map(entry => ({
        ...entry,
        position: 1,
      })),
    );

    await expect(
      executeBackendContentRemovalV2(params),
    ).rejects.toMatchObject({
      attemptedWrite: false,
    });

    expect(remove).not.toHaveBeenCalled();
  });

  it("blocks an inactive session", async () => {
    const { params, remove, load, isCurrent } = setup();

    isCurrent.mockReturnValue(false);

    await expect(
      executeBackendContentRemovalV2(params),
    ).rejects.toMatchObject({
      attemptedWrite: false,
    });

    expect(load).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });

  it("blocks a session change during preflight", async () => {
    const { params, remove, load, original, isCurrent } =
      setup();

    load.mockReset().mockImplementation(async () => {
      isCurrent.mockReturnValue(false);
      return original;
    });

    await expect(
      executeBackendContentRemovalV2(params),
    ).rejects.toMatchObject({
      attemptedWrite: false,
    });

    expect(remove).not.toHaveBeenCalled();
  });

  it("detects a session change after removal", async () => {
    const { params, remove, isCurrent, load } = setup();

    remove.mockImplementationOnce(async () => {
      isCurrent.mockReturnValue(false);
    });

    await expect(
      executeBackendContentRemovalV2(params),
    ).rejects.toMatchObject({
      attemptedWrite: true,
    });

    expect(remove).toHaveBeenCalledTimes(1);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("rejects an unchanged inventory after removal", async () => {
    const { params, load, remove, original } = setup();

    load.mockReset().mockResolvedValue(original);

    await expect(
      executeBackendContentRemovalV2(params),
    ).rejects.toMatchObject({
      attemptedWrite: true,
    });

    expect(remove).toHaveBeenCalledTimes(1);
  });

  it("rejects unexpected remaining content", async () => {
    const { params, load, original } = setup();

    load.mockReset()
      .mockResolvedValueOnce(original)
      .mockResolvedValueOnce([original[0]]);

    await expect(
      executeBackendContentRemovalV2(params),
    ).rejects.toMatchObject({
      attemptedWrite: true,
    });
  });

  it("never retries failed backend removal", async () => {
    const { params, remove } = setup();

    remove.mockRejectedValueOnce(
      new Error("Backend unavailable"),
    );

    await expect(
      executeBackendContentRemovalV2(params),
    ).rejects.toMatchObject({
      attemptedWrite: true,
    });

    expect(remove).toHaveBeenCalledTimes(1);
  });

  it("reports a failed verification reload", async () => {
    const { params, load, remove, original } = setup();

    load.mockReset()
      .mockResolvedValueOnce(original)
      .mockRejectedValueOnce(
        new Error("Reload failed"),
      );

    await expect(
      executeBackendContentRemovalV2(params),
    ).rejects.toMatchObject({
      attemptedWrite: true,
    });

    expect(remove).toHaveBeenCalledTimes(1);
  });

  it("does not mutate the original inventory", async () => {
    const { params, original } = setup();
    const before = JSON.stringify(original);

    await executeBackendContentRemovalV2(params);

    expect(JSON.stringify(original)).toBe(before);
  });
});
