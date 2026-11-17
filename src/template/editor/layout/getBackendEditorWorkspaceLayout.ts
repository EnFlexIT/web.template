/**
 * Mobile tabs are only available on the authenticated
 * backend content editor route.
 *
 * The window breakpoint is intentionally aligned
 * with the existing Screen.tsx small-screen threshold.
 */
export function getBackendEditorWorkspaceLayout(
  windowWidth: number,
  hasBackendMenu: boolean,
  canEditBackend: boolean,
): "split" | "tabs" {
  if (
    Number.isFinite(windowWidth) &&
    windowWidth < 900 &&
    hasBackendMenu &&
    canEditBackend
  ) {
    return "tabs";
  }

  return "split";
}