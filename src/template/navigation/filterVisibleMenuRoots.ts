import type {
  MenuTree,
} from "@/template/state/navigation/menuSlice";

/**
 * Selects menu roots that are allowed for the
 * current authentication and role context.
 *
 * A rejected root also excludes its descendants.
 *
 * This only controls frontend visibility.
 * Backend authorization remains mandatory.
 */
export function filterVisibleMenuRoots(
  roots: readonly MenuTree[],
  isEnabled: (menuID: number) => boolean,
): MenuTree[] {
  return roots.filter(root =>
    isEnabled(root.val.menuID),
  );
}
