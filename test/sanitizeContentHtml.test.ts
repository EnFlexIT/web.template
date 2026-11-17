/**
 * @jest-environment jsdom
 */

import { sanitizeContentHtml } from
  "../src/template/editor/utils/sanitizeContentHtml";

describe("sanitizeContentHtml", () => {
  it("preserves supported formatting", () => {
    const html =
      "<h2>Titel</h2><p><strong>Fett</strong> " +
      "<em>Kursiv</em> <s>Durchgestrichen</s></p>";

    expect(sanitizeContentHtml(html)).toBe(html);
  });

  it("removes script elements and their contents", () => {
    const result = sanitizeContentHtml(
      '<p>Hallo</p><script>alert(1)</script>',
    );

    expect(result).toBe("<p>Hallo</p>");
    expect(result).not.toContain("alert");
  });

  it("removes inline event handlers", () => {
    const result = sanitizeContentHtml(
      '<p onclick="alert(1)">Text</p>',
    );

    expect(result).toBe("<p>Text</p>");
  });

  it("removes links and unsafe URL attributes", () => {
    const result = sanitizeContentHtml(
      '<p><a href="javascript:alert(1)">Link</a></p>',
    );

    expect(result).toBe("<p>Link</p>");
  });

  it("removes image elements", () => {
    const result = sanitizeContentHtml(
      '<img src="invalid" onerror="alert(1)">',
    );

    expect(result).toBe("");
  });

  it("removes unsupported style attributes", () => {
    const result = sanitizeContentHtml(
      '<p style="color:red">Text</p>',
    );

    expect(result).toBe("<p>Text</p>");
  });
});