import type {
  EditorStorageScope,
} from "./localEditorDraftStorage";

export interface LocalEditorDraftSavedEvent {
  applicationId: string;
  scope: EditorStorageScope;
}

type Listener = (
  event: LocalEditorDraftSavedEvent,
) => void;

const listeners = new Set<Listener>();

/**
 * In-memory notification after successful local persistence.
 *
 * Does not read, write or remove stored drafts.
 * Does not communicate with the backend.
 */
export function subscribeLocalEditorDraftSaved(
  listener: Listener,
): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function notifyLocalEditorDraftSaved(
  event: LocalEditorDraftSavedEvent,
): void {
  for (const listener of Array.from(listeners)) {
    try {
      listener(event);
    } catch {
      // A failed listener must not turn a successful
      // persistence operation into a save failure.
    }
  }
}