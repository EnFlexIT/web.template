/**
 * @jest-environment jsdom
 */

import { generateHTML, generateJSON } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";

import { sanitizeContentHtml } from
  "../src/template/editor/utils/sanitizeContentHtml";

describe("DOMPurify and Tiptap compatibility", () => {
  const extensions = [StarterKit];

  const cases = [
    {
      name: "headings and paragraphs",
      html: "<h2>Titel</h2><p>Text</p>",
    },
    {
      name: "bold italic and strike",
      html: "<p><strong>Fett</strong> <em>Kursiv</em> <s>Streichung</s></p>",
    },
    {
      name: "bullet lists",
      html: "<ul><li><p>Eins</p></li><li><p>Zwei</p></li></ul>",
    },
    {
      name: "ordered lists",
      html: "<ol><li><p>Eins</p></li><li><p>Zwei</p></li></ol>",
    },
    {
      name: "nested lists",
      html: "<ul><li><p>Oben</p><ul><li><p>Unten</p></li></ul></li></ul>",
    },
    {
      name: "blockquote",
      html: "<blockquote><p>Zitat</p></blockquote>",
    },
    {
      name: "code block",
      html: "<pre><code>const x = 1;</code></pre>",
    },
    {
      name: "horizontal rule",
      html: "<p>Vorher</p><hr><p>Nachher</p>",
    },
  ];

  it.each(cases)("preserves Tiptap document: $name", ({ html }) => {
    const originalDocument = generateJSON(html, extensions);

    const canonicalHtml = generateHTML(
      originalDocument,
      extensions,
    );

    const sanitizedHtml = sanitizeContentHtml(canonicalHtml);

    const restoredDocument = generateJSON(
      sanitizedHtml,
      extensions,
    );

    expect(restoredDocument).toEqual(originalDocument);
  });
});