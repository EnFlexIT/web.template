import type {
  StaticMenuItem,
} from "@/template/navigation/menu/types";

import type {
  EditorMenuEntry,
} from "../model/editorTypes";

import type {
  ProtectedMenuEntry,
  TrustedMenuInventory,
} from "../model/menuProtection";

export interface StaticMenuSnapshot {
  entries: EditorMenuEntry[];
  protectedEntries: ProtectedMenuEntry[];
  inventory: TrustedMenuInventory;
}

/**
 * Creates a detached, read-only editor representation
 * of the registered static navigation.
 *
 * React Screens are intentionally excluded.
 */
export function createStaticMenuSnapshot(
  applicationId: string,
  items: readonly StaticMenuItem[],
): StaticMenuSnapshot {
  const entries: EditorMenuEntry[] = items.map(
    (item) => ({
      id: `static:${item.menuID}`,
      source: "application",
      menuID: item.menuID,
      parentId:
        item.parentID === undefined
          ? undefined
          : `static:${item.parentID}`,
      caption: item.caption,
      position: item.position ?? 0,
    }),
  );

  const protectedEntries: ProtectedMenuEntry[] =
    entries.map((entry) => ({
      original: { ...entry },
      permissions: {
        allowCaptionChange: false,
        allowPositionChange: false,
        allowParentChange: false,
      },
    }));

  const inventory: TrustedMenuInventory = {
    applicationId,
    staticMenuIds: entries.map(
      (entry) => entry.id,
    ),
  };

  return {
    entries,
    protectedEntries,
    inventory,
  };
}
