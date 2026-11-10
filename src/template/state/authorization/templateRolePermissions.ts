/**
 * Backend-independent role model for frontend demonstrations.
 *
 * These permissions describe UI capabilities only.
 * They must never replace verified backend authorization.
 */
export type TemplateRole =
  | "user"
  | "frontendEditor"
  | "backendEditor"
  | "superAdmin";

export type TemplatePermission =
  | "readContent"
  | "editFrontendContent"
  | "manageBackend";

export type EffectiveTemplateRole =
  Exclude<TemplateRole, "superAdmin">;

const effectiveRolePermissions: Record<
  EffectiveTemplateRole,
  readonly TemplatePermission[]
> = {
  user: ["readContent"],
  frontendEditor: [
    "readContent",
    "editFrontendContent",
  ],
  backendEditor: [
    "readContent",
    "manageBackend",
  ],
};

export const effectiveTemplateRoles: readonly EffectiveTemplateRole[] = [
  "user",
  "frontendEditor",
  "backendEditor",
];

export function resolveTemplatePermissions(
  role: TemplateRole,
): readonly TemplatePermission[] {
  if (role !== "superAdmin") {
    return [...effectiveRolePermissions[role]];
  }

  return [
    ...new Set(
      effectiveTemplateRoles.flatMap(
        effectiveRole => effectiveRolePermissions[effectiveRole],
      ),
    ),
  ];
}

export function hasTemplatePermission(
  role: TemplateRole,
  permission: TemplatePermission,
): boolean {
  return resolveTemplatePermissions(role).includes(permission);
}

/**
 * A superAdmin can preview all three effective roles.
 * Other roles cannot impersonate or select a different role.
 */
export function canPreviewTemplateRole(
  actualRole: TemplateRole,
  previewRole: EffectiveTemplateRole,
): boolean {
  return actualRole === "superAdmin" ||
    actualRole === previewRole;
}