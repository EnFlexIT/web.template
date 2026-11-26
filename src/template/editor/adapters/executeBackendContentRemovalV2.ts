export interface RemovalContentEntry {
  backendContentId: number;
  position: number;
  kind: string;
  editable?: boolean;
}

export interface ExecuteContentRemovalParams {
  elementId: number;
  original: readonly RemovalContentEntry[];
  load: () => Promise<RemovalContentEntry[]>;
  remove: () => Promise<void>;
  isCurrent: () => boolean;
}

export class BackendContentRemovalError extends Error {
  constructor(
    message: string,
    public readonly attemptedWrite: boolean,
  ) {
    super(message);
    this.name = "BackendContentRemovalError";
  }
}

function normalize(
  entries: readonly RemovalContentEntry[],
): RemovalContentEntry[] {
  if (!Array.isArray(entries)) {
    throw new Error("Invalid backend content inventory");
  }

  const ids = new Set<number>();
  const positions = new Set<number>();

  for (const entry of entries) {
    if (
      !entry ||
      !Number.isSafeInteger(entry.backendContentId) ||
      entry.backendContentId <= 0 ||
      !Number.isSafeInteger(entry.position) ||
      entry.position < 0 ||
      ids.has(entry.backendContentId) ||
      positions.has(entry.position)
    ) {
      throw new Error("Ambiguous backend content inventory");
    }

    ids.add(entry.backendContentId);
    positions.add(entry.position);
  }

  return [...entries].sort(
    (a, b) => a.position - b.position,
  );
}

export async function executeBackendContentRemovalV2({
  elementId,
  original,
  load,
  remove,
  isCurrent,
}: ExecuteContentRemovalParams): Promise<RemovalContentEntry[]> {
  let attemptedWrite = false;

  function checkCurrent() {
    if (!isCurrent()) {
      throw new Error("Session changed during content removal");
    }
  }

  try {
    checkCurrent();

    if (
      !Number.isSafeInteger(elementId) ||
      elementId <= 0
    ) {
      throw new Error("Invalid content ID");
    }

    const expected = normalize(original).map(entry => ({
      backendContentId: entry.backendContentId,
      position: entry.position,
    }));

    const latest = normalize(await load());

    checkCurrent();

    if (
      latest.length !== expected.length ||
      latest.some((entry, index) =>
        entry.backendContentId !==
          expected[index].backendContentId ||
        entry.position !== expected[index].position,
      )
    ) {
      throw new Error(
        "Backend content inventory changed before removal",
      );
    }

    const target = latest.find(
      entry => entry.backendContentId === elementId,
    );

    if (
      !target ||
      target.kind !== "text" ||
      target.editable !== true
    ) {
      throw new Error(
        "Content removal is not permitted",
      );
    }

    const remainingIds = latest
      .filter(entry => entry.backendContentId !== elementId)
      .map(entry => entry.backendContentId);

    checkCurrent();

    attemptedWrite = true;

    await remove();

    checkCurrent();

    const verified = normalize(await load());

    checkCurrent();

    if (
      verified.length !== remainingIds.length ||
      verified.some((entry, index) =>
        entry.backendContentId !== remainingIds[index],
      )
    ) {
      throw new Error(
        "Backend content removal could not be verified",
      );
    }

    return verified;
  } catch (error) {
    throw new BackendContentRemovalError(
      error instanceof Error
        ? error.message
        : "Backend content removal failed",
      attemptedWrite,
    );
  }
}
