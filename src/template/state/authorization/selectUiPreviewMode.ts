import type {
  TemplateRootState,
} from "@/template/state/store/templateStoreTypes";

import type {
  EffectiveUserRole,
} from "@/template/authorization/roles";

import {
  selectVerifiedBackendRoles,
} from "./selectVerifiedBackendRoles";

/**
 * Frontend display perspective, not an authorization grant.
 * The public USER perspective is always the default.
 */
export function selectUiPreviewMode(
  state: TemplateRootState,
): EffectiveUserRole {
  const roles = selectVerifiedBackendRoles(state);
  const selected = state.backendRoles.selectedPreviewRole;

  if (
    (selected === "EDITOR" || selected === "ADMIN") &&
    roles.includes(selected)
  ) {
    return selected;
  }

  return "USER";
}

/**
 * UI-only roles for application menu visibility.
 * Never use this selector to authorize API writes.
 */
const EMPTY_PREVIEW_ROLES: readonly EffectiveUserRole[] = [];
const USER_PREVIEW_ROLES: readonly EffectiveUserRole[] = ["USER"];
const EDITOR_PREVIEW_ROLES: readonly EffectiveUserRole[] = ["EDITOR"];
const ADMIN_PREVIEW_ROLES: readonly EffectiveUserRole[] = ["ADMIN"];

export function selectUiPreviewRoles(
  state: TemplateRootState,
): readonly EffectiveUserRole[] {
  if (
    !state.api.isLoggedIn ||
    state.api.isLoggingOut ||
    state.api.isSwitchingServer ||
    state.backendRoles.status !== "ready"
  ) {
    return EMPTY_PREVIEW_ROLES;
  }

  switch (selectUiPreviewMode(state)) {
    case "EDITOR":
      return EDITOR_PREVIEW_ROLES;
    case "ADMIN":
      return ADMIN_PREVIEW_ROLES;
    default:
      return USER_PREVIEW_ROLES;
  }
}

/**
 * Both the backend permission and the selected EDITOR
 * perspective are required for editing controls.
 */
export function selectCanEditInUiPreview(
  state: TemplateRootState,
): boolean {
  return (
    selectUiPreviewMode(state) === "EDITOR" &&
    selectVerifiedBackendRoles(state).includes("EDITOR")
  );
}
