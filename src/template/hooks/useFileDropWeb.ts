// src/hooks/useFileDropWeb.ts

import { useEffect, useRef, useState } from "react";
import { Platform, View } from "react-native";

type Options = {
  enabled: boolean;
  onFiles: (files: File[]) => void;
};

export function useFileDropWeb({ enabled, onFiles }: Options) {
  const dropRef = useRef<View>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    if (Platform.OS !== "web") return;
    if (typeof window === "undefined") return;

    const node = dropRef.current as unknown as HTMLElement | null;
    if (!node) return;

    const preventBrowserOpen = (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
    };

    const onDragEnter = (event: DragEvent) => {
      preventBrowserOpen(event);
      setDragging(true);
    };

    const onDragOver = (event: DragEvent) => {
      preventBrowserOpen(event);
      event.dataTransfer!.dropEffect = "copy";
      setDragging(true);
    };

    const onDragLeave = (event: DragEvent) => {
      preventBrowserOpen(event);

      if (!node.contains(event.relatedTarget as Node | null)) {
        setDragging(false);
      }
    };

    const onDrop = (event: DragEvent) => {
      preventBrowserOpen(event);
      setDragging(false);

      const files = Array.from(event.dataTransfer?.files ?? []);
      if (files.length > 0) {
        onFiles(files);
      }
    };

    // Wichtig: verhindert auch Drop außerhalb der Box.
    window.addEventListener("dragover", preventBrowserOpen);
    window.addEventListener("drop", preventBrowserOpen);

    node.addEventListener("dragenter", onDragEnter);
    node.addEventListener("dragover", onDragOver);
    node.addEventListener("dragleave", onDragLeave);
    node.addEventListener("drop", onDrop);

    return () => {
      window.removeEventListener("dragover", preventBrowserOpen);
      window.removeEventListener("drop", preventBrowserOpen);

      node.removeEventListener("dragenter", onDragEnter);
      node.removeEventListener("dragover", onDragOver);
      node.removeEventListener("dragleave", onDragLeave);
      node.removeEventListener("drop", onDrop);
    };
  }, [enabled, onFiles]);

  return {
    dropRef,
    dragging,
  };
}