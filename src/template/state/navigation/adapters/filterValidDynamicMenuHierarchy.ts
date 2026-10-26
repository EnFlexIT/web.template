import type {
  MenuItem,
} from "../menuSlice";

/**
 * Keeps only dynamic menu entries whose complete
 * parent chain resolves to a valid root.
 *
 * Static menu IDs are trusted and take precedence.
 */
export function filterValidDynamicMenuHierarchy(
  dynamicItems: readonly MenuItem[],
  staticItems: readonly MenuItem[],
): MenuItem[] {
  const staticIds = new Set(
    staticItems.map(item => item.menuID),
  );

  const dynamicById = new Map(
    dynamicItems
      .filter(item => !staticIds.has(item.menuID))
      .map(item => [item.menuID, item]),
  );

  const valid = new Set<number>();
  const invalid = new Set<number>();
  const visiting = new Set<number>();

  function isValid(id: number): boolean {
    if (staticIds.has(id)) {
      return true;
    }

    if (valid.has(id)) {
      return true;
    }

    if (invalid.has(id) || visiting.has(id)) {
      return false;
    }

    const item = dynamicById.get(id);

    if (!item) {
      return false;
    }

    visiting.add(id);

    const parentId = item.parentID;

    const result =
      parentId === undefined
        ? true
        : isValid(parentId);

    visiting.delete(id);

    if (result) {
      valid.add(id);
    } else {
      invalid.add(id);
    }

    return result;
  }

  return dynamicItems.filter(
    item =>
      !staticIds.has(item.menuID) &&
      isValid(item.menuID),
  );
}
