import type {
  LocalContentPreviewNode,
} from "../adapters/buildLocalContentPreview";

/**
 * Returns local content roots attached to one
 * registered static Application menu.
 *
 * Does not modify the supplied preview nodes.
 */
export function getLocalPreviewChildren(
  roots: readonly LocalContentPreviewNode[],
  staticMenuId: number,
): LocalContentPreviewNode[] {
  if (!Number.isSafeInteger(staticMenuId)) {
    return [];
  }

  const parentId = `static:${staticMenuId}`;

  return roots.filter(
    node => node.parentId === parentId,
  );
}