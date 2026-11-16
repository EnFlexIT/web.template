import type {
  SiteContentText,
} from "@/api/implementation/Dynamic-Content-Api-V2";

import type {
  TemplateRootState,
} from "@/template/state/store/templateStoreTypes";

import {
  isSiteContentTextV2,
} from "./isSiteContentTextV2";

import {
  selectBackendContentWriteContext,
} from "./updateBackendContentElementFromStore";

import {
  saveBackendTextContentFromStore,
} from "./saveBackendTextContentFromStore";

export interface SaveBackendTextWithConflictCheckParams {
  elementId: number;
  original: SiteContentText;
  html: string;
  getState: () => TemplateRootState;
}

export async function saveBackendTextWithConflictCheck({
  elementId,
  original,
  html,
  getState,
}: SaveBackendTextWithConflictCheckParams): Promise<void> {
  if (
    !isSiteContentTextV2(original) ||
    !original.editable ||
    !Number.isSafeInteger(elementId) ||
    elementId <= 0 ||
    original.uniqueContentId !== elementId
  ) {
    throw new Error("Invalid or non-editable backend text");
  }

  const mimeType = original.mimeType
    .split(";")[0]
    .trim()
    .toLowerCase();

  if (mimeType !== "text/html") {
    throw new Error("Only HTML backend text may be edited");
  }

  const beforeState = getState();

  const before = selectBackendContentWriteContext(beforeState);

  if (
    !before.isLoggedIn ||
    !before.canEdit ||
    before.isLoggingOut ||
    before.isSwitchingServer ||
    !before.server.trim()
  ) {
    throw new Error("Backend editing is not authorized");
  }

  const client =
    beforeState.api.dynamic_content_api_v2.defaultApi;

  if (
    before.client !== client ||
    typeof client.getContentElement !== "function"
  ) {
    throw new Error("Invalid backend content client");
  }

  const response = await client.getContentElement(elementId);
  const latest: unknown = response.data;

  const afterState = getState();
  const after = selectBackendContentWriteContext(afterState);

  if (
    !after.isLoggedIn ||
    !after.canEdit ||
    after.isLoggingOut ||
    after.isSwitchingServer ||
    after.server !== before.server ||
    after.authGeneration !== before.authGeneration ||
    after.client !== before.client ||
    afterState.api.dynamic_content_api_v2.defaultApi !== client
  ) {
    throw new Error("Backend session changed before saving");
  }

  if (
    !isSiteContentTextV2(latest) ||
    latest.uniqueContentId !== original.uniqueContentId ||
    latest.editable !== original.editable ||
    latest.mimeType !== original.mimeType ||
    latest.updatePeriodInSeconds !==
      original.updatePeriodInSeconds ||
    latest.text !== original.text
  ) {
    throw new Error(
      "Backend content conflict: reload before editing",
    );
  }

  await saveBackendTextContentFromStore({
    elementId,
    original: latest,
    html,
    getState,
  });
}