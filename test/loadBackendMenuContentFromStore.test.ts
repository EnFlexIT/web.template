/**
 * @jest-environment jsdom
 */

import type {
  TemplateRootState,
} from "../src/template/state/store/templateStoreTypes";

import {
  loadBackendMenuContentFromStore,
} from "../src/template/editor/adapters/loadBackendMenuContentFromStore";

const textContent = {
  abstractSiteContentType: "SiteContentText",
  uniqueContentId: 42,
  editable: true,
  updatePeriodInSeconds: 30,
  mimeType: "text/html",
  text: "<p>Backend-Inhalt</p>",
};

function createFixture() {
  const getMenuContent = jest.fn().mockResolvedValue({
    data: {
      contentList: [
        { position: 0, content: textContent },
      ],
    },
  });

  const api = {
    isLoggedIn: true,
    isLoggingOut: false,
    isSwitchingServer: false,
    ip: "https://test.invalid",
    authGeneration: 1,
    dynamic_content_api_v2: {
      defaultApi: {
        getMenuContent,
      },
    },
  };

  const state = { api } as unknown as TemplateRootState;

  return {
    api,
    state,
    getMenuContent,
    getState: () => state,
  };
}

describe("loadBackendMenuContentFromStore", () => {
  it("loads positioned V2 content", async () => {
    const fixture = createFixture();

    const blocks = await loadBackendMenuContentFromStore({
      menuId: 10,
      getState: fixture.getState,
    });

    expect(fixture.getMenuContent).toHaveBeenCalledTimes(1);
    expect(fixture.getMenuContent).toHaveBeenCalledWith(10);
    expect(blocks).toHaveLength(1);

    expect(blocks[0]).toMatchObject({
      kind: "text",
      backendContentId: 42,
      position: 0,
      html: "<p>Backend-Inhalt</p>",
    });
  });

  it("loads a direct V2 API array", async () => {
    const fixture = createFixture();

    fixture.getMenuContent.mockResolvedValueOnce({
      data: [
        {
          position: 1,
          content: textContent,
        },
      ],
    });

    const blocks = await loadBackendMenuContentFromStore({
      menuId: 10003,
      getState: fixture.getState,
    });

    expect(fixture.getMenuContent).toHaveBeenCalledWith(10003);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({
      kind: "text",
      backendContentId: 42,
      position: 1,
      html: "<p>Backend-Inhalt</p>",
    });
  });
  it("rejects invalid menu IDs without sending a request", async () => {
    const fixture = createFixture();

    await expect(
      loadBackendMenuContentFromStore({
        menuId: -1,
        getState: fixture.getState,
      }),
    ).rejects.toThrow("Invalid backend menu ID");

    expect(fixture.getMenuContent).not.toHaveBeenCalled();
  });

  it("blocks unauthenticated loading", async () => {
    const fixture = createFixture();
    fixture.api.isLoggedIn = false;

    await expect(
      loadBackendMenuContentFromStore({
        menuId: 10,
        getState: fixture.getState,
      }),
    ).rejects.toThrow("not authorized");

    expect(fixture.getMenuContent).not.toHaveBeenCalled();
  });

  it("rejects responses after an authentication change", async () => {
    const fixture = createFixture();

    fixture.getMenuContent.mockImplementationOnce(async () => {
      fixture.api.authGeneration += 1;

      return {
        data: {
          contentList: [
            { position: 0, content: textContent },
          ],
        },
      };
    });

    await expect(
      loadBackendMenuContentFromStore({
        menuId: 10,
        getState: fixture.getState,
      }),
    ).rejects.toThrow("stale session");
  });

  it("rejects responses after a server switch", async () => {
    const fixture = createFixture();

    fixture.getMenuContent.mockImplementationOnce(async () => {
      fixture.api.ip = "https://other.invalid";

      return {
        data: {
          contentList: [
            { position: 0, content: textContent },
          ],
        },
      };
    });

    await expect(
      loadBackendMenuContentFromStore({
        menuId: 10,
        getState: fixture.getState,
      }),
    ).rejects.toThrow("stale session");
  });

  it("rejects malformed backend content", async () => {
    const fixture = createFixture();

    fixture.getMenuContent.mockResolvedValueOnce({
      data: {
        contentList: [
          {
            position: -1,
            content: textContent,
          },
        ],
      },
    });

    await expect(
      loadBackendMenuContentFromStore({
        menuId: 10,
        getState: fixture.getState,
      }),
    ).rejects.toThrow("Invalid V2 content entry");
  });

  it("propagates API errors", async () => {
    const fixture = createFixture();

    fixture.getMenuContent.mockRejectedValueOnce(
      new Error("Network unavailable"),
    );

    await expect(
      loadBackendMenuContentFromStore({
        menuId: 10,
        getState: fixture.getState,
      }),
    ).rejects.toThrow("Network unavailable");
  });
});