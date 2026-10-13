import type { EditorDraft } from "../model/editorTypes";
import type {
  ProtectedMenuEntry,
  TrustedMenuInventory,
} from "../model/menuProtection";

export type TrustedInventoryErrorCode =
  | "INVENTORY_APPLICATION_MISMATCH"
  | "DUPLICATE_INVENTORY_ID"
  | "DUPLICATE_PROTECTED_ID"
  | "MISSING_PROTECTED_DEFINITION"
  | "UNKNOWN_PROTECTED_DEFINITION"
  | "INVALID_PROTECTED_SOURCE";

export interface TrustedInventoryError {
  code: TrustedInventoryErrorCode;
  entryId?: string;
  message: string;
}

export function validateTrustedMenuInventory(
  draft: EditorDraft,
  protectedEntries: readonly ProtectedMenuEntry[],
  inventory: Readonly<TrustedMenuInventory>,
): TrustedInventoryError[] {
  const errors: TrustedInventoryError[] = [];
  const registeredIds = new Set<string>();
  const protectedIds = new Set<string>();

  if (draft.applicationId !== inventory.applicationId) {
    errors.push({
      code: "INVENTORY_APPLICATION_MISMATCH",
      message: "Draft application does not match trusted inventory.",
    });
  }

  for (const id of inventory.staticMenuIds) {
    if (registeredIds.has(id)) {
      errors.push({
        code: "DUPLICATE_INVENTORY_ID",
        entryId: id,
        message: `Duplicate registered menu ID: ${id}`,
      });
    }

    registeredIds.add(id);
  }

  for (const entry of protectedEntries) {
    const original = entry.original;
    const id = original.id;

    if (protectedIds.has(id)) {
      errors.push({
        code: "DUPLICATE_PROTECTED_ID",
        entryId: id,
        message: `Duplicate protected menu ID: ${id}`,
      });
    }

    protectedIds.add(id);

    if (!registeredIds.has(id)) {
      errors.push({
        code: "UNKNOWN_PROTECTED_DEFINITION",
        entryId: id,
        message: `Protected menu is not registered: ${id}`,
      });
    }

    if (
      original.source !== "template" &&
      original.source !== "application"
    ) {
      errors.push({
        code: "INVALID_PROTECTED_SOURCE",
        entryId: id,
        message: `Protected menu has invalid source: ${id}`,
      });
    }
  }

  for (const id of registeredIds) {
    if (!protectedIds.has(id)) {
      errors.push({
        code: "MISSING_PROTECTED_DEFINITION",
        entryId: id,
        message: `Registered menu lacks protection: ${id}`,
      });
    }
  }

  return errors;
}
