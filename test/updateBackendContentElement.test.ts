import {
  updateBackendContentElement,
  type BackendContentWriteContext,
} from "../src/template/editor/adapters/updateBackendContentElement";
import type {
  UpdateContentElementRequest,
} from "../src/api/implementation/Dynamic-Content-Api-V2";

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

  const context: BackendContentWriteContext = {
    client: { updateContentElement },
    server: "https://test.example",
    authGeneration: 1,
    isLoggedIn: true,
    canEdit: true,
    isSwitchingServer: false,
    isLoggingOut: false,
  };

  return { updateContentElement, context };
}

describe("updateBackendContentElement", () => {
  it("sends an authorized update to the V2 client", async () => {
    const { updateContentElement, context } = setup();

    await updateBackendContentElement({
      elementId: 42,
      request,
      getContext: () => context,
    });

    expect(updateContentElement).toHaveBeenCalledTimes(1);
    expect(updateContentElement).toHaveBeenCalledWith(42, request);
  });

  it("blocks users without editing permission", async () => {
    const { updateContentElement, context } = setup();
    context.canEdit = false;

    await expect(
      updateBackendContentElement({
        elementId: 42,
        request,
        getContext: () => context,
      }),
    ).rejects.toThrow("not authorized");

    expect(updateContentElement).not.toHaveBeenCalled();
  });

  it("blocks writes during server switching", async () => {
    const { updateContentElement, context } = setup();
    context.isSwitchingServer = true;

    await expect(
      updateBackendContentElement({
        elementId: 42,
        request,
        getContext: () => context,
      }),
    ).rejects.toThrow("not authorized");

    expect(updateContentElement).not.toHaveBeenCalled();
  });

  it("rejects a response after logout", async () => {
    const { context } = setup();
    let resolveRequest!: () => void;

    const pending = new Promise<void>((resolve) => {
      resolveRequest = resolve;
    });

    context.client.updateContentElement = jest.fn(() => pending);

    const saving = updateBackendContentElement({
      elementId: 42,
      request,
      getContext: () => context,
    });

    context.isLoggedIn = false;
    context.authGeneration += 1;
    resolveRequest();

    await expect(saving).rejects.toThrow("stale session");
  });

  it("rejects invalid element IDs before sending", async () => {
    const { updateContentElement, context } = setup();

    await expect(
      updateBackendContentElement({
        elementId: -1,
        request,
        getContext: () => context,
      }),
    ).rejects.toThrow("Invalid content element ID");

    expect(updateContentElement).not.toHaveBeenCalled();
  });
});