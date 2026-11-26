import {
  assignBackendContentToMenuV2,
  type BackendContentAssignmentContext,
} from "../src/template/editor/adapters/assignBackendContentToMenuV2";

function setup() {
  const assignContentToMenu =
    jest.fn().mockResolvedValue(undefined);

  const context: BackendContentAssignmentContext = {
    client: { assignContentToMenu },
    server: "https://test.invalid",
    authGeneration: 1,
    isLoggedIn: true,
    canEdit: true,
    isSwitchingServer: false,
    isLoggingOut: false,
  };

  const assign = (
    menuId = 20,
    elementId = 42,
    position = 1,
  ) => assignBackendContentToMenuV2({
    menuId,
    elementId,
    position,
    getContext: () => context,
  });

  return {
    context,
    assignContentToMenu,
    assign,
  };
}

describe("assignBackendContentToMenuV2", () => {
  it("uses the exact generated V2 API contract", async () => {
    const { assign, assignContentToMenu } = setup();

    await assign(20, 42, 3);

    expect(assignContentToMenu)
      .toHaveBeenCalledTimes(1);

    expect(assignContentToMenu)
      .toHaveBeenCalledWith(20, 42, { position: 3 });
  });

  it.each([
    [0, 42, 1],
    [20, -1, 1],
    [20, 42, 0],
    [20, 42, 1.5],
  ])("rejects invalid assignment requests",
    async (menuId, elementId, position) => {
      const { assign, assignContentToMenu } = setup();

      await expect(
        assign(menuId, elementId, position),
      ).rejects.toThrow();

      expect(assignContentToMenu)
        .not.toHaveBeenCalled();
    },
  );

  it.each([
    { canEdit: false },
    { isLoggedIn: false },
    { isSwitchingServer: true },
    { isLoggingOut: true },
    { server: "" },
    { authGeneration: -1 },
  ])("blocks unauthorized sessions", async override => {
    const { context, assign, assignContentToMenu } =
      setup();

    Object.assign(context, override);

    await expect(assign())
      .rejects.toThrow(/not authorized/);

    expect(assignContentToMenu)
      .not.toHaveBeenCalled();
  });

  it("detects an in-place session change", async () => {
    const { context, assign, assignContentToMenu } =
      setup();

    assignContentToMenu.mockImplementationOnce(async () => {
      context.server = "https://other.invalid";
    });

    await expect(assign())
      .rejects.toThrow(/stale session/);

    expect(assignContentToMenu)
      .toHaveBeenCalledTimes(1);
  });

  it("does not retry a failed assignment", async () => {
    const { assign, assignContentToMenu } = setup();

    assignContentToMenu.mockRejectedValueOnce(
      new Error("Backend unavailable"),
    );

    await expect(assign())
      .rejects.toThrow("Backend unavailable");

    expect(assignContentToMenu)
      .toHaveBeenCalledTimes(1);
  });
});
