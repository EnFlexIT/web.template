import type {
  AbstractSiteContent,
  SiteContentList,
  SiteContentText,
} from "@/api/implementation/Dynamic-Content-Api";

import {
  isSiteContentText,
} from "@/template/components/dynamic-content/model/isAbstractSiteContent";

import {
  sanitizeContentHtml,
} from "../utils/sanitizeContentHtml";

export interface BackendEditorTextBlock {
  kind: "text";
  backendContentId: number;
  editable: boolean;
  html: string;
  original: SiteContentText;
}

export interface BackendEditorUnsupportedBlock {
  kind: "unsupported";
  backendContentId: number;
  original: AbstractSiteContent;
}

export type BackendEditorBlock =
  | BackendEditorTextBlock
  | BackendEditorUnsupportedBlock;

/**
 * Converts backend content into a read-only editor preparation model.
 *
 * Does not mutate backend objects or persist data.
 * No backend writes are performed.
 */
export function mapBackendContentToEditor(
  contentList: SiteContentList,
): BackendEditorBlock[] {
  return contentList.contentList.map((content) => {
    if (isSiteContentText(content)) {
      return {
        kind: "text" as const,
        backendContentId: content.uniqueContentID,
        editable: content.editable,
        html: sanitizeContentHtml(content.text),
        original: content,
      };
    }

    return {
      kind: "unsupported" as const,
      backendContentId: content.uniqueContentID,
      original: content,
    };
  });
}