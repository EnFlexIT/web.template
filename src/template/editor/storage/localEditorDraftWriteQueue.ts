import type {
  EditorStorageScope,
} from "./localEditorDraftStorage";

const queues = new Map<string, Promise<void>>();

function getQueueKey(
  applicationId: string,
  scope: EditorStorageScope,
): string {
  return `${scope}:${applicationId}`;
}

/**
 * Serializes local draft operations for the same
 * application and storage scope within this JS runtime.
 *
 * Does not provide cross-tab locking.
 * Does not write to storage by itself.
 */
export function enqueueLocalEditorDraftOperation<T>(
  applicationId: string,
  scope: EditorStorageScope,
  operation: () => Promise<T>,
): Promise<T> {
  const key = getQueueKey(applicationId, scope);

  const previous = queues.get(key) ?? Promise.resolve();

  const result = previous
    .catch(() => undefined)
    .then(operation);

  const settled = result.then(
    () => undefined,
    () => undefined,
  );

  queues.set(key, settled);

  void settled.then(() => {
    if (queues.get(key) === settled) {
      queues.delete(key);
    }
  });

  return result;
}