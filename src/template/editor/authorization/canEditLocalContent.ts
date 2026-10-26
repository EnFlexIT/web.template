/**
 * Temporary frontend permission policy for local
 * content/menu editing.
 *
 * The actual effective roles currently use
 * USER, EDITOR and ADMIN.
 *
 * This does not replace backend authorization.
 */
export function canEditLocalContent(
  effectiveRoles: readonly string[] | null | undefined,
): boolean {
  if (!effectiveRoles) {
    return false;
  }

  return effectiveRoles.some(
    role => role === "EDITOR" || role === "ADMIN",
  );
}