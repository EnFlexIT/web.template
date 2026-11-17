/**
 * Width of the backend editor inside the existing
 * horizontal workspace.
 *
 * Desktop: preview 65% / editor 35%.
 * Medium: preview 50% / editor 50%.
 *
 * Small windows preserve the previous panel width
 * until the mobile tab layout is implemented.
 *
 * Breakpoints use window width in this first phase.
 */
export function getBackendEditorPanelWidth(
  windowWidth: number,
): "35%" | "50%" | 460 {
  if (windowWidth >= 1500) {
    return "35%";
  }

  if (windowWidth >= 900) {
    return "50%";
  }

  return 460;
}