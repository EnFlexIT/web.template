import {
  normalizeDynSiteContentResponse,
} from "../src/template/screens/dynamicScreen/normalizeDynSiteContentResponse";

describe("normalizeDynSiteContentResponse", () => {
  const text = {
    abstractSiteContentType: "SiteContentText",
    uniqueContentId: 20101,
    editable: true,
    mimeType: "text/plain",
    text: "System-Status",
    updatePeriodInSeconds: 60,
  };

  it("converts positioned backend content", () => {
    const result = normalizeDynSiteContentResponse([
      { position: 2, content: { ...text, uniqueContentId: 20102, text: "Zwei" } },
      { position: 1, content: text },
    ]);

    expect(result.contentList).toHaveLength(2);
    expect(result.contentList[0]).toMatchObject({
      AbstractSiteContentType: "SiteContentText",
      uniqueContentID: 20101,
      text: "System-Status",
    });
    expect(result.contentList[1]).toMatchObject({
      uniqueContentID: 20102,
      text: "Zwei",
    });
  });

  it("supports the existing contentList format", () => {
    const result = normalizeDynSiteContentResponse({
      contentList: [{
        AbstractSiteContentType: "SiteContentText",
        uniqueContentID: 20103,
        text: "Alt",
      }],
    });

    expect(result.contentList[0]).toMatchObject({
      AbstractSiteContentType: "SiteContentText",
      uniqueContentID: 20103,
      text: "Alt",
    });
  });

  it("accepts a genuinely empty list", () => {
    expect(normalizeDynSiteContentResponse([]))
      .toEqual({ contentList: [] });
  });

  it("rejects missing contentList", () => {
    expect(() => normalizeDynSiteContentResponse({}))
      .toThrow("expected array or contentList");
  });

  it("rejects invalid positions", () => {
    expect(() => normalizeDynSiteContentResponse([
      { position: -1, content: text },
    ])).toThrow("position");
  });

  it("rejects missing content IDs", () => {
    expect(() => normalizeDynSiteContentResponse([
      { position: 1, content: { abstractSiteContentType: "SiteContentText" } },
    ])).toThrow("content fields");
  });

  it("does not change the backend object", () => {
    const original = { position: 1, content: { ...text } };

    normalizeDynSiteContentResponse([original]);

    expect(original.content).not.toHaveProperty("uniqueContentID");
  });
});
