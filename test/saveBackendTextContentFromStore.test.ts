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
  updateBackendContentElementFromStore,
} from "../src/template/editor/adapters/updateBackendContentElementFromStore";

import {
  saveBackendTextContentFromStore,
} from "../src/template/editor/adapters/saveBackendTextContentFromStore";

jest.mock(
  "../src/template/editor/adapters/updateBackendContentElementFromStore",
  () => ({
    updateBackendContentElementFromStore: jest.fn(),
  }),
);

const mockedWriter =
  updateBackendContentElementFromStore as jest.MockedFunction<
    typeof updateBackendContentElementFromStore
  >;

const original: SiteContentText = {
  abstractSiteContentType: "SiteContentText",
  uniqueContentId: 42,
  editable: true,
  updatePeriodInSeconds: 30,
  mimeType: "text/html",
  text: "<p>Original</p>",
};

const state = {} as TemplateRootState;
const getState = () => state;

describe("saveBackendTextContentFromStore", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockedWriter.mockResolvedValue(undefined);
  });

  it("passes the full sanitized V2 request to the Redux writer", async () => {
    await saveBackendTextContentFromStore({
      elementId: 42,
      original,
      html: "<p>Aktualisiert</p>",
      getState,
    });

    expect(mockedWriter).toHaveBeenCalledTimes(1);
    expect(mockedWriter).toHaveBeenCalledWith({
      elementId: 42,
      request: {
        content: {
          ...original,
          text: "<p>Aktualisiert</p>",
        },
      },
      getState,
    });

    expect(original.text).toBe("<p>Original</p>");
  });

  it("sanitizes HTML before passing it to the writer", async () => {
    await saveBackendTextContentFromStore({
      elementId: 42,
      original,
      html: '<p>Sicher</p><script>alert("x")</script>',
      getState,
    });

    const args = mockedWriter.mock.calls[0][0];
    const content = args.request.content as SiteContentText;

    expect(content.text).toContain("<p>Sicher</p>");
    expect(content.text).not.toContain("<script");
  });

  it("blocks mismatching IDs before calling the writer", async () => {
    await expect(
      saveBackendTextContentFromStore({
        elementId: 99,
        original,
        html: "<p>Text</p>",
        getState,
      }),
    ).rejects.toThrow("Backend content ID mismatch");

    expect(mockedWriter).not.toHaveBeenCalled();
  });

  it("blocks non-editable content before calling the writer", async () => {
    await expect(
      saveBackendTextContentFromStore({
        elementId: 42,
        original: { ...original, editable: false },
        html: "<p>Text</p>",
        getState,
      }),
    ).rejects.toThrow("not editable");

    expect(mockedWriter).not.toHaveBeenCalled();
  });

  it("propagates backend writer errors", async () => {
    mockedWriter.mockRejectedValueOnce(
      new Error("Backend rejected update"),
    );

    await expect(
      saveBackendTextContentFromStore({
        elementId: 42,
        original,
        html: "<p>Neu</p>",
        getState,
      }),
    ).rejects.toThrow("Backend rejected update");
  });

  it("waits for the writer to finish", async () => {
    let resolveWrite!: () => void;

    const pending = new Promise<void>(resolve => {
      resolveWrite = resolve;
    });

    mockedWriter.mockReturnValueOnce(pending);

    let completed = false;

    const saving = saveBackendTextContentFromStore({
      elementId: 42,
      original,
      html: "<p>Neu</p>",
      getState,
    }).then(() => {
      completed = true;
    });

    await Promise.resolve();

    expect(completed).toBe(false);

    resolveWrite();
    await saving;

    expect(completed).toBe(true);
  });
});