/**
 * Describes the origin of a menu entry.
 *
 * Application and Template entries are registered
 * outside the content editor.
 */
export type EditorMenuSource =
  | "template"
  | "application"
  | "content";

/**
 * Defines the editable properties of a menu entry.
 *
 * Technical screen registrations and authorization
 * rules are intentionally excluded.
 */
export interface EditorMenuEntry {
  id: string;
  source: EditorMenuSource;

  menuID?: number;
  parentId?: string;

  caption: string;
  position: number;

  contentPageId?: string;
}

/**
 * Supported content blocks for the first MVP.
 */
export type EditorContentBlock =
  | {
      id: string;
      type: "text";
      html: string;
    }
  | {
      id: string;
      type: "image";
      assetId: string;
      alt: string;
    };

/**
 * Represents a content page owned by the editor.
 */
export interface EditorContentPage {
  id: string;
  title: string;
  blocks: EditorContentBlock[];
}

/**
 * Holds unpublished changes independently
 * from the active application navigation.
 */
export interface EditorDraft {
  schemaVersion: 1;
  applicationId: string;

  entries: EditorMenuEntry[];
  pages: EditorContentPage[];
}
