import type {
  TemplateRootState,
} from "@/template/state/store/templateStoreTypes";

import {
  selectBackendMenuPreviewRole,
} from "@/template/state/authorization/selectBackendMenuPreviewRole";

/**
 * Captured when a role-scoped menu request starts.
 * This is a consistency guard, not an authorization check.
 */
export type BackendMenuRequestIdentity = {
  role: string | null;
  language: string;
  server: string;
  jwt: string | null;
  authenticationMethod:
    TemplateRootState["api"]["authenticationMethod"];
  apiClient:
    TemplateRootState["api"]["dynamic_content_api"]["defaultApi"];
  backendRolesRequestId: string | null;
  groupRolesSnapshot: string;
};

export function captureBackendMenuRequestIdentity(
  state: TemplateRootState,
): BackendMenuRequestIdentity {
  const role = selectBackendMenuPreviewRole(state);

  return {
    role,
    language: state.language.language,
    server: state.api.ip,
    jwt: state.api.jwt,
    authenticationMethod: state.api.authenticationMethod,
    apiClient: state.api.dynamic_content_api.defaultApi,
    backendRolesRequestId: state.backendRoles.requestId,
    groupRolesSnapshot: JSON.stringify(state.groupRoles.roles),
  };
}

/**
 * Reject results from an obsolete role, session,
 * language or API client.
 *
 * Request ordering is handled separately by the menu reducer.
 */
export function isCurrentBackendMenuRequest(
  state: TemplateRootState,
  request: BackendMenuRequestIdentity,
): boolean {
  return (
    state.api.isLoggedIn === true &&
    !state.api.isLoggingOut &&
    !state.api.isSwitchingServer &&
    selectBackendMenuPreviewRole(state) === request.role &&
    state.language.language === request.language &&
    state.api.ip === request.server &&
    state.api.jwt === request.jwt &&
    state.api.authenticationMethod === request.authenticationMethod &&
    state.api.dynamic_content_api.defaultApi === request.apiClient &&
    state.backendRoles.requestId === request.backendRolesRequestId &&
    JSON.stringify(state.groupRoles.roles) === request.groupRolesSnapshot
  );
}
