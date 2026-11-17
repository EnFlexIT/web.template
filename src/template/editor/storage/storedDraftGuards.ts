import type {
  EditorContentBlock,
  EditorContentPage,
  EditorMenuEntry,
} from "../model/editorTypes";

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

export function isStoredContentEntry(
  value: unknown,
): value is EditorMenuEntry {
  if (!isRecord(value)) return false;

  return (
    value.source === "content" &&
    typeof value.id === "string" &&
    value.id.trim().length > 0 &&
    typeof value.caption === "string" &&
    typeof value.position === "number" &&
    Number.isSafeInteger(value.position) &&
    value.position >= 0 &&
    typeof value.parentId === "string" &&
    value.parentId.trim().length > 0 &&
    (
      value.contentPageId === undefined ||
      (
        typeof value.contentPageId === "string" &&
        value.contentPageId.trim().length > 0
      )
    ) &&
    (
      value.groupRoles === undefined ||
      (
        Array.isArray(value.groupRoles) &&
        value.groupRoles.every(
          (role: unknown) =>
            typeof role === "string" &&
            role.length > 0 &&
            role.trim() === role,
        ) &&
        new Set(value.groupRoles).size === value.groupRoles.length
      )
    ) &&
    value.menuID === undefined &&
    (
      value.hidden === undefined ||
      typeof value.hidden === "boolean"
    )
  );
}

export function isStoredContentBlock(
  value: unknown,
): value is EditorContentBlock {
  if (!isRecord(value)) return false;

  if (
    typeof value.id !== "string" ||
    value.id.trim().length === 0
  ) {
    return false;
  }

  if (value.type === "text") {
    return typeof value.html === "string";
  }

  if (value.type === "image") {
    return (
      typeof value.assetId === "string" &&
      value.assetId.trim().length > 0 &&
      typeof value.alt === "string"
    );
  }

  return false;
}

export function isStoredContentPage(
  value: unknown,
): value is EditorContentPage {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === "string" &&
    value.id.trim().length > 0 &&
    typeof value.title === "string" &&
    value.title.trim().length > 0 &&
    Array.isArray(value.blocks) &&
    value.blocks.every(isStoredContentBlock)
  );
}
