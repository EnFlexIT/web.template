export type EffectiveUserRole =
  | "USER"
  | "EDITOR"
  | "ADMIN";


export type AssignedUserRole =
  EffectiveUserRole;


/**
 * An Admin may temporarily preview the Base Template
 * with the permissions of another Base Template role.
 *
 * The assigned role itself is never overwritten.
 */
export type RolePreview =
  | "USER"
  | "EDITOR"
  | null;


export const ROLE_LABELS:
  Record<
    AssignedUserRole,
    string
  > = {
    ADMIN: "Admin",
    USER: "User",
    EDITOR: "Editor",
  };

/**
 * Normalizes known backend roles without granting permissions
 * to unknown role names.
 */
export function normalizeBackendRole(role: string): string {
  const trimmed = role.trim();
  const normalized = trimmed.toUpperCase();

  if (
    normalized === "USER" ||
    normalized === "EDITOR" ||
    normalized === "ADMIN"
  ) {
    return normalized;
  }

  return role;
}
