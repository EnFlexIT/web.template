import type {
  EditorDraft,
  EditorMenuEntry,
} from "../model/editorTypes";

export interface MenuValidationError {
  code:
    | "INVALID_APPLICATION_ID"
    | "INVALID_SCHEMA_VERSION"
    | "DUPLICATE_MENU_ID"
    | "DUPLICATE_NUMERIC_ID"
    | "INVALID_MENU_ID"
    | "INVALID_CAPTION"
    | "INVALID_POSITION"
    | "MISSING_PARENT"
    | "CYCLIC_PARENT"
    | "MISSING_CONTENT_PAGE"
    | "INVALID_CONTENT_REFERENCE"
    | "DUPLICATE_CONTENT_PAGE_ID"
    | "INVALID_PAGE_TITLE";
  entryId?: string;
  message: string;
}

export function validateMenuDraft(
  draft: EditorDraft,
): MenuValidationError[] {
  const errors: MenuValidationError[] = [];
  const entriesById = new Map<string, EditorMenuEntry>();
  const numericIds = new Set<number>();
  const pagesById = new Set<string>();

  if (draft.schemaVersion !== 1) {
    errors.push({
      code: "INVALID_SCHEMA_VERSION",
      message: "Unsupported editor draft schema version.",
    });
  }

  if (!draft.applicationId.trim()) {
    errors.push({
      code: "INVALID_APPLICATION_ID",
      message: "Application ID must not be empty.",
    });
  }

  for (const page of draft.pages) {
    if (pagesById.has(page.id)) {
      errors.push({
        code: "DUPLICATE_CONTENT_PAGE_ID",
        entryId: page.id,
        message: `Duplicate content page ID: ${page.id}`,
      });
    }

    pagesById.add(page.id);

    if (!page.title.trim()) {
      errors.push({
        code: "INVALID_PAGE_TITLE",
        entryId: page.id,
        message: `Content page title must not be empty: ${page.id}`,
      });
    }
  }

  for (const entry of draft.entries) {
    if (!entry.caption.trim()) {
      errors.push({
        code: "INVALID_CAPTION",
        entryId: entry.id,
        message: `Menu caption must not be empty: ${entry.id}`,
      });
    }

    if (
      !Number.isSafeInteger(entry.position) ||
      entry.position < 0
    ) {
      errors.push({
        code: "INVALID_POSITION",
        entryId: entry.id,
        message: `Invalid menu position: ${entry.id}`,
      });
    }

    if (!entry.id.trim()) {
      errors.push({
        code: "INVALID_MENU_ID",
        entryId: entry.id,
        message: "Menu ID must not be empty.",
      });
      continue;
    }

    if (entriesById.has(entry.id)) {
      errors.push({
        code: "DUPLICATE_MENU_ID",
        entryId: entry.id,
        message: `Duplicate menu ID: ${entry.id}`,
      });
    } else {
      entriesById.set(entry.id, entry);
    }

    if (entry.menuID !== undefined) {
      if (!Number.isSafeInteger(entry.menuID) || entry.menuID <= 0) {
        errors.push({
          code: "INVALID_MENU_ID",
          entryId: entry.id,
          message: `Invalid numeric menu ID: ${entry.menuID}`,
        });
      } else if (numericIds.has(entry.menuID)) {
        errors.push({
          code: "DUPLICATE_NUMERIC_ID",
          entryId: entry.id,
          message: `Duplicate numeric menu ID: ${entry.menuID}`,
        });
      } else {
        numericIds.add(entry.menuID);
      }
    }

    if (entry.source === "content") {
      if (!entry.contentPageId || !pagesById.has(entry.contentPageId)) {
        errors.push({
          code: "MISSING_CONTENT_PAGE",
          entryId: entry.id,
          message: `Content page is missing for menu: ${entry.id}`,
        });
      }
    } else if (entry.contentPageId !== undefined) {
      errors.push({
        code: "INVALID_CONTENT_REFERENCE",
        entryId: entry.id,
        message: `Non-content menu must not reference a content page: ${entry.id}`,
      });
    }
  }

  for (const entry of draft.entries) {
    if (!entry.id.trim() || entriesById.get(entry.id) !== entry) {
      continue;
    }

    if (entry.parentId && !entriesById.has(entry.parentId)) {
      errors.push({
        code: "MISSING_PARENT",
        entryId: entry.id,
        message: `Parent menu does not exist: ${entry.parentId}`,
      });
      continue;
    }

    const visited = new Set<string>();
    let current: EditorMenuEntry | undefined = entry;

    while (current) {
      if (visited.has(current.id)) {
        errors.push({
          code: "CYCLIC_PARENT",
          entryId: entry.id,
          message: `Cyclic menu relationship detected: ${entry.id}`,
        });
        break;
      }

      visited.add(current.id);
      current = current.parentId
        ? entriesById.get(current.parentId)
        : undefined;
    }
  }

  return errors;
}
