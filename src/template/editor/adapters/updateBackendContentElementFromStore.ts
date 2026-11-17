import type {
  UpdateContentElementRequest,
} from "@/api/implementation/Dynamic-Content-Api-V2";

import type {
  TemplateRootState,
} from "@/template/state/store/templateStoreTypes";

import {
  selectVerifiedBackendRoles,
} from "@/template/state/authorization/selectVerifiedBackendRoles";

import {
  canEditLocalContent,
} from "@/template/editor/authorization/canEditLocalContent";

import {
  updateBackendContentElement,
  type BackendContentWriteContext,
} from "./updateBackendContentElement";

export interface UpdateBackendContentFromStoreParams {
  elementId: number;
  request: UpdateContentElementRequest;
  getState: () => TemplateRootState;
}

export function selectBackendContentWriteContext(
  state: TemplateRootState,
): BackendContentWriteContext {
  const api = state.api;

  const verifiedRoles = selectVerifiedBackendRoles(state);

  return {
    client: api.dynamic_content_api_v2.defaultApi,
    server: api.ip,
    authGeneration: api.authGeneration,
    isLoggedIn: api.isLoggedIn,
    canEdit: canEditLocalContent(verifiedRoles),
    isSwitchingServer: api.isSwitchingServer,
    isLoggingOut: api.isLoggingOut,
  };
}

export async function updateBackendContentElementFromStore({
  elementId,
  request,
  getState,
}: UpdateBackendContentFromStoreParams): Promise<void> {
  return updateBackendContentElement({
    elementId,
    request,
    getContext: () => selectBackendContentWriteContext(getState()),
  });
}