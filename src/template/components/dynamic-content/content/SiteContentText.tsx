import React, { Dispatch, useEffect } from "react";
import { SiteContentText as SiteContentTextType } from "@/api/implementation/Dynamic-Content-Api";

import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/react";
import { useUnistyles } from "react-native-unistyles";


type SiteContentTextProps = {
  content: SiteContentTextType;
  canEdit: boolean;
  setChangerVisible: Dispatch<React.SetStateAction<boolean>>;
};
export function SiteContentText({
  content,
}: SiteContentTextProps) {
  const { theme } = useUnistyles();

  const editor = useEditor({
    extensions: [StarterKit],
    content: content.text,
    editorProps: {
      attributes: {
        style: `color: ${theme.colors.text};`,
      },
    },
    editable: false,
  });



  useEffect(() => {
    if (editor) {
      editor.commands.setContent(content.text);
    }
  }, [content]);

  // Reine Textanzeige. Bearbeitung erfolgt im zentralen Backend-Editor.
  return <EditorContent editor={editor} />;
}
