import type {
  EditorMenuEntry,
} from "../model/editorTypes";

import type {
  ProtectedMenuEntry,
} from "../model/menuProtection";

export type MenuChangeErrorCode =
  | "PROTECTED_MENU_REMOVED"
  | "PROTECTED_MENU_SOURCE_CHANGED"
  | "PROTECTED_MENU_ID_CHANGED"
  | "PROTECTED_MENU_CAPTION_CHANGED"
  | "PROTECTED_MENU_POSITION_CHANGED"
  | "PROTECTED_MENU_PARENT_CHANGED"
  | "PROTECTED_MENU_CONTENT_CHANGED"
  | "UNREGISTERED_STATIC_MENU";

export interface MenuChangeError {
  code: MenuChangeErrorCode;
  entryId: string;
  message: string;
}

/**
 * Validates changes against trusted menu definitions.
 *
 * The protected entries must be supplied by the
 * Application, never by editable draft data.
 */
export function validateMenuChanges(
  protectedEntries: readonly ProtectedMenuEntry[],
  draftEntries: readonly EditorMenuEntry[],
): MenuChangeError[] {
  const errors: MenuChangeError[] = [];

  const protectedById = new Map(
    protectedEntries.map((entry) => [
      entry.original.id,
      entry,
    ]),
  );

  const draftById = new Map(
    draftEntries.map((entry) => [
      entry.id,
      entry,
    ]),
  );

  for (const protectedEntry of protectedEntries) {
    const original = protectedEntry.original;
    const current = draftById.get(original.id);

    if (!current) {
      errors.push({
        code: "PROTECTED_MENU_REMOVED",
        entryId: original.id,
        message: `Protected menu removed: ${original.id}`,
      });
      continue;
    }

    if (current.source !== original.source) {
      errors.push({
        code: "PROTECTED_MENU_SOURCE_CHANGED",
        entryId: original.id,
        message: `Menu source changed: ${original.id}`,
      });
    }

    if (current.menuID !== original.menuID) {
      errors.push({
        code: "PROTECTED_MENU_ID_CHANGED",
        entryId: original.id,
        message: `Numeric menu ID changed: ${original.id}`,
      });
    }

    if (
      current.caption !== original.caption &&
      !protectedEntry.permissions.allowCaptionChange
    ) {
      errors.push({
        code: "PROTECTED_MENU_CAPTION_CHANGED",
        entryId: original.id,
        message: `Caption change not allowed: ${original.id}`,
      });
    }

    if (
      current.position !== original.position &&
      !protectedEntry.permissions.allowPositionChange
    ) {
      errors.push({
        code: "PROTECTED_MENU_POSITION_CHANGED",
        entryId: original.id,
        message: `Position change not allowed: ${original.id}`,
      });
    }

    if (current.parentId !== original.parentId) {
      errors.push({
        code: "PROTECTED_MENU_PARENT_CHANGED",
        entryId: original.id,
        message: `Parent change not allowed: ${original.id}`,
      });
    }

    if (current.contentPageId !== original.contentPageId) {
      errors.push({
        code: "PROTECTED_MENU_CONTENT_CHANGED",
        entryId: original.id,
        message: `Content reference changed: ${original.id}`,
      });
    }
  }

  for (const entry of draftEntries) {
    if (
      entry.source !== "content" &&
      !protectedById.has(entry.id)
    ) {
      errors.push({
        code: "UNREGISTERED_STATIC_MENU",
        entryId: entry.id,
        message: `Unregistered static menu: ${entry.id}`,
      });
    }
  }

  return errors;
}

