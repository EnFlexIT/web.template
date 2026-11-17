import type {
  LocalContentPreviewNode,
} from "../adapters/buildLocalContentPreview";

/**
 * Builds the visible local-content navigation tree.
 *
 * Hidden nodes and their descendants are excluded.
 * The original editor tree remains unchanged.
 */
export function filterVisibleLocalContent(
  nodes: readonly LocalContentPreviewNode[],
): LocalContentPreviewNode[] {
  return nodes
    .filter(node => node.hidden !== true)
    .map(node => ({
      ...node,
      children: filterVisibleLocalContent(node.children),
    }));
}