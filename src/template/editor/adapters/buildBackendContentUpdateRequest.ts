import type {
  SiteContentText,
  UpdateContentElementRequest,
} from "@/api/implementation/Dynamic-Content-Api-V2";

import { sanitizeContentHtml } from "../utils/sanitizeContentHtml";
import { isSiteContentTextV2 } from "./isSiteContentTextV2";

export interface BackendTextUpdate {
  elementId: number;
  request: UpdateContentElementRequest;
}

export function buildBackendContentUpdateRequest(
  elementId: number,
  original: SiteContentText,
  html: string,
): BackendTextUpdate {
  if (!isSiteContentTextV2(original)) {
    throw new Error("Invalid V2 text content");
  }

  if (!Number.isSafeInteger(elementId) || elementId <= 0) {
    throw new Error("Invalid backend element ID");
  }

  if (elementId !== original.uniqueContentId) {
    throw new Error("Backend content ID mismatch");
  }

  if (!original.editable) {
    throw new Error("Backend text content is not editable");
  }

  if (typeof html !== "string") {
    throw new Error("Invalid HTML content");
  }

  return {
    elementId,
    request: {
      content: {
        ...original,
        text: sanitizeContentHtml(html),
      } as SiteContentText,
    },
  };
}