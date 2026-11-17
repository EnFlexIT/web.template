import type { TemplateRootState } from "../src/template/state/store/templateStoreTypes";
import type { UpdateContentElementRequest } from "../src/api/implementation/Dynamic-Content-Api-V2";
import {
  selectVerifiedBackendRoles,
} from "../src/template/state/authorization/selectVerifiedBackendRoles";
import {
  selectBackendContentWriteContext,
  updateBackendContentElementFromStore,
} from "../src/template/editor/adapters/updateBackendContentElementFromStore";

jest.mock("../src/template/state/authorization/selectVerifiedBackendRoles", () => ({
  selectVerifiedBackendRoles: jest.fn(),
}));

const mockedRoles = selectVerifiedBackendRoles as jest.MockedFunction<
  typeof selectVerifiedBackendRoles
>;

const request: UpdateContentElementRequest = {
  content: {
    abstractSiteContentType: "SiteContentText",
    uniqueContentId: 42,
    editable: true,
    updatePeriodInSeconds: 0,
  },
};

function setup() {
  const updateContentElement = jest.fn().mockResolvedValue(undefined);
  const client = { updateContentElement };

  const state = {
    api: {
      dynamic_content_api_v2: { defaultApi: client },
      ip: "https://server-a.example",
      authGeneration: 1,
      isLoggedIn: true,
      isSwitchingServer: false,
      isLoggingOut: false,
    },
  } as unknown as TemplateRootState;

  return {
    state,
    client,
    updateContentElement,
    getState: () => state,
  };
}

describe("updateBackendContentElementFromStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRoles.mockReturnValue(["EDITOR"]);
  });

  it("uses the current server, client and session generation", () => {
    const { state, client } = setup();
    const context = selectBackendContentWriteContext(state);

    expect(context.client).toBe(client);
    expect(context.server).toBe("https://server-a.example");
    expect(context.authGeneration).toBe(1);
    expect(context.canEdit).toBe(true);
  });

  it("writes with a verified EDITOR role", async () => {
    const { getState, updateContentElement } = setup();

    await updateBackendContentElementFromStore({
      elementId: 42,
      request,
      getState,
    });

    expect(updateContentElement).toHaveBeenCalledTimes(1);
    expect(updateContentElement).toHaveBeenCalledWith(42, request);
  });

  it.each([
    { roles: [] },
    { roles: ["USER"] },
    { roles: ["ADMIN"] },
  ])(
    "rejects writing without a verified EDITOR role: $roles",
    async ({ roles }) => {
      mockedRoles.mockReturnValue(roles);
      const { getState, updateContentElement } = setup();

      await expect(
        updateBackendContentElementFromStore({
          elementId: 42,
          request,
          getState,
        }),
      ).rejects.toThrow("not authorized");

      expect(updateContentElement).not.toHaveBeenCalled();
    },
  );

  it("blocks writes during logout", async () => {
    const { state, getState, updateContentElement } = setup();
    state.api.isLoggingOut = true;

    await expect(
      updateBackendContentElementFromStore({
        elementId: 42,
        request,
        getState,
      }),
    ).rejects.toThrow("not authorized");

    expect(updateContentElement).not.toHaveBeenCalled();
  });

  it("rejects a response after the server session changes", async () => {
    const { state, getState, updateContentElement } = setup();

    let resolveRequest!: () => void;
    const pending = new Promise<void>((resolve) => {
      resolveRequest = resolve;
    });

    updateContentElement.mockReturnValueOnce(pending);

    const saving = updateBackendContentElementFromStore({
      elementId: 42,
      request,
      getState,
    });

    state.api.authGeneration += 1;
    state.api.ip = "https://server-b.example";
    resolveRequest();

    await expect(saving).rejects.toThrow("stale session");
  });

  it("rejects a response after EDITOR permission is revoked", async () => {
    const { getState, updateContentElement } = setup();

    let resolveRequest!: () => void;
    const pending = new Promise<void>((resolve) => {
      resolveRequest = resolve;
    });

    updateContentElement.mockReturnValueOnce(pending);

    const saving = updateBackendContentElementFromStore({
      elementId: 42,
      request,
      getState,
    });

    mockedRoles.mockReturnValue(["USER"]);
    resolveRequest();

    await expect(saving).rejects.toThrow("stale session");
  });
});