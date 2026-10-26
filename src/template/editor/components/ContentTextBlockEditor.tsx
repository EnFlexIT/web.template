import React, { useEffect, useRef } from "react";

import {
  View,
} from "react-native";

import {
  useEditor,
  EditorContent,
} from "@tiptap/react";

import StarterKit from "@tiptap/starter-kit";

import {
  sanitizeContentHtml,
} from "../utils/sanitizeContentHtml";

import {
  useUnistyles,
} from "react-native-unistyles";

import {
  RichTextToolbar,
} from "@/template/components/rich-text-editor";

import {
  ThemedText,
} from "@/template/components/design-system/themed/ThemedText";

export interface ContentTextBlockEditorProps {
  blockId: string;
  html: string;
  onChange: (
    blockId: string,
    html: string,
  ) => void;
}

/**
 * Edits a text block within a local editor draft.
 *
 * No API writes or publishing.
 */
export function ContentTextBlockEditor({
  blockId,
  html,
  onChange,
}: ContentTextBlockEditorProps) {
  const { theme } = useUnistyles();

  const safeHtml = sanitizeContentHtml(html);

  // Keep the callback current without recreating the Tiptap editor.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const editor = useEditor({
    extensions: [StarterKit],
    content: safeHtml,

    onUpdate({ editor }) {
      onChangeRef.current(
        blockId,
        sanitizeContentHtml(editor.getHTML()),
      );
    },

    editorProps: {
      attributes: {
        style: [
          `color: ${theme.colors.text}`,
          "min-height: 140px",
          "padding: 12px",
          "outline: none",
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
        Texteditor wird initialisiert …
      </ThemedText>
    );
  }

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.card,
      }}
    >
      <RichTextToolbar editor={editor} />

      <View
        style={{
          minHeight: 140,
          padding: 4,
        }}
      >
        <EditorContent editor={editor} />
      </View>
    </View>
  );
}
