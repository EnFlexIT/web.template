export function getBackendRoleDropdownModel(
  roles: readonly string[],
  selectedRole: string | null,
) {
  const options: Record<string, string> = {};

  for (const role of roles) {
    options[role] = role;
  }

  const value =
    selectedRole !== null &&
    roles.includes(selectedRole)
      ? selectedRole
      : (roles[0] ?? null);

  return { options, value };
}
