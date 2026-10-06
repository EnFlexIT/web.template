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
