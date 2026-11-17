/**
 * @jest-environment jsdom
 */

import type {
  SiteContentList,
  SiteContentText,
} from "../src/api/implementation/Dynamic-Content-Api-V2";

import {
  isSiteContentTextV2,
} from "../src/template/editor/adapters/isSiteContentTextV2";

import {
  mapBackendContentToEditorV2,
} from "../src/template/editor/adapters/mapBackendContentToEditorV2";

import {
  buildBackendContentUpdateRequest,
} from "../src/template/editor/adapters/buildBackendContentUpdateRequest";

const original: SiteContentText = {
  abstractSiteContentType: "SiteContentText",
  uniqueContentId: 42,
  editable: true,
  updatePeriodInSeconds: 30,
  mimeType: "text/html",
  text: "<p>Alter Text</p>",
};

describe("DynSiteAPI V2 editor mapping", () => {
  it("recognizes a complete V2 text element", () => {
    expect(isSiteContentTextV2(original)).toBe(true);
    expect(
      isSiteContentTextV2({
        ...original,
        abstractSiteContentType: "SiteContentImage",
      }),
    ).toBe(false);
  });

  it("rejects incomplete text elements", () => {
    expect(
      isSiteContentTextV2({
        ...original,
        mimeType: undefined,
      }),
    ).toBe(false);
  });

  it("maps positioned content using the V2 ID", () => {
    const list: SiteContentList = {
      contentList: [
        { position: 2, content: original },
      ],
    };

    const blocks = mapBackendContentToEditorV2(list);

    expect(blocks).toHaveLength(1);
    expect(blocks[0].kind).toBe("text");
    expect(blocks[0].backendContentId).toBe(42);
    expect(blocks[0].position).toBe(2);

    if (blocks[0].kind === "text") {
      expect(blocks[0].html).toBe("<p>Alter Text</p>");
      expect(blocks[0].original).toBe(original);
    }
  });

  it("keeps unsupported content without editing it", () => {
    const list: SiteContentList = {
      contentList: [
        {
          position: 1,
          content: {
            ...original,
            abstractSiteContentType: "UnknownContent",
          },
        },
      ],
    };

    expect(mapBackendContentToEditorV2(list)[0].kind)
      .toBe("unsupported");
  });

  it("rejects invalid backend IDs", () => {
    const list: SiteContentList = {
      contentList: [
        {
          position: 1,
          content: {
            ...original,
            uniqueContentId: -1,
          },
        },
      ],
    };

    expect(() => mapBackendContentToEditorV2(list))
      .toThrow("Invalid V2 content entry");
  });

  it("builds a complete text update without mutation", () => {
    const result = buildBackendContentUpdateRequest(
      42,
      original,
      "<p>Neuer Text</p>",
    );

    expect(result.elementId).toBe(42);
    expect(result.request.content).toEqual({
      ...original,
      text: "<p>Neuer Text</p>",
    });

    expect(original.text).toBe("<p>Alter Text</p>");
    expect(result.request.content).not.toBe(original);
  });

  it("rejects conflicting backend IDs", () => {
    expect(() =>
      buildBackendContentUpdateRequest(
        99,
        original,
        "<p>Test</p>",
      ),
    ).toThrow("Backend content ID mismatch");
  });

  it("rejects non-editable backend content", () => {
    expect(() =>
      buildBackendContentUpdateRequest(
        42,
        { ...original, editable: false },
        "<p>Test</p>",
      ),
    ).toThrow("not editable");
  });

  it("removes unsafe HTML before building the request", () => {
    const result = buildBackendContentUpdateRequest(
      42,
      original,
      '<p>OK</p><script>alert("x")</script>',
    );

    const content = result.request.content as SiteContentText;

    expect(content.text).toContain("<p>OK</p>");
    expect(content.text).not.toContain("<script");
  });
});