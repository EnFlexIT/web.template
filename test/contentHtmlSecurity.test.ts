/**
 * @jest-environment jsdom
 */

import { generateJSON } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";

describe("Tiptap HTML security investigation", () => {
  const extensions = [StarterKit];

  it("preserves supported text formatting", () => {
    const document = generateJSON(
      "<p><strong>Fett</strong> und <em>Kursiv</em></p>",
      extensions,
    );

    expect(document.type).toBe("doc");
    expect(JSON.stringify(document)).toContain("Fett");
    expect(JSON.stringify(document)).toContain("Kursiv");
    expect(JSON.stringify(document)).toContain("bold");
    expect(JSON.stringify(document)).toContain("italic");
  });

  it("does not preserve script elements as document nodes", () => {
    const document = generateJSON(
      '<p>Hallo</p><script>window.alert("test")</script>',
      extensions,
    );

    const json = JSON.stringify(document);

    expect(json).not.toContain('"type":"script"');
  });

  it("does not preserve unsupported image attributes", () => {
    const document = generateJSON(
      '<p>Text</p><img src="x" onerror="alert(1)">',
      extensions,
    );

    const json = JSON.stringify(document);

    expect(json).not.toContain("onerror");
  });

  it("does not preserve arbitrary inline event attributes", () => {
    const document = generateJSON(
      '<p onclick="alert(1)">Text</p>',
      extensions,
    );

    expect(JSON.stringify(document)).not.toContain("onclick");
  });

  it("does not execute inline event handlers while parsing", () => {
    const previousMarker = (
      window as Window & { __htmlParseExecuted?: boolean }
    ).__htmlParseExecuted;

    try {
      (
        window as Window & { __htmlParseExecuted?: boolean }
      ).__htmlParseExecuted = false;

      generateJSON(
        '<img src="invalid" onerror="window.__htmlParseExecuted = true">',
        extensions,
      );

      expect(
        (
          window as Window & { __htmlParseExecuted?: boolean }
        ).__htmlParseExecuted,
      ).toBe(false);
    } finally {
      (
        window as Window & { __htmlParseExecuted?: boolean }
      ).__htmlParseExecuted = previousMarker;
    }
  });
  it("does not preserve unsupported link markup", () => {
    const document = generateJSON(
      '<p><a href="javascript:alert(1)">Link</a></p>',
      extensions,
    );

    const json = JSON.stringify(document);

    expect(json).not.toContain("javascript:");
  });
});