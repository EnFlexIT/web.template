export type BackendMenuAccessMode =
  | "public"
  | "restricted";

export function isValidBackendMenuAccessV2(
  mode: BackendMenuAccessMode,
  selectedRoles: readonly string[],
  availableRoles: readonly string[],
): boolean {
  if (
    !Array.isArray(selectedRoles) ||
    !Array.isArray(availableRoles)
  ) {
    return false;
  }

  if (mode === "public") {
    return selectedRoles.length === 0;
  }

  if (mode !== "restricted") {
    return false;
  }

  return (
    selectedRoles.length > 0 &&
    selectedRoles.every(role =>
      typeof role === "string" &&
      role.trim().length > 0 &&
      availableRoles.includes(role),
    )
  );
}
