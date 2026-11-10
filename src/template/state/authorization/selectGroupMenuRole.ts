import type {
  TemplateRootState,
} from "@/template/state/store/templateStoreTypes";

/**
 * Group roles confirmed by the group-role API.
 * Never substitute backend user roles here.
 */
const EMPTY_GROUP_ROLES: readonly string[] = Object.freeze([]);

export function selectAvailableGroupRoles(
  state: TemplateRootState,
): readonly string[] {
  if (
    !state.api.isLoggedIn ||
    !state.api.isPointingToServer ||
    state.api.isSwitchingServer ||
    state.api.isLoggingOut ||
    state.groupRoles.status !== "ready"
  ) {
    return EMPTY_GROUP_ROLES;
  }

  return state.groupRoles.roles;
}

/**
 * Selected group role for the DynSiteAPI menu request.
 * Does not modify or grant backend permissions.
 */
export function selectGroupMenuRole(
  state: TemplateRootState,
): string | null {
  const roles = selectAvailableGroupRoles(state);
  const selected = state.groupRoles.selectedGroupRole;

  if (
    selected === null ||
    !roles.includes(selected)
  ) {
    return null;
  }

  return selected;
}