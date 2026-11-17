import type {
  SiteContentList,
} from "@/api/implementation/Dynamic-Content-Api-V2";

import type {
  TemplateRootState,
} from "@/template/state/store/templateStoreTypes";

import {
  mapBackendContentToEditorV2,
  type BackendEditorBlockV2,
} from "./mapBackendContentToEditorV2";

export interface LoadBackendMenuContentParams {
  menuId: number;
  getState: () => TemplateRootState;
}

type ApiState = TemplateRootState["api"];

function isReadable(api: ApiState): boolean {
  return (
    api.isLoggedIn &&
    !api.isLoggingOut &&
    !api.isSwitchingServer &&
    typeof api.ip === "string" &&
    api.ip.trim().length > 0 &&
    Number.isSafeInteger(api.authGeneration) &&
    typeof api.dynamic_content_api_v2?.defaultApi?.getMenuContent ===
      "function"
  );
}

/**
 * Loads content from the currently authenticated V2 client.
 *
 * No backend writes, local draft changes or navigation changes.
 * A response from an obsolete session is rejected.
 */
export async function loadBackendMenuContentFromStore({
  menuId,
  getState,
}: LoadBackendMenuContentParams): Promise<BackendEditorBlockV2[]> {
  if (!Number.isSafeInteger(menuId) || menuId <= 0) {
    throw new Error("Invalid backend menu ID");
  }

  const before = getState().api;

  if (!isReadable(before)) {
    throw new Error("Backend content loading is not authorized");
  }

  const client = before.dynamic_content_api_v2.defaultApi;
  const server = before.ip;
  const authGeneration = before.authGeneration;

  const response = await client.getMenuContent(menuId);

  const after = getState().api;

  if (
    !isReadable(after) ||
    after.dynamic_content_api_v2.defaultApi !== client ||
    after.ip !== server ||
    after.authGeneration !== authGeneration
  ) {
    throw new Error(
      "Backend content response belongs to a stale session",
    );
  }

  // Accept the direct V2 array as well as the wrapped contentList.
  // The existing mapper still validates individual entries.
  const contentList: SiteContentList = Array.isArray(response.data)
    ? ({ contentList: response.data } as SiteContentList)
    : response.data;

  return mapBackendContentToEditorV2(contentList);
}