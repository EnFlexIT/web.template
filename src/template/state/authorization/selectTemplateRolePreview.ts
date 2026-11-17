import type {
  TemplateRootState,
} from "@/template/state/store/templateStoreTypes";

import {
  canPreviewTemplateRole,
  hasTemplatePermission,
  type EffectiveTemplateRole,
  type TemplatePermission,
} from "./templateRolePermissions";

/**
 * Demo-only role perspective.
 * Never use this to authorize backend operations.
 */
export function selectActiveTemplatePreviewRole(
  state: TemplateRootState,
): EffectiveTemplateRole | null {
  if (
    !state.api.isLoggedIn ||
    state.api.isLoggingOut ||
    state.api.isSwitchingServer ||
    !state.templateRolePreview.enabled
  ) {
    return null;
  }

  const { actualRole, selectedPreviewRole } =
    state.templateRolePreview;

  if (
    actualRole === null ||
    selectedPreviewRole === null ||
    !canPreviewTemplateRole(actualRole, selectedPreviewRole)
  ) {
    return null;
  }

  return selectedPreviewRole;
}

/**
 * This represents visual demo permissions only.
 * It must not replace selectCanUseContentEditor.
 */
export function selectTemplatePreviewPermission(
  state: TemplateRootState,
  permission: TemplatePermission,
): boolean {
  const role = selectActiveTemplatePreviewRole(state);

  return role !== null &&
    hasTemplatePermission(role, permission);
}