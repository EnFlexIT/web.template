import type {
  MenuItem,
} from "../menuSlice";

type MenuRecord = Record<string, unknown>;

function isRecord(value: unknown): value is MenuRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function readMenuId(
  record: MenuRecord,
  currentKey: string,
  legacyKey: string,
): number | undefined {
  const value = record[currentKey] ?? record[legacyKey];

  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value > 0
  )
    ? value
    : undefined;
}

/**
 * Converts the backend menu response into the
 * internal navigation menu structure.
 *
 * Does not merge or override static Application menus.
 */
export function normalizeBackendMenus(
  response: unknown,
): MenuItem[] {
  const raw = isRecord(response)
    ? (
        response.menuList ??
        response.data ??
        response.items ??
        response.menu
      )
    : response;

  if (!Array.isArray(raw)) {
    return [];
  }

  const result: MenuItem[] = [];
  const seenIds = new Set<number>();

  for (const value of raw) {
    if (!isRecord(value)) continue;

    const menuID = readMenuId(
      value,
      "menuId",
      "menuID",
    );

    if (
      menuID === undefined ||
      seenIds.has(menuID)
    ) {
      continue;
    }

    const parentValue =
      value.parentId ?? value.parentID;

    const parentID =
      parentValue === null ||
      parentValue === undefined
        ? undefined
        : readMenuId(
            value,
            "parentId",
            "parentID",
          );

    if (
      parentValue !== null &&
      parentValue !== undefined &&
      parentID === undefined
    ) {
      continue;
    }

    if (
      parentID === menuID ||
      typeof value.caption !== "string" ||
      value.caption.trim().length === 0 ||
      typeof value.position !== "number" ||
      !Number.isSafeInteger(value.position) ||
      value.position < 0
    ) {
      continue;
    }

    result.push({
      menuID,
      parentID,
      caption: value.caption,
      position: value.position,
      Screen: undefined,
    });

    seenIds.add(menuID);
  }

  return result;
}
