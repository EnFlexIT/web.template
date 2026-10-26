import React, { useEffect } from "react";

import { View } from "react-native";

import {
  useEditor,
  EditorContent,
} from "@tiptap/react";

import StarterKit from "@tiptap/starter-kit";

import {
  sanitizeContentHtml,
} from "../utils/sanitizeContentHtml";

import { useUnistyles } from "react-native-unistyles";

import {
  ThemedText,
} from "@/template/components/design-system/themed/ThemedText";

export interface ContentTextBlockViewerProps {
  html: string;
}

/**
 * Read-only local content preview.
 *
 * Does not modify drafts or call backend APIs.
 * HTML security must be reviewed before production use.
 */
export function ContentTextBlockViewer({
  html,
}: ContentTextBlockViewerProps) {
  const { theme } = useUnistyles();

  const safeHtml = sanitizeContentHtml(html);

  const editor = useEditor({
    extensions: [StarterKit],
    content: safeHtml,
    editable: false,

    editorProps: {
      attributes: {
        style: [
          `color: ${theme.colors.text}`,
          "padding: 12px",
          "overflow-wrap: break-word",
        ].join("; "),
      },
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    if (editor.getHTML() !== safeHtml) {
      editor.commands.setContent(safeHtml, {
        emitUpdate: false,
      });
    }
  }, [editor, safeHtml]);

  if (!editor) {
    return (
      <ThemedText>
        Inhalt wird geladen …
      </ThemedText>
    );
  }

  return (
    <View>
      <EditorContent editor={editor} />
    </View>
  );
}