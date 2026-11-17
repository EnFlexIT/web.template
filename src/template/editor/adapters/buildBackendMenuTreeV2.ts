import type {
  MenuItem,
} from "@/api/implementation/Dynamic-Content-Api-V2";

export interface BackendMenuTreeNodeV2 extends MenuItem {
  children: BackendMenuTreeNodeV2[];
}

/**
 * Builds a hierarchical editor tree from the backend menu inventory.
 *
 * Preserves backend identifiers and metadata.
 * Does not mutate input, Redux, or backend data.
 */
export function buildBackendMenuTreeV2(
  items: readonly MenuItem[],
): BackendMenuTreeNodeV2[] {
  const nodes = new Map<number, BackendMenuTreeNodeV2>();

  for (const item of items) {
    if (
      !Number.isSafeInteger(item.menuId) ||
      item.menuId <= 0 ||
      !Number.isSafeInteger(item.position) ||
      item.position < 0 ||
      typeof item.caption !== "string" ||
      item.caption.trim().length === 0 ||
      typeof item.isHeadMenu !== "boolean" ||
      nodes.has(item.menuId)
    ) {
      throw new Error("Invalid backend menu inventory");
    }

    if (
      item.parentId != null &&
      (
        !Number.isSafeInteger(item.parentId) ||
        item.parentId <= 0 ||
        item.parentId === item.menuId
      )
    ) {
      throw new Error("Invalid backend menu parent");
    }

    nodes.set(item.menuId, {
      ...item,
      children: [],
    });
  }

  const roots: BackendMenuTreeNodeV2[] = [];

  for (const node of nodes.values()) {
    if (node.parentId == null) {
      roots.push(node);
      continue;
    }

    const parent = nodes.get(node.parentId);

    if (!parent) {
      throw new Error(
        `Missing backend menu parent: ${node.parentId}`,
      );
    }

    parent.children.push(node);
  }

  const visited = new Set<number>();
  const visiting = new Set<number>();

  const sortAndValidate = (
    node: BackendMenuTreeNodeV2,
  ): void => {
    if (visiting.has(node.menuId)) {
      throw new Error("Circular backend menu hierarchy");
    }

    if (visited.has(node.menuId)) {
      return;
    }

    visiting.add(node.menuId);

    node.children.sort(
      (a, b) =>
        a.position - b.position ||
        a.menuId - b.menuId,
    );

    for (const child of node.children) {
      sortAndValidate(child);
    }

    visiting.delete(node.menuId);
    visited.add(node.menuId);
  };

  roots.sort(
    (a, b) =>
      a.position - b.position ||
      a.menuId - b.menuId,
  );

  for (const root of roots) {
    sortAndValidate(root);
  }

  if (visited.size !== nodes.size) {
    throw new Error("Circular backend menu hierarchy");
  }

  return roots;
}
