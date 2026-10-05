export type EffectiveUserRole =
  | "user"
  | "frontendEditor"
  | "backendEditor";

export type AssignedUserRole =
  | EffectiveUserRole
  | "superAdmin";

export type RolePreview =
  EffectiveUserRole | null;

/**
 * A Super Admin aggregates all effective roles.
 *
 * The backend will eventually provide the assigned role.
 * Until then the frontend can use this structure for
 * authorization preparation and role-preview demonstrations.
 */
export const SUPER_ADMIN_ROLES:
  readonly EffectiveUserRole[] = [
    "user",
    "frontendEditor",
    "backendEditor",
  ];

export const ROLE_LABELS: Record<
  AssignedUserRole,
  string
> = {
  superAdmin: "Super Admin",
  user: "User",
  frontendEditor: "Frontend Editor",
  backendEditor: "Backend Editor",
};