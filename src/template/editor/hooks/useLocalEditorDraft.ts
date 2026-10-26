import { useCallback, useEffect, useRef, useState } from "react";
import { useStore } from "react-redux";
import { useAppSelector } from "@/template/state/store/useAppSelector";
import {
  selectIsLoggedIn,
  selectIsLoggingOut,
} from "@/template/state/api/apiSlice";
import { selectEffectiveRoles } from "@/template/state/authorization/authorizationSlice";
import type { TemplateRootState } from "@/template/state/store/templateStoreTypes";
import { canEditLocalContent } from "../authorization/canEditLocalContent";
import type { EditorStorageScope } from "../storage/localEditorDraftStorage";

import type { EditorDraft } from "../model/editorTypes";
import type {
  ProtectedMenuEntry,
  TrustedMenuInventory,
} from "../model/menuProtection";
import type { MenuPlacementPolicy } from "../model/menuPlacement";

import {
  loadLocalEditorDraft,
  saveLocalEditorDraft,
} from "../storage/localEditorDraftStorage";

import {
  restoreLocalEditorDraft,
} from "../storage/restoreLocalEditorDraft";

import {
  notifyLocalEditorDraftSaved,
} from "../storage/localEditorDraftEvents";
import {
  enqueueLocalEditorDraftOperation,
} from "../storage/localEditorDraftWriteQueue";

export type LocalDraftStatus =
  | "loading"
  | "ready"
  | "saving"
  | "error";

interface Options {
  initialDraft: EditorDraft;
  protectedEntries: readonly ProtectedMenuEntry[];
  placementPolicy: Readonly<MenuPlacementPolicy>;
  inventory: Readonly<TrustedMenuInventory>;
  storageScope?: EditorStorageScope;
}

function cloneDraft(draft: EditorDraft): EditorDraft {
  return {
    ...draft,
    entries: draft.entries.map(entry => ({ ...entry })),
    pages: draft.pages.map(page => ({
      ...page,
      blocks: page.blocks.map(block => ({ ...block })),
    })),
  };
}

/**
 * Local development-preview persistence.
 * No backend writes or production navigation changes.
 */
export function useLocalEditorDraft({
  initialDraft,
  protectedEntries,
  placementPolicy,
  inventory,
  storageScope = "preview",
}: Options) {
  const store = useStore();
  const effectiveRoles = useAppSelector(selectEffectiveRoles);
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const isLoggingOut = useAppSelector(selectIsLoggingOut);

  const sessionAllowed = isLoggedIn && !isLoggingOut;
  const canEdit =
    sessionAllowed && canEditLocalContent(effectiveRoles);

  const sessionRef = useRef({
    allowed: sessionAllowed,
    generation: 0,
  });

  if (sessionRef.current.allowed !== sessionAllowed) {
    sessionRef.current = {
      allowed: sessionAllowed,
      generation: sessionRef.current.generation + 1,
    };
  }

  const generation = sessionRef.current.generation;

  const canWriteInSession = useCallback((): boolean => {
    const state = store.getState() as TemplateRootState;

    return (
      sessionRef.current.allowed &&
      sessionRef.current.generation === generation &&
      selectIsLoggedIn(state) &&
      !selectIsLoggingOut(state) &&
      canEditLocalContent(selectEffectiveRoles(state))
    );
  }, [generation, store]);

  const [draft, setDraft] = useState<EditorDraft>(
    () => cloneDraft(initialDraft),
  );

  const guardedSetDraft = useCallback<typeof setDraft>(
    value => {
      if (!canWriteInSession()) {
        return;
      }

      setDraft(previous => {
        if (!canWriteInSession()) {
          return previous;
        }

        return typeof value === "function"
          ? value(previous)
          : value;
      });
    },
    [canWriteInSession],
  );

  const [status, setStatus] =
    useState<LocalDraftStatus>("loading");

  const [storageError, setStorageError] = useState("");

  const [loaded, setLoaded] = useState(false);

  const saveQueue = useRef<Promise<void>>(
    Promise.resolve(),
  );

  const lastSavedDraft = useRef<EditorDraft | null>(null);
  const retryInProgress = useRef(false);

  useEffect(() => {
    let cancelled = false;

    if (!sessionAllowed) {
      setDraft(cloneDraft(initialDraft));
      setLoaded(false);
      setStatus("loading");
      setStorageError("");
      lastSavedDraft.current = null;

      return () => {
        cancelled = true;
      };
    }

    setLoaded(false);
    setStatus("loading");

    async function load() {
      try {
        const stored = await loadLocalEditorDraft(
          initialDraft.applicationId,
          storageScope,
        );

        if (cancelled || !canWriteInSession()) return;

        let nextDraft = cloneDraft(initialDraft);

        if (stored !== null) {
          const restored = restoreLocalEditorDraft(
            stored,
            initialDraft,
            protectedEntries,
            placementPolicy,
            inventory,
          );

          if (restored === null) {
            setStorageError(
              "Gespeicherter Entwurf ist ungültig. " +
              "Er wird nicht überschrieben.",
            );
            setStatus("error");
            return;
          }

          nextDraft = restored;
        }

        // Prevent the initial draft from being saved
        // over an existing restored draft.
        lastSavedDraft.current = nextDraft;
        setDraft(nextDraft);
        setLoaded(true);
        setStatus("ready");
      } catch {
        if (cancelled || !canWriteInSession()) return;

        setStorageError(
          "Lokaler Entwurf konnte nicht geladen werden. " +
          "Er wird nicht überschrieben.",
        );
        setStatus("error");
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [
    initialDraft,
    protectedEntries,
    placementPolicy,
    inventory,
    storageScope,
    sessionAllowed,
    generation,
  ]);

  useEffect(() => {
    if (!loaded || status === "error" || !canEdit) {
      return;
    }

    if (draft === lastSavedDraft.current) {
      return;
    }

    const snapshot = cloneDraft(draft);
    lastSavedDraft.current = draft;

    setStatus("saving");

    const nextSave = saveQueue.current.then(() =>
      enqueueLocalEditorDraftOperation(
        snapshot.applicationId,
        storageScope,
        async () => {
          if (!canWriteInSession()) {
            return;
          }

          await saveLocalEditorDraft(snapshot, storageScope);

          notifyLocalEditorDraftSaved({
            applicationId: snapshot.applicationId,
            scope: storageScope,
          });
        },
      ),
    );

    saveQueue.current = nextSave;

    let cancelled = false;

    void nextSave.then(
      () => {
        if (!cancelled) {
          setStatus("ready");
        }
      },
      () => {
        if (!cancelled) {
          setStorageError(
            "Lokaler Entwurf konnte nicht gespeichert werden. " +
            "Bitte die Seite nicht neu laden.",
          );
          setStatus("error");
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [draft, loaded, canEdit, store]);

  async function retrySave(): Promise<void> {
    if (
      !loaded ||
      status !== "error" ||
      !canEdit ||
      retryInProgress.current
    ) {
      return;
    }

    retryInProgress.current = true;
    const retryGeneration = generation;
    setStatus("saving");
    setStorageError("");

    const isCurrentRetry = () => {
      const state = store.getState() as TemplateRootState;

      return (
        sessionRef.current.allowed &&
        sessionRef.current.generation === retryGeneration &&
        selectIsLoggedIn(state) &&
        !selectIsLoggingOut(state)
      );
    };

    try {
      // Wait for previously queued writes to settle.
      // Never restart those operations implicitly.
      await saveQueue.current.catch(() => undefined);

      if (!canWriteInSession()) {
        throw new Error("Editing permission no longer available.");
      }

      const snapshot = cloneDraft(draft);

      const nextSave = enqueueLocalEditorDraftOperation(
        snapshot.applicationId,
        storageScope,
        async () => {
          if (!canWriteInSession()) {
            throw new Error("Editing permission no longer available.");
          }

          await saveLocalEditorDraft(snapshot, storageScope);

          notifyLocalEditorDraftSaved({
            applicationId: snapshot.applicationId,
            scope: storageScope,
          });
        },
      );

      saveQueue.current = nextSave;
      await nextSave;

      if (!isCurrentRetry()) {
        return;
      }

      lastSavedDraft.current = draft;
      setStatus("ready");
    } catch {
      if (!isCurrentRetry()) {
        return;
      }

      setStorageError(
        "Lokaler Entwurf konnte nicht gespeichert werden. " +
        "Änderungen nicht neu laden. Erneut speichern versuchen.",
      );
      setStatus("error");
    } finally {
      retryInProgress.current = false;
    }
  }
  return {
    draft: sessionAllowed ? draft : cloneDraft(initialDraft),
    setDraft: guardedSetDraft,
    status,
    storageError,
    canRetrySave: loaded && status === "error" && canEdit,
    retrySave,
  };
}
