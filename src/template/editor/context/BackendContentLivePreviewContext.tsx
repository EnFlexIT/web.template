import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useAppSelector } from "@/template/state/store/useAppSelector";

type LiveData = {
  scope: string;
  menuId: number;
  blocks: Record<string, string>;
  newHtml: string | null;
};

type LiveContext = {
  getLiveBlockHtml: (menuId: number, elementId: number) => string | undefined;
  getLiveNewHtml: (menuId: number) => string | null;
  setLiveBlockHtml: (menuId: number, elementId: number, html: string | null) => void;
  setLiveNewHtml: (menuId: number, html: string | null) => void;
  refreshVersion: number;
  requestRefresh: (menuId: number) => void;
  getSelectedBlockId: (menuId: number) => number | null;
  setSelectedBlockId: (menuId: number, elementId: number | null) => void;
  requestDesktopSelection: (menuId: number, elementId: number) => void;
  setDesktopEditorStatus: (
    menuId: number,
    elementId: number,
    dirty: boolean,
    saving: boolean,
  ) => void;
};

const emptyContext: LiveContext = {
  getLiveBlockHtml: () => undefined,
  getLiveNewHtml: () => null,
  setLiveBlockHtml: () => {},
  setLiveNewHtml: () => {},
  refreshVersion: 0,
  requestRefresh: () => {},
  getSelectedBlockId: () => null,
  setSelectedBlockId: () => {},
  requestDesktopSelection: () => {},
  setDesktopEditorStatus: () => {},
};

const BackendLiveContext = createContext<LiveContext>(emptyContext);

/**
 * Ephemeral backend content preview: NEVER persists or performs API calls.
 * It is separate from the working local editor draft and scoped to the
 * logged-in server/session/menu to avoid cross-session content leakage.
 */
export function BackendContentLivePreviewProvider({
  children,
}: {
  children: ReactNode;
}) {
  const scope = useAppSelector(state => [
    state.api.ip,
    state.api.authGeneration,
    state.api.isLoggedIn,
    state.api.isLoggingOut,
    state.api.isSwitchingServer,
  ].join("|"));
  const writableScope = useAppSelector(state =>
    state.api.isLoggedIn &&
    !state.api.isLoggingOut &&
    !state.api.isSwitchingServer &&
    Boolean(state.api.ip.trim()),
  );
  const currentScope = useRef(scope);
  currentScope.current = scope;
  const [live, setLive] = useState<LiveData | null>(null);
  const [refreshVersion, setRefreshVersion] = useState(0);

  const [selection, setSelection] = useState<{
    scope: string;
    menuId: number;
    elementId: number;
  } | null>(null);

  const desktopEditorStatusRef = useRef<{
    scope: string;
    menuId: number;
    elementId: number;
    dirty: boolean;
    saving: boolean;
  } | null>(null);

  const getSelectedBlockId = useCallback(
    (menuId: number): number | null =>
      writableScope &&
      selection?.scope === scope &&
      selection.menuId === menuId
        ? selection.elementId
        : null,
    [scope, writableScope, selection],
  );

  const setSelectedBlockId = useCallback(
    (menuId: number, elementId: number | null) => {
      if (
        !writableScope ||
        currentScope.current !== scope ||
        !Number.isSafeInteger(menuId) ||
        menuId <= 0 ||
        (elementId !== null &&
          (!Number.isSafeInteger(elementId) || elementId <= 0))
      ) {
        return;
      }

      setSelection(previous => {
        if (currentScope.current !== scope) {
          return previous;
        }

        if (elementId === null) {
          return null;
        }

        if (
          previous?.scope === scope &&
          previous.menuId === menuId &&
          previous.elementId === elementId
        ) {
          return previous;
        }

        return { scope, menuId, elementId };
      });
    },
    [scope, writableScope],
  );

  const setDesktopEditorStatus = useCallback(
    (
      menuId: number,
      elementId: number,
      dirty: boolean,
      saving: boolean,
    ) => {
      if (!writableScope || currentScope.current !== scope) {
        return;
      }

      desktopEditorStatusRef.current = {
        scope,
        menuId,
        elementId,
        dirty,
        saving,
      };
    },
    [scope, writableScope],
  );

  const requestDesktopSelection = useCallback(
    (menuId: number, elementId: number) => {
      if (!writableScope || currentScope.current !== scope) {
        return;
      }

      if (
        !Number.isSafeInteger(menuId) ||
        menuId <= 0 ||
        !Number.isSafeInteger(elementId) ||
        elementId <= 0
      ) {
        return;
      }

      const status = desktopEditorStatusRef.current;

      if (
        status?.scope === scope &&
        status.menuId === menuId &&
        status.elementId !== elementId
      ) {
        if (status.saving) {
          return;
        }

        if (status.dirty) {
          if (
            typeof window === "undefined" ||
            typeof window.confirm !== "function" ||
            !window.confirm(
              "Du hast ungespeicherte Textänderungen. " +
              "Möchtest du diese verwerfen und den anderen Text auswählen?",
            )
          ) {
            return;
          }
        }
      }

      desktopEditorStatusRef.current = null;
      setSelectedBlockId(menuId, elementId);
    },
    [scope, writableScope, setSelectedBlockId],
  );

  const requestRefresh = useCallback((menuId: number) => {
    if (
      !writableScope ||
      currentScope.current !== scope ||
      !Number.isSafeInteger(menuId) ||
      menuId <= 0
    ) {
      return;
    }

    setRefreshVersion(version => version + 1);
  }, [scope, writableScope]);

  const setLiveBlockHtml = useCallback<LiveContext["setLiveBlockHtml"]>(
    (menuId, elementId, html) => {
      if (!writableScope || currentScope.current !== scope ||
          !Number.isSafeInteger(menuId) || menuId <= 0 ||
          !Number.isSafeInteger(elementId) || elementId <= 0) return;
      setLive(previous => {
        if (currentScope.current !== scope) return previous;
        if (html === null &&
            (previous?.scope !== scope || previous.menuId !== menuId ||
             !(String(elementId) in previous.blocks))) return previous;
        const base: LiveData = previous?.scope === scope && previous.menuId === menuId
          ? previous
          : { scope, menuId, blocks: {}, newHtml: null };
        const blocks = { ...base.blocks };
        if (html === null) delete blocks[String(elementId)];
        else blocks[String(elementId)] = html;
        return { ...base, blocks };
      });
    },
    [scope, writableScope],
  );

  const setLiveNewHtml = useCallback<LiveContext["setLiveNewHtml"]>(
    (menuId, html) => {
      if (!writableScope || currentScope.current !== scope ||
          !Number.isSafeInteger(menuId) || menuId <= 0) return;
      setLive(previous => {
        if (currentScope.current !== scope) return previous;
        if (html === null &&
            (previous?.scope !== scope || previous.menuId !== menuId ||
             previous.newHtml === null)) return previous;
        const base: LiveData = previous?.scope === scope && previous.menuId === menuId
          ? previous
          : { scope, menuId, blocks: {}, newHtml: null };
        return { ...base, newHtml: html };
      });
    },
    [scope, writableScope],
  );

  const getLiveBlockHtml = useCallback<LiveContext["getLiveBlockHtml"]>(
    (menuId, elementId) =>
      writableScope && live?.scope === scope && live.menuId === menuId
        ? live.blocks[String(elementId)] : undefined,
    [live, scope, writableScope],
  );
  const getLiveNewHtml = useCallback<LiveContext["getLiveNewHtml"]>(
    menuId => writableScope && live?.scope === scope && live.menuId === menuId
      ? live.newHtml : null,
    [live, scope, writableScope],
  );

  return (
    <BackendLiveContext.Provider value={{
      getLiveBlockHtml,
      getLiveNewHtml,
      setLiveBlockHtml,
      setLiveNewHtml,
      refreshVersion,
      requestRefresh,
      getSelectedBlockId,
      setSelectedBlockId,
      requestDesktopSelection,
      setDesktopEditorStatus,
    }}>
      {children}
    </BackendLiveContext.Provider>
  );
}

/** Safe outside the provider for isolated component tests. */
export function useBackendLiveContent(): LiveContext {
  return useContext(BackendLiveContext);
}
