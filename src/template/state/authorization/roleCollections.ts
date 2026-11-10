/**
 * Separately verified role collections.
 *
 * null means the respective API result is not available.
 * [] means the API confirmed that no roles are assigned.
 *
 * Never derive one role collection from the other.
 */
export interface RoleCollections {
  backendRoles: readonly string[] | null;
  groupRoles: readonly string[] | null;
}

export const unavailableRoleCollections: RoleCollections = {
  backendRoles: null,
  groupRoles: null,
};

/**
 * Only confirmed backend user roles may support
 * backend permission decisions.
 */
export function hasConfirmedBackendRole(
  collections: RoleCollections,
  role: string,
): boolean {
  return collections.backendRoles?.includes(role) ?? false;
}

/**
 * Only confirmed group roles are selectable
 * for role-filtered backend menus.
 */
export function getConfirmedGroupRoles(
  collections: RoleCollections,
): readonly string[] {
  return collections.groupRoles ?? [];
}

/**
 * Selects a verified group role for menu preview.
 *
 * Does not grant permissions.
 */
export function resolveGroupMenuPreviewRole(
  collections: RoleCollections,
  selectedRole: string | null,
): string | null {
  const roles = getConfirmedGroupRoles(collections);

  if (selectedRole !== null && roles.includes(selectedRole)) {
    return selectedRole;
  }

  return roles[0] ?? null;
}