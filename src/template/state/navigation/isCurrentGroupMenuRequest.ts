import type {
  TemplateRootState,
} from "@/template/state/store/templateStoreTypes";

import {
  selectGroupMenuRole,
} from "@/template/state/authorization/selectGroupMenuRole";

/**
 * Request consistency only. Not an authorization check.
 */
export type GroupMenuRequestIdentity = {
  role: string;
  language: string;
  server: string;
  jwt: TemplateRootState["api"]["jwt"];
  authenticationMethod:
    TemplateRootState["api"]["authenticationMethod"];
  apiClient:
    TemplateRootState["api"]["dynamic_content_api"]["defaultApi"];
  groupRolesReference: readonly string[];
};

export function captureGroupMenuRequestIdentity(
  state: TemplateRootState,
): GroupMenuRequestIdentity | null {
  const role = selectGroupMenuRole(state);

  if (role === null) {
    return null;
  }

  return {
    role,
    language: state.language.language,
    server: state.api.ip,
    jwt: state.api.jwt,
    authenticationMethod: state.api.authenticationMethod,
    apiClient: state.api.dynamic_content_api.defaultApi,
    groupRolesReference: state.groupRoles.roles,
  };
}

export function isCurrentGroupMenuRequest(
  state: TemplateRootState,
  request: GroupMenuRequestIdentity,
): boolean {
  return (
    selectGroupMenuRole(state) === request.role &&
    state.language.language === request.language &&
    state.api.ip === request.server &&
    state.api.jwt === request.jwt &&
    state.api.authenticationMethod === request.authenticationMethod &&
    state.api.dynamic_content_api.defaultApi === request.apiClient &&
    state.groupRoles.roles === request.groupRolesReference
  );
}