import type { EditorDraft } from "../model/editorTypes";
import type {
  ProtectedMenuEntry,
  TrustedMenuInventory,
} from "../model/menuProtection";
import type { MenuPlacementPolicy } from "../model/menuPlacement";

import { validateMenuDraft } from "./validateMenuDraft";
import { validateMenuChanges } from "./validateMenuChanges";
import { validateMenuPlacement } from "./validateMenuPlacement";
import { validateTrustedMenuInventory } from "./validateTrustedMenuInventory";

/**
 * Runs all editor draft validation stages.
 *
 * The protected definitions, trusted inventory and
 * placement policy must originate from trusted
 * Application configuration, never from draft input.
 */
export function validateEditorDraft(
  draft: EditorDraft,
  protectedEntries: readonly ProtectedMenuEntry[],
  placementPolicy: Readonly<MenuPlacementPolicy>,
  inventory: Readonly<TrustedMenuInventory>,
) {
  return [
    ...validateMenuDraft(draft),
    ...validateTrustedMenuInventory(
      draft,
      protectedEntries,
      inventory,
    ),
    ...validateMenuChanges(
      protectedEntries,
      draft.entries,
    ),
    ...validateMenuPlacement(
      draft.entries,
      placementPolicy,
    ),
  ];
}
