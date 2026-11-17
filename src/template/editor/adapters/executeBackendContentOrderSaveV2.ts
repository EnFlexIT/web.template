import type {
  UpdateContentAssignmentRequest,
} from "@/api/implementation/Dynamic-Content-Api-V2";

import {
  planBackendContentOrderSaveV2,
} from "./planBackendContentOrderSaveV2";

export interface BackendOrderEntry {
  backendContentId: number;
  position: number;
}

export interface ExecuteBackendContentOrderSaveParams {
  menuId: number;
  original: readonly BackendOrderEntry[];
  desiredIds: readonly number[];
  load: () => Promise<BackendOrderEntry[]>;
  move: (request: UpdateContentAssignmentRequest) => Promise<void>;
  isCurrent: () => boolean;
}

export class BackendOrderSaveError extends Error {
  constructor(
    message: string,
    public readonly attemptedWrites: number,
  ) {
    super(message);
    this.name = "BackendOrderSaveError";
  }
}

function orderedIds(
  entries: readonly BackendOrderEntry[],
): number[] {
  const ids = new Set<number>();
  const positions = new Set<number>();

  for (const entry of entries) {
    if (
      !Number.isSafeInteger(entry.backendContentId) ||
      entry.backendContentId <= 0 ||
      !Number.isSafeInteger(entry.position) ||
      entry.position < 0 ||
      ids.has(entry.backendContentId) ||
      positions.has(entry.position)
    ) {
      throw new Error("Ambiguous backend content order");
    }

    ids.add(entry.backendContentId);
    positions.add(entry.position);
  }

  return [...entries]
    .sort((a, b) => a.position - b.position)
    .map(entry => entry.backendContentId);
}

/**
 * Performs a checked, sequential backend reorder.
 * Not atomic: an already accepted operation cannot be rolled back here.
 */
export async function executeBackendContentOrderSaveV2({
  menuId,
  original,
  desiredIds,
  load,
  move,
  isCurrent,
}: ExecuteBackendContentOrderSaveParams): Promise<BackendOrderEntry[]> {
  let attemptedWrites = 0;

  const checkSession = () => {
    if (!isCurrent()) {
      throw new BackendOrderSaveError(
        "Session changed during content reorder",
        attemptedWrites,
      );
    }
  };

  try {
    checkSession();

    const originalIds = orderedIds(original);
    const latest = await load();

    checkSession();

    const latestSorted = [...latest].sort(
      (a, b) => a.position - b.position,
    );

    const originalSorted = [...original].sort(
      (a, b) => a.position - b.position,
    );

    const latestIds = orderedIds(latestSorted);

    // Keine fremden Änderungen überschreiben.
    if (
      latestIds.length !== originalIds.length ||
      latestIds.some((id, index) => id !== originalIds[index]) ||
      latestSorted.some(
        (entry, index) =>
          entry.position !== originalSorted[index].position,
      )
    ) {
      throw new Error("Backend content order changed before save");
    }

    // Identität und Vollständigkeit aller IDs validieren.
    planBackendContentOrderSaveV2(
      menuId,
      latestIds,
      desiredIds,
    );

    let currentIds = [...latestIds];
    let currentEntries = [...latest];

    // Jede bestätigte Verschiebung erweitert den korrekten Präfix.
    for (let targetIndex = 0; targetIndex < desiredIds.length; targetIndex++) {
      if (currentIds[targetIndex] === desiredIds[targetIndex]) {
        continue;
      }

      checkSession();

      const elementId = desiredIds[targetIndex];

      if (!currentIds.includes(elementId)) {
        throw new Error("Content element disappeared during reorder");
      }

      const request: UpdateContentAssignmentRequest = {
        elementId,
        sourceMenuId: menuId,
        targetMenuId: menuId,
        position: targetIndex + 1,
      };

      // Bereits eine gestartete Anfrage kann serverseitig wirksam sein.
      attemptedWrites += 1;

      await move(request);

      checkSession();

      // Nach JEDER Verschiebung den tatsächlichen Zustand laden.
      currentEntries = await load();

      checkSession();

      currentIds = orderedIds(currentEntries);

      if (
        currentIds.length !== desiredIds.length ||
        currentIds.some(id => !desiredIds.includes(id))
      ) {
        throw new Error("Backend content inventory changed during save");
      }

      // Bereits bestätigte Positionen dürfen nicht verloren gehen.
      for (let index = 0; index <= targetIndex; index++) {
        if (currentIds[index] !== desiredIds[index]) {
          throw new Error(
            "Backend did not apply the expected content position",
          );
        }
      }
    }

    checkSession();

    if (
      currentIds.length !== desiredIds.length ||
      currentIds.some((id, index) => id !== desiredIds[index])
    ) {
      throw new Error("Backend order verification failed");
    }

    return currentEntries;
  } catch (error) {
    if (error instanceof BackendOrderSaveError) {
      throw error;
    }

    throw new BackendOrderSaveError(
      error instanceof Error
        ? error.message
        : "Backend reorder failed",
      attemptedWrites,
    );
  }
}
