import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useAppDispatch } from "@/template/state/store/useAppDispatch";
import { useAppSelector } from "@/template/state/store/useAppSelector";
import {
  closeDeveloperConsole,
  selectDeveloperConsole,
  toggleDeveloperConsole,
} from "@/template/state/developer-tools/developerConsoleSlice";

export type LocalEditorPanelRequest =
  | {
      kind: "create";
      parentId: string;
      mode: "folder" | "page";
    }
  | {
      kind: "manage";
      entryId: string;
      action: "rename" | "move" | "delete" | "open";
    };

type PendingAction =
  | { kind: "close" }
  | { kind: "open"; next: LocalEditorPanelRequest }
  | { kind: "console" };

type LocalEditorPanelContextValue = {
  request: LocalEditorPanelRequest | null;
  unsavedChanges: boolean;
  confirmationPending: boolean;
  setUnsavedChanges: (value: boolean) => void;
  openPanel: (request: LocalEditorPanelRequest) => void;
  closePanel: () => void;
  toggleConsoleFromFooter: () => void;
  cancelPendingAction: () => void;
  confirmDiscardAndContinue: () => void;
};

const LocalEditorPanelContext =
  createContext<LocalEditorPanelContextValue | null>(null);

export function LocalContentEditorPanelProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [request, setRequest] =
    useState<LocalEditorPanelRequest | null>(null);

  const [unsavedChanges, setUnsavedChanges] =
    useState(false);

  const [pendingAction, setPendingAction] =
    useState<PendingAction | null>(null);

  const dispatch = useAppDispatch();

  const { isOpen: isConsoleOpen } =
    useAppSelector(selectDeveloperConsole);

  const openPanel = useCallback(
    (next: LocalEditorPanelRequest) => {
      if (request && unsavedChanges) {
        setPendingAction({ kind: "open", next });
        return;
      }

      setPendingAction(null);
      dispatch(closeDeveloperConsole());
      setRequest(next);
    },
    [request, unsavedChanges, dispatch],
  );

  const closePanel = useCallback(() => {
    if (request && unsavedChanges) {
      setPendingAction({ kind: "close" });
      return;
    }

    setPendingAction(null);
    setRequest(null);
  }, [request, unsavedChanges]);

  const toggleConsoleFromFooter = useCallback(() => {
    if (request && unsavedChanges && !isConsoleOpen) {
      setPendingAction({ kind: "console" });
      return;
    }

    setPendingAction(null);
    dispatch(toggleDeveloperConsole());
  }, [request, unsavedChanges, isConsoleOpen, dispatch]);

  const cancelPendingAction = useCallback(() => {
    setPendingAction(null);
  }, []);

  const confirmDiscardAndContinue = useCallback(() => {
    if (!pendingAction) return;

    setUnsavedChanges(false);
    setPendingAction(null);

    if (pendingAction.kind === "close") {
      setRequest(null);
      return;
    }

    if (pendingAction.kind === "open") {
      dispatch(closeDeveloperConsole());
      setRequest(pendingAction.next);
      return;
    }

    setRequest(null);
    dispatch(toggleDeveloperConsole());
  }, [pendingAction, dispatch]);

  // Defensive fallback for console actions outside the footer.
  useEffect(() => {
    if (!isConsoleOpen || !request) return;

    if (unsavedChanges) {
      dispatch(closeDeveloperConsole());
      setPendingAction({ kind: "console" });
      return;
    }

    setRequest(null);
  }, [isConsoleOpen, request, unsavedChanges, dispatch]);

  const value = useMemo(
    () => ({
      request,
      unsavedChanges,
      confirmationPending: pendingAction !== null,
      setUnsavedChanges,
      openPanel,
      closePanel,
      toggleConsoleFromFooter,
      cancelPendingAction,
      confirmDiscardAndContinue,
    }),
    [
      request,
      unsavedChanges,
      pendingAction,
      openPanel,
      closePanel,
      toggleConsoleFromFooter,
      cancelPendingAction,
      confirmDiscardAndContinue,
    ],
  );

  return (
    <LocalEditorPanelContext.Provider value={value}>
      {children}
    </LocalEditorPanelContext.Provider>
  );
}

export function useLocalContentEditorPanel() {
  const context = useContext(LocalEditorPanelContext);

  if (!context) {
    throw new Error(
      "LocalContentEditorPanelProvider is missing.",
    );
  }

  return context;
}