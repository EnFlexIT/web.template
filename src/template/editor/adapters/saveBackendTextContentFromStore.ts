import type {
  SiteContentText,
} from "@/api/implementation/Dynamic-Content-Api-V2";

import type {
  TemplateRootState,
} from "@/template/state/store/templateStoreTypes";

import {
  buildBackendContentUpdateRequest,
} from "./buildBackendContentUpdateRequest";

import {
  updateBackendContentElementFromStore,
} from "./updateBackendContentElementFromStore";

export interface SaveBackendTextContentParams {
  elementId: number;
  original: SiteContentText;
  html: string;
  getState: () => TemplateRootState;
}

/**
 * Connects the V2 text request builder to the authorized
 * Redux-backed writer.
 *
 * Call only from an explicitly authorized backend editor.
 * Does not modify local drafts or publish menus.
 */
export async function saveBackendTextContentFromStore({
  elementId,
  original,
  html,
  getState,
}: SaveBackendTextContentParams): Promise<void> {
  const update = buildBackendContentUpdateRequest(
    elementId,
    original,
    html,
  );

  await updateBackendContentElementFromStore({
    elementId: update.elementId,
    request: update.request,
    getState,
  });
}