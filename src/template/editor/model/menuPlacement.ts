/**
 * Defines where editable content menus may be placed.
 *
 * The policy must come from trusted Application
 * configuration, never from editor draft data.
 */
export interface MenuPlacementPolicy {
  allowedContentParentIds: readonly string[];
}
