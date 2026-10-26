import type { EditorMenuEntry } from "../model/editorTypes";
import type { MenuPlacementPolicy } from "../model/menuPlacement";
import type {
  ProtectedMenuEntry,
  TrustedMenuInventory,
} from "../model/menuProtection";

export function getAllowedContentParents(
  entries: readonly EditorMenuEntry[],
  policy: Readonly<MenuPlacementPolicy>,
  protectedEntries: readonly ProtectedMenuEntry[],
  inventory: Readonly<TrustedMenuInventory>,
): EditorMenuEntry[] {
  const byId = new Map(entries.map(entry => [entry.id, entry]));

  const trustedRootIds = new Set(
    policy.allowedContentParentIds.filter(id => {
      const entry = byId.get(id);

      return (
        entry !== undefined &&
        entry.source !== "content" &&
        inventory.staticMenuIds.includes(id) &&
        protectedEntries.some(
          protectedEntry =>
            protectedEntry.original.id === id &&
            protectedEntry.original.source === entry.source,
        )
      );
    }),
  );

  function isAllowedParent(entry: EditorMenuEntry): boolean {
    if (trustedRootIds.has(entry.id)) {
      return true;
    }

    if (
      entry.source !== "content" ||
      entry.contentPageId !== undefined
    ) {
      return false;
    }

    const visited = new Set<string>([entry.id]);
    let parentId = entry.parentId;

    while (parentId && !visited.has(parentId)) {
      if (trustedRootIds.has(parentId)) {
        return true;
      }

      visited.add(parentId);
      const parent = byId.get(parentId);

      if (
        !parent ||
        parent.source !== "content" ||
        parent.contentPageId !== undefined
      ) {
        return false;
      }

      parentId = parent.parentId;
    }

    return false;
  }

  return entries.filter(isAllowedParent);
}