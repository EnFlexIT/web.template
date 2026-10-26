/**
 * @jest-environment jsdom
 */

import { sanitizeContentHtml } from
  "../src/template/editor/utils/sanitizeContentHtml";

describe("sanitizeContentHtml edge cases", () => {
  it("removes SVG and its event handlers", () => {
    const result = sanitizeContentHtml(
      '<svg onload="alert(1)"><circle /></svg>',
    );

    expect(result).not.toContain("<svg");
    expect(result).not.toContain("onload");
    expect(result).not.toContain("<circle");
  });

  it("removes MathML elements", () => {
    const result = sanitizeContentHtml(
      "<math><mtext>Test</mtext></math>",
    );

    expect(result).not.toContain("<math");
    expect(result).not.toContain("<mtext");
  });

  it("removes iframe elements", () => {
    const result = sanitizeContentHtml(
      '<iframe src="https://example.com"></iframe>',
    );

    expect(result).not.toContain("<iframe");
  });

  it("removes dangerous attributes from nested HTML", () => {
    const result = sanitizeContentHtml(
      '<div><p onmouseover="alert(1)">' +
      '<strong style="color:red">Hallo</strong>' +
      "</p></div>",
    );

    expect(result).toBe("<p><strong>Hallo</strong></p>");
  });

  it("keeps plain text containing HTML-like characters", () => {
    const result = sanitizeContentHtml(
      "<p>2 &lt; 5 und 8 &gt; 3</p>",
    );

    expect(result).toBe(
      "<p>2 &lt; 5 und 8 &gt; 3</p>",
    );
  });

  it("is idempotent for supported HTML", () => {
    const html =
      "<h2>Titel</h2><p><strong>Hallo</strong></p>";

    const once = sanitizeContentHtml(html);
    const twice = sanitizeContentHtml(once);

    expect(twice).toBe(once);
  });

  it("is idempotent after removing unsafe HTML", () => {
    const html =
      '<p onclick="alert(1)">Hallo</p>' +
      "<script>alert(2)</script>";

    const once = sanitizeContentHtml(html);
    const twice = sanitizeContentHtml(once);

    expect(twice).toBe(once);
    expect(once).not.toContain("onclick");
    expect(once).not.toContain("<script");
  });
});