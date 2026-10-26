import React, {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

import {
  useLocalContentPagePreview,
  type LocalContentPagePreview,
} from "../hooks/useLocalContentPagePreview";

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
  const [livePage, setLivePage] =
    useState<EditorContentPage | null>(null);

  return (
    <LocalContentLivePageContext.Provider
      value={{ livePage, setLivePage }}
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