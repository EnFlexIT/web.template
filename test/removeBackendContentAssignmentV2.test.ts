import {
  removeBackendContentAssignmentV2,
  type BackendContentRemovalContext,
} from "../src/template/editor/adapters/removeBackendContentAssignmentV2";

function setup() {
  const removeAssignment =
    jest.fn().mockResolvedValue(undefined);

  const context: BackendContentRemovalContext = {
    client: { removeAssignment },
    server: "https://test.invalid",
    authGeneration: 1,
    isLoggedIn: true,
    canEdit: true,
    isSwitchingServer: false,
    isLoggingOut: false,
  };

  const remove = (
    menuId = 10,
    elementId = 42,
  ) => removeBackendContentAssignmentV2({
    menuId,
    elementId,
    getContext: () => context,
  });

  return {
    context,
    removeAssignment,
    remove,
  };
}

describe("removeBackendContentAssignmentV2", () => {
  it("removes the exact menu assignment once", async () => {
    const { remove, removeAssignment } = setup();

    await remove();

    expect(removeAssignment).toHaveBeenCalledTimes(1);
    expect(removeAssignment).toHaveBeenCalledWith(10, 42);
  });

  it.each([
    [0, 42],
    [10, -1],
    [1.5, 42],
  ])("rejects invalid IDs", async (menuId, elementId) => {
    const { remove, removeAssignment } = setup();

    await expect(
      remove(menuId, elementId),
    ).rejects.toThrow(/Invalid/);

    expect(removeAssignment).not.toHaveBeenCalled();
  });

  it.each([
    { canEdit: false },
    { isLoggedIn: false },
    { isSwitchingServer: true },
    { isLoggingOut: true },
    { server: "" },
    { authGeneration: -1 },
  ])("blocks unauthorized sessions", async override => {
    const { context, remove, removeAssignment } =
      setup();

    Object.assign(context, override);

    await expect(remove())
      .rejects.toThrow(/not authorized/);

    expect(removeAssignment).not.toHaveBeenCalled();
  });

  it("detects an in-place session change", async () => {
    const { context, remove, removeAssignment } =
      setup();

    removeAssignment.mockImplementationOnce(async () => {
      context.authGeneration += 1;
    });

    await expect(remove())
      .rejects.toThrow(/stale session/);

    expect(removeAssignment).toHaveBeenCalledTimes(1);
  });

  it("propagates failures without retrying", async () => {
    const { remove, removeAssignment } = setup();

    removeAssignment.mockRejectedValueOnce(
      new Error("Backend unavailable"),
    );

    await expect(remove())
      .rejects.toThrow("Backend unavailable");

    expect(removeAssignment).toHaveBeenCalledTimes(1);
  });
});
