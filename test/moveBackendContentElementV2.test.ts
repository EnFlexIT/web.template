import {
  moveBackendContentElementV2,
  type BackendContentMoveContext,
} from "../src/template/editor/adapters/moveBackendContentElementV2";

const request = {
  elementId: 42,
  sourceMenuId: 10,
  targetMenuId: 20,
  position: 1,
};

function createContext(
  update = jest.fn().mockResolvedValue(undefined),
): BackendContentMoveContext {
  return {
    client: {
      updateAssignmentAndPosition: update,
    },
    server: "https://test.invalid",
    authGeneration: 1,
    isLoggedIn: true,
    canEdit: true,
    isSwitchingServer: false,
    isLoggingOut: false,
  };
}

describe("moveBackendContentElementV2", () => {
  it("moves content with the exact V2 payload", async () => {
    const update = jest.fn().mockResolvedValue(undefined);
    const context = createContext(update);

    await moveBackendContentElementV2({
      request,
      getContext: () => context,
    });

    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith(request);
  });

  it("supports reordering inside the same menu", async () => {
    const update = jest.fn().mockResolvedValue(undefined);
    const context = createContext(update);

    await moveBackendContentElementV2({
      request: {
        elementId: 42,
        sourceMenuId: 10,
        targetMenuId: 10,
        position: 2,
      },
      getContext: () => context,
    });

    expect(update).toHaveBeenCalledWith({
      elementId: 42,
      sourceMenuId: 10,
      targetMenuId: 10,
      position: 2,
    });
  });

  it.each([
    { ...request, elementId: 0 },
    { ...request, sourceMenuId: -1 },
    { ...request, targetMenuId: 0 },
    { ...request, position: 0 },
    { ...request, position: 1.5 },
    { ...request, position: Number.MAX_SAFE_INTEGER + 1 },
  ])("rejects invalid identifiers or positions", async invalid => {
    const update = jest.fn();
    const context = createContext(update);

    await expect(
      moveBackendContentElementV2({
        request: invalid,
        getContext: () => context,
      }),
    ).rejects.toThrow();

    expect(update).not.toHaveBeenCalled();
  });

  it.each([
    { canEdit: false },
    { isLoggedIn: false },
    { isSwitchingServer: true },
    { isLoggingOut: true },
    { server: "" },
  ])("blocks unauthorized or inactive sessions", async overrides => {
    const update = jest.fn();
    const context = {
      ...createContext(update),
      ...overrides,
    };

    await expect(
      moveBackendContentElementV2({
        request,
        getContext: () => context,
      }),
    ).rejects.toThrow(/not authorized/);

    expect(update).not.toHaveBeenCalled();
  });

  it("rejects a session that changes during the request", async () => {
    let complete!: () => void;

    const update = jest.fn().mockImplementation(
      () => new Promise<void>(resolve => {
        complete = resolve;
      }),
    );

    let context = createContext(update);

    const operation = moveBackendContentElementV2({
      request,
      getContext: () => context,
    });

    expect(update).toHaveBeenCalledTimes(1);

    context = {
      ...context,
      authGeneration: 2,
    };

    complete();

    await expect(operation).rejects.toThrow(/stale session/);
  });

  it("propagates backend errors", async () => {
    const update = jest.fn().mockRejectedValue(
      new Error("Backend rejected move"),
    );

    const context = createContext(update);

    await expect(
      moveBackendContentElementV2({
        request,
        getContext: () => context,
      }),
    ).rejects.toThrow("Backend rejected move");
  });
});