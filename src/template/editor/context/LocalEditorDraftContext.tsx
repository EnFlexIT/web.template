import React, {
  createContext,
  useContext,
  type ReactNode,
} from "react";

import { useLocalEditorDraft } from "../hooks/useLocalEditorDraft";

type DraftOptions = Parameters<typeof useLocalEditorDraft>[0];
type DraftState = ReturnType<typeof useLocalEditorDraft>;

const LocalEditorDraftContext =
  createContext<DraftState | null>(null);

/**
 * Shares a single local draft instance between editor surfaces.
 *
 * Must only be mounted once for a given application and
 * storage scope. Does not publish or write to the backend.
 */
export function LocalEditorDraftProvider({
  children,
  ...options
}: DraftOptions & { children: ReactNode }) {
  const state = useLocalEditorDraft(options);

  return (
    <LocalEditorDraftContext.Provider value={state}>
      {children}
    </LocalEditorDraftContext.Provider>
  );
}

export function useSharedLocalEditorDraft(): DraftState {
  const state = useContext(LocalEditorDraftContext);

  if (state === null) {
    throw new Error(
      "useSharedLocalEditorDraft requires LocalEditorDraftProvider",
    );
  }

  return state;
}
/**
 * Returns a shared draft when a provider is mounted.
 * Otherwise returns null without creating a draft.
 */
export function useOptionalSharedLocalEditorDraft(): DraftState | null {
  return useContext(LocalEditorDraftContext);
}