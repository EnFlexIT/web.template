import {
  createBackendMenuV2,
} from "../src/template/editor/adapters/createBackendMenuV2";

import {
  submitBackendMenuCreateV2,
  type BackendMenuCreateSubmitParams,
} from "../src/template/editor/adapters/submitBackendMenuCreateV2";

jest.mock(
  "../src/template/editor/adapters/createBackendMenuV2",
  () => ({
    createBackendMenuV2: jest.fn(),
  }),
);

const createMock =
  createBackendMenuV2 as jest.Mock;

type Context =
  BackendMenuCreateSubmitParams["expectedContext"];

function setup() {
  const context = {
    client: {
      getMenus: jest.fn(),
      createMenu: jest.fn(),
    },
    server: "test-server",
    authGeneration: 1,
    isLoggedIn: true,
    canEdit: true,
    isSwitchingServer: false,
    isLoggingOut: false,
  } as Context;

  const params = {
    caption: "Documentation",
    parentId: 10021,
    language: "de",
    allowedRoles: ["Vermieter"],
    expectedContext: { ...context },
    getContext: jest.fn(() => context),
    getAvailableRoles: jest.fn(() => ["Vermieter"]),
    getLanguage: jest.fn(() => "de"),
    isDialogCurrent: jest.fn(() => true),
    canAssignRoles: jest.fn(() => true),
    refreshMenus: jest.fn(async () => {}),
  };

  return { params, context };
}

beforeEach(() => {
  createMock.mockReset();
  createMock.mockResolvedValue(undefined);
});

describe("submitBackendMenuCreateV2", () => {
  it("supports explicitly public menus", async () => {
    const { params } = setup();

    await submitBackendMenuCreateV2({
      ...params,
      accessMode: "public",
      allowedRoles: [],
    });

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        allowedRoles: [],
      }),
    );

    expect(params.refreshMenus)
      .toHaveBeenCalledTimes(1);
  });

  it("supports root menu creation", async () => {
    const { params } = setup();

    await submitBackendMenuCreateV2({
      ...params,
      parentId: null,
    });

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        parentId: null,
        allowedRoles: ["Vermieter"],
      }),
    );

    expect(params.refreshMenus)
      .toHaveBeenCalledTimes(1);
  });

  it("rejects public mode with selected roles", async () => {
    const { params } = setup();

    await expect(
      submitBackendMenuCreateV2({
        ...params,
        accessMode: "public",
        allowedRoles: ["Vermieter"],
      }),
    ).rejects.toThrow("create.invalidRoles");

    expect(createMock).not.toHaveBeenCalled();
  });

  it("requires assignment permission for public menus", async () => {
    const { params } = setup();

    params.canAssignRoles.mockReturnValue(false);

    await expect(
      submitBackendMenuCreateV2({
        ...params,
        accessMode: "public",
        allowedRoles: [],
      }),
    ).rejects.toThrow("create.permissionDenied");

    expect(createMock).not.toHaveBeenCalled();
  });

  it("rejects malformed role collections", async () => {
    const { params } = setup();

    await expect(
      submitBackendMenuCreateV2({
        ...params,
        accessMode: "public",
        allowedRoles: undefined as unknown as string[],
      }),
    ).rejects.toThrow("create.invalidRoles");

    expect(createMock).not.toHaveBeenCalled();
  });

  it("creates and refreshes exactly once", async () => {
    const { params } = setup();

    await submitBackendMenuCreateV2(params);

    expect(createMock).toHaveBeenCalledTimes(1);

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        caption: "Documentation",
        parentId: 10021,
        language: "de",
        allowedRoles: ["Vermieter"],
      }),
    );

    expect(params.refreshMenus)
      .toHaveBeenCalledTimes(1);
  });

  it("blocks a changed server", async () => {
    const { params, context } = setup();

    context.server = "other-server";

    await expect(
      submitBackendMenuCreateV2(params),
    ).rejects.toThrow("create.sessionChanged");

    expect(createMock).not.toHaveBeenCalled();
  });

  it("blocks a changed authentication generation", async () => {
    const { params, context } = setup();

    context.authGeneration = 2;

    await expect(
      submitBackendMenuCreateV2(params),
    ).rejects.toThrow("create.sessionChanged");

    expect(createMock).not.toHaveBeenCalled();
  });

  it("blocks revoked editor permissions", async () => {
    const { params, context } = setup();

    context.canEdit = false;

    await expect(
      submitBackendMenuCreateV2(params),
    ).rejects.toThrow("create.permissionDenied");

    expect(createMock).not.toHaveBeenCalled();
  });

  it("blocks unconfirmed role assignment permission", async () => {
    const { params } = setup();

    params.canAssignRoles.mockReturnValue(false);

    await expect(
      submitBackendMenuCreateV2(params),
    ).rejects.toThrow("create.permissionDenied");

    expect(createMock).not.toHaveBeenCalled();
  });

  it("blocks roles which are no longer available", async () => {
    const { params } = setup();

    params.getAvailableRoles.mockReturnValue([]);

    await expect(
      submitBackendMenuCreateV2(params),
    ).rejects.toThrow("create.invalidRoles");

    expect(createMock).not.toHaveBeenCalled();
  });

  it("blocks an empty role selection", async () => {
    const { params } = setup();

    params.allowedRoles = [];

    await expect(
      submitBackendMenuCreateV2(params),
    ).rejects.toThrow("create.invalidRoles");

    expect(createMock).not.toHaveBeenCalled();
  });

  it("blocks a stale dialog", async () => {
    const { params } = setup();

    params.isDialogCurrent.mockReturnValue(false);

    await expect(
      submitBackendMenuCreateV2(params),
    ).rejects.toThrow("create.sessionChanged");

    expect(createMock).not.toHaveBeenCalled();
  });

  it("blocks a changed request language", async () => {
    const { params } = setup();

    params.getLanguage.mockReturnValue("en");

    await expect(
      submitBackendMenuCreateV2(params),
    ).rejects.toThrow("create.sessionChanged");

    expect(createMock).not.toHaveBeenCalled();
  });

  it("checks the session again inside the adapter", async () => {
    const { params, context } = setup();

    createMock.mockImplementation(async input => {
      context.authGeneration = 2;
      input.getContext();
    });

    await expect(
      submitBackendMenuCreateV2(params),
    ).rejects.toThrow("create.sessionChanged");

    expect(params.refreshMenus)
      .not.toHaveBeenCalled();
  });

  it("never repeats a failed creation", async () => {
    const { params } = setup();

    createMock.mockRejectedValue(
      new Error("create.verificationFailed"),
    );

    await expect(
      submitBackendMenuCreateV2(params),
    ).rejects.toThrow("create.verificationFailed");

    expect(createMock).toHaveBeenCalledTimes(1);

    expect(params.refreshMenus)
      .toHaveBeenCalledTimes(1);
  });

  it("reports a refresh error without recreating the menu", async () => {
    const { params } = setup();

    params.refreshMenus.mockRejectedValue(
      new Error("Refresh failed"),
    );

    await expect(
      submitBackendMenuCreateV2(params),
    ).rejects.toThrow("create.refreshFailed");

    expect(createMock).toHaveBeenCalledTimes(1);

    expect(params.refreshMenus)
      .toHaveBeenCalledTimes(1);
  });

  it("does not refresh a different session after creation", async () => {
    const { params, context } = setup();

    createMock.mockImplementation(async () => {
      context.authGeneration = 2;
    });

    await expect(
      submitBackendMenuCreateV2(params),
    ).rejects.toThrow("create.sessionChanged");

    expect(params.refreshMenus)
      .not.toHaveBeenCalled();
  });

  it("blocks an invalid parent ID", async () => {
    const { params } = setup();

    params.parentId = -1;

    await expect(
      submitBackendMenuCreateV2(params),
    ).rejects.toThrow("create.invalidParent");

    expect(createMock).not.toHaveBeenCalled();
  });
});
