import AsyncStorage from "@react-native-async-storage/async-storage";

import type {
  EditorDraft,
} from "../model/editorTypes";

export type EditorStorageScope =
  | "preview"
  | "regular";

function getStorageKey(
  applicationId: string,
  scope: EditorStorageScope = "preview",
): string {
  return `content-menu-editor:${scope}:v1:${applicationId}`;
}

/**
 * Persists local development drafts only.
 *
 * This storage is not a backend or publishing mechanism.
 * Loaded data is untrusted until validated.
 */
export async function saveLocalEditorDraft(
  draft: EditorDraft,
  scope: EditorStorageScope = "preview",
): Promise<void> {
  const key = getStorageKey(draft.applicationId, scope);

  await AsyncStorage.setItem(
    key,
    JSON.stringify(draft),
  );
}

export async function loadLocalEditorDraft(
  applicationId: string,
  scope: EditorStorageScope = "preview",
): Promise<unknown | null> {
  const raw = await AsyncStorage.getItem(
    getStorageKey(applicationId, scope),
  );

  if (raw === null) {
    return null;
  }

  return JSON.parse(raw) as unknown;
}

export async function clearLocalEditorDraft(
  applicationId: string,
  scope: EditorStorageScope = "preview",
): Promise<void> {
  await AsyncStorage.removeItem(
    getStorageKey(applicationId, scope),
  );
}
