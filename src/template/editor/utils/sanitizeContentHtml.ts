import DOMPurify from "dompurify";

/**
 * Sanitizes rich-text HTML for the current web editor.
 *
 * Does not read or modify persisted drafts.
 */
export function sanitizeContentHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "em", "s",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "ul", "ol", "li", "blockquote",
      "pre", "code", "hr",
    ],
    ALLOWED_ATTR: [],
  });
}