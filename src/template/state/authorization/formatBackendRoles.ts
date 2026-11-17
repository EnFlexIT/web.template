import type {
  BackendRolesStatus,
} from "./backendRolesSlice";

/**
 * Display only. This function does not grant permissions.
 */
export function formatBackendRoles(
  status: BackendRolesStatus,
  roles: readonly string[],
): string {
  if (status === "loading") {
    return "Rollen werden geladen";
  }

  if (status === "error") {
    return "Rollen nicht verfügbar";
  }

  if (status === "idle") {
    return "Rollen noch nicht geladen";
  }

  return roles.length > 0
    ? `Rollen: ${roles.join(", ")}`
    : "Rolle: USER (Standard)";
}
