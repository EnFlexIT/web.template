import type {
  TemplateRootState,
} from "@/template/state/store/templateStoreTypes";

/**
 * Runtime roles confirmed by the authenticated backend.
 * Demo roles and dropdown selections do not grant rights.
 */
const EMPTY_VERIFIED_ROLES: readonly string[] = [];

export function selectVerifiedBackendRoles(
  state: TemplateRootState,
): readonly string[] {
  if (
    !state.api.isLoggedIn ||
    state.api.isSwitchingServer ||
    state.api.isLoggingOut ||
    state.backendRoles.status !== "ready"
  ) {
    return EMPTY_VERIFIED_ROLES;
  }

  return state.backendRoles.roles;
}

/**
 * Temporary explicit permission contract:
 * only the backend-confirmed EDITOR role enables the
 * existing local frontend content editor.
 *
 * Backend endpoints must still authorize writes.
 */
export function selectCanUseContentEditor(
  state: TemplateRootState,
): boolean {
  return selectVerifiedBackendRoles(state).includes("EDITOR");
}
