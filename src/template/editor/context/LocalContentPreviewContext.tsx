import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  useLocalContentPagePreview,
  type LocalContentPagePreview,
} from "../hooks/useLocalContentPagePreview";

import {
  selectIsLoggedIn,
  selectIsLoggingOut,
} from "@/template/state/api/apiSlice";
import { useAppSelector } from "@/template/state/store/useAppSelector";

import type { EditorContentPage } from "../model/editorTypes";

type LivePageState = {
  livePage: EditorContentPage | null;
  setLivePage: React.Dispatch<
    React.SetStateAction<EditorContentPage | null>
  >;
};

const LocalContentLivePageContext =
  createContext<LivePageState>({
    livePage: null,
    setLivePage: () => {},
  });

const LocalContentPreviewContext =
  createContext<LocalContentPagePreview | null>(null);

/**
 * Shares one validated development-only preview
 * between the sidebar and the page viewer.
 */
export function LocalContentPreviewProvider({
  children,
}: {
  children: ReactNode;
}) {
  const preview = useLocalContentPagePreview();

  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const isLoggingOut = useAppSelector(selectIsLoggingOut);
  const canShowLivePage = isLoggedIn && !isLoggingOut;

  const [livePage, setLivePage] =
    useState<EditorContentPage | null>(null);

  const sessionRef = useRef({
    allowed: canShowLivePage,
    generation: 0,
  });

  if (sessionRef.current.allowed !== canShowLivePage) {
    sessionRef.current = {
      allowed: canShowLivePage,
      generation: sessionRef.current.generation + 1,
    };
  }

  const generation = sessionRef.current.generation;

  const guardedSetLivePage: typeof setLivePage = value => {
    if (
      !sessionRef.current.allowed ||
      sessionRef.current.generation !== generation
    ) {
      return;
    }

    setLivePage(previous => {
      if (
        !sessionRef.current.allowed ||
        sessionRef.current.generation !== generation
      ) {
        return previous;
      }

      return typeof value === "function"
        ? value(previous)
        : value;
    });
  };

  useEffect(() => {
    if (!canShowLivePage) {
      setLivePage(null);
    }
  }, [canShowLivePage]);

  return (
    <LocalContentLivePageContext.Provider
      value={{
        livePage: canShowLivePage ? livePage : null,
        setLivePage: guardedSetLivePage,
      }}
    >
      <LocalContentPreviewContext.Provider value={preview}>
        {children}
      </LocalContentPreviewContext.Provider>
    </LocalContentLivePageContext.Provider>
  );
}

/**
 * Reads the shared preview.
 * Must be used below LocalContentPreviewProvider.
 */
export function useSharedLocalContentPreview(): LocalContentPagePreview {
  const preview = useContext(LocalContentPreviewContext);

  if (preview === null) {
    throw new Error(
      "useSharedLocalContentPreview requires LocalContentPreviewProvider",
    );
  }

  return preview;
}
/**
 * Temporary page data for live display only.
 * Never persists changes or publishes content.
 */
export function useLocalContentLivePage(): LivePageState {
  return useContext(LocalContentLivePageContext);
}