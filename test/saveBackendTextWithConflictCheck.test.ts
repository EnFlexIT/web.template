/**
 * @jest-environment jsdom
 */

import type {
  SiteContentText,
} from "../src/api/implementation/Dynamic-Content-Api-V2";

import type {
  TemplateRootState,
} from "../src/template/state/store/templateStoreTypes";

import {
  selectBackendContentWriteContext,
} from "../src/template/editor/adapters/updateBackendContentElementFromStore";

import {
  saveBackendTextContentFromStore,
} from "../src/template/editor/adapters/saveBackendTextContentFromStore";

import {
  saveBackendTextWithConflictCheck,
} from "../src/template/editor/adapters/saveBackendTextWithConflictCheck";

jest.mock(
  "../src/template/editor/adapters/updateBackendContentElementFromStore",
  () => ({
    selectBackendContentWriteContext: jest.fn(),
  }),
);

jest.mock(
  "../src/template/editor/adapters/saveBackendTextContentFromStore",
  () => ({
    saveBackendTextContentFromStore: jest.fn(),
  }),
);

const selectContext =
  selectBackendContentWriteContext as jest.Mock;

const saveContent =
  saveBackendTextContentFromStore as jest.Mock;

const original: SiteContentText = {
  abstractSiteContentType: "SiteContentText",
  uniqueContentId: 42,
  editable: true,
  updatePeriodInSeconds: 30,
  mimeType: "text/html",
  text: "<p>Original</p>",
};

function createFixture() {
  const client = {
    getContentElement: jest.fn().mockResolvedValue({
      data: { ...original },
    }),
    updateContentElement: jest.fn(),
  };

  const state = {
    api: {
      dynamic_content_api_v2: {
        defaultApi: client,
      },
    },
  } as unknown as TemplateRootState;

  const context = {
    client,
    server: "https://test.invalid",
    authGeneration: 1,
    isLoggedIn: true,
    canEdit: true,
    isLoggingOut: false,
    isSwitchingServer: false,
  };

  selectContext.mockImplementation(() => context);

  const getState = () => state;

  return { client, context, getState };
}

describe("Backend text conflict preflight", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    saveContent.mockResolvedValue(undefined);
  });

  it("saves when backend content is unchanged", async () => {
    const fixture = createFixture();

    await saveBackendTextWithConflictCheck({
      elementId: 42,
      original,
      html: "<p>Neu</p>",
      getState: fixture.getState,
    });

    expect(fixture.client.getContentElement)
      .toHaveBeenCalledWith(42);

    expect(saveContent).toHaveBeenCalledTimes(1);
    expect(saveContent).toHaveBeenCalledWith({
      elementId: 42,
      original: expect.objectContaining({
        uniqueContentId: 42,
        text: "<p>Original</p>",
      }),
      html: "<p>Neu</p>",
      getState: fixture.getState,
    });
  });

  it("blocks updates to content changed by another user", async () => {
    const fixture = createFixture();

    fixture.client.getContentElement.mockResolvedValueOnce({
      data: {
        ...original,
        text: "<p>Anderer Benutzer</p>",
      },
    });

    await expect(
      saveBackendTextWithConflictCheck({
        elementId: 42,
        original,
        html: "<p>Mein Text</p>",
        getState: fixture.getState,
      }),
    ).rejects.toThrow("content conflict");

    expect(saveContent).not.toHaveBeenCalled();
  });

  it("blocks saving when permissions are missing", async () => {
    const fixture = createFixture();
    fixture.context.canEdit = false;

    await expect(
      saveBackendTextWithConflictCheck({
        elementId: 42,
        original,
        html: "<p>Mein Text</p>",
        getState: fixture.getState,
      }),
    ).rejects.toThrow("not authorized");

    expect(fixture.client.getContentElement)
      .not.toHaveBeenCalled();

    expect(saveContent).not.toHaveBeenCalled();
  });

  it("rejects a session change during the read", async () => {
    const fixture = createFixture();

    fixture.client.getContentElement.mockImplementationOnce(
      async () => {
        fixture.context.authGeneration += 1;
        return { data: { ...original } };
      },
    );

    // Capture a separate snapshot for the first context read.
    const firstContext = {
      ...fixture.context,
      authGeneration: 1,
    };

    selectContext
      .mockReturnValueOnce(firstContext)
      .mockImplementation(() => fixture.context);

    await expect(
      saveBackendTextWithConflictCheck({
        elementId: 42,
        original,
        html: "<p>Mein Text</p>",
        getState: fixture.getState,
      }),
    ).rejects.toThrow("session changed");

    expect(saveContent).not.toHaveBeenCalled();
  });

  it("blocks unsupported content MIME types", async () => {
    const fixture = createFixture();

    await expect(
      saveBackendTextWithConflictCheck({
        elementId: 42,
        original: { ...original, mimeType: "text/plain" },
        html: "<p>Mein Text</p>",
        getState: fixture.getState,
      }),
    ).rejects.toThrow("Only HTML");

    expect(fixture.client.getContentElement)
      .not.toHaveBeenCalled();
    expect(saveContent).not.toHaveBeenCalled();
  });

  it("propagates backend read failures without writing", async () => {
    const fixture = createFixture();

    fixture.client.getContentElement.mockRejectedValueOnce(
      new Error("Read unavailable"),
    );

    await expect(
      saveBackendTextWithConflictCheck({
        elementId: 42,
        original,
        html: "<p>Mein Text</p>",
        getState: fixture.getState,
      }),
    ).rejects.toThrow("Read unavailable");

    expect(saveContent).not.toHaveBeenCalled();
  });
});