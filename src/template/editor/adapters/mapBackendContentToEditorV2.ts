import type {
  AbstractSiteContent,
  SiteContentList,
  SiteContentText,
} from "@/api/implementation/Dynamic-Content-Api-V2";

import { sanitizeContentHtml } from "../utils/sanitizeContentHtml";
import { isSiteContentTextV2 } from "./isSiteContentTextV2";

export interface BackendEditorTextBlockV2 {
  kind: "text";
  backendContentId: number;
  position: number;
  editable: boolean;
  html: string;
  original: SiteContentText;
}

export interface BackendEditorUnsupportedBlockV2 {
  kind: "unsupported";
  backendContentId: number;
  position: number;
  original: AbstractSiteContent;
}

export type BackendEditorBlockV2 =
  | BackendEditorTextBlockV2
  | BackendEditorUnsupportedBlockV2;

export function mapBackendContentToEditorV2(
  list: SiteContentList,
): BackendEditorBlockV2[] {
  if (!list || !Array.isArray(list.contentList)) {
    throw new Error("Invalid V2 content list");
  }

  return list.contentList.map(entry => {
    if (
      !entry ||
      !Number.isSafeInteger(entry.position) ||
      entry.position < 0 ||
      !entry.content ||
      !Number.isSafeInteger(entry.content.uniqueContentId) ||
      entry.content.uniqueContentId <= 0
    ) {
      throw new Error("Invalid V2 content entry");
    }

    const content = entry.content;

    if (isSiteContentTextV2(content)) {
      return {
        kind: "text" as const,
        backendContentId: content.uniqueContentId,
        position: entry.position,
        editable: content.editable,
        html: sanitizeContentHtml(content.text),
        original: content,
      };
    }

    return {
      kind: "unsupported" as const,
      backendContentId: content.uniqueContentId,
      position: entry.position,
      original: content,
    };
  });
}