import type {
  EditorMenuEntry,
} from "./editorTypes";

/**
 * Describes which menu properties may be changed
 * through the editor.
 *
 * These permissions are application-owned and
 * must never be derived from draft input.
 */
export interface MenuEditPermissions {
  allowCaptionChange: boolean;
  allowPositionChange: boolean;
  allowParentChange: boolean;
}

/**
 * Immutable source definition used for validating
 * menu changes.
 */
export interface ProtectedMenuEntry {
  original: Readonly<EditorMenuEntry>;
  permissions: Readonly<MenuEditPermissions>;
}

/**
 * Trusted inventory of all registered static menus.
 *
 * This inventory must be constructed from the active
 * Application navigation configuration.
 *
 * It must not be derived from editor draft input.
 */
export interface TrustedMenuInventory {
  applicationId: string;
  staticMenuIds: readonly string[];
}
