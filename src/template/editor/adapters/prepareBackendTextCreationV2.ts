export interface BackendTextCreationDraftV2 {
  menuId: number;
  position: number;
  html: string;
}

/**
 * Validates a new HTML text draft before an API request is built.
 * Does not create backend content or generate content IDs.
 */
export function prepareBackendTextCreationV2(
  draft: BackendTextCreationDraftV2,
): BackendTextCreationDraftV2 {
  if (
    !Number.isSafeInteger(draft.menuId) ||
    draft.menuId <= 0
  ) {
    throw new Error("Invalid backend menu ID");
  }

  if (
    !Number.isSafeInteger(draft.position) ||
    draft.position < 1
  ) {
    throw new Error("Invalid content position");
  }

  if (
    typeof draft.html !== "string" ||
    draft.html.trim().length === 0
  ) {
    throw new Error("HTML content must not be empty");
  }

  return {
    menuId: draft.menuId,
    position: draft.position,
    html: draft.html.trim(),
  };
}