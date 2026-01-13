import { Pressable, View } from "react-native";

import React, { Dispatch, Fragment, SetStateAction, useState } from "react";
import {
  AbstractSiteContent as AbstractSiteContentType,
  SiteContentText,
} from "../../../api/implementation/Dynamic-Content-Api";
//Editor
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
//Elemnte
import { ConfirmButton } from "./ConfirmButton";
import { CancelButton } from "./CancelButton";
import { Bar } from "../../richtexteditor/ui/bar";
//StyleSheet
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { ThemedView } from "../../themed/ThemedView";
import { ThemedText } from "../../themed/ThemedText";

interface SiteContentTextEditorProps {
  siteContentText: SiteContentText;
  setContent: Dispatch<React.SetStateAction<AbstractSiteContentType>>;
  setVisible: Dispatch<SetStateAction<boolean>>;
}
export function SiteContentTextEditor({
  siteContentText: content,
  setContent,
  setVisible,
}: SiteContentTextEditorProps) {
  const [text, setText] = useState(content.text);

  async function confirmText() {
    if (text) {
      setContent({
        editable: content.editable,
        mimeType: content.mimeType,
        text: text,
        uniqueContentID: content.uniqueContentID,
        updatePeriodInSeconds: content.uniqueContentID,
        AbstractSiteContentType: "SiteContentText",
      } as SiteContentText);
      setVisible(false);
    }
  }

  const { theme } = useUnistyles();

  const editor = useEditor({
    extensions: [StarterKit],
    content: text,
    onUpdate({ editor }) {
      if (editor) {
        setText(editor.getHTML());
      }
    },
    editorProps: {
      attributes: {
        style: `color: ${theme.colors.text}; width: 100%; height: 100%; `,
      },
    },
  });

  if (editor) {
    return (
      <ThemedView style={[styles.textEditorContainer]}>
        {/* <ThemedView style={{ flex: 1, backgroundColor: "blue" }}> */}
        <Bar editor={editor} />
        {/* </ThemedView> */}
        <Pressable
          onPress={() => {
            if (editor) {
              editor.chain().focus("end");
            }
          }}
          style={[styles.editorContentContainer]}
        >
          <div
            style={{
              flex: 1,
              display: "block",
              overflow: "hidden",
              overflowY: "auto",
              overflowX: "hidden",
            }}
            className="texteditor"
          >
            <EditorContent editor={editor} />
          </div>
        </Pressable>
        <ThemedView style={[styles.textEditorButtonsContainer]}>
          <CancelButton setVisible={setVisible} />
          <ConfirmButton confirm={confirmText} setVisible={setVisible} />
        </ThemedView>
        <style>
          {`
          .texteditor .ProseMirror {
            max-width: 100%;
            overflow-wrap: break-word;
            word-break: break-word;
            white-space: normal;
          }

          div.texteditor .ProseMirror p {
            margin-top: 0;
            height: 100%;
          }

          .ProseMirror-focused {
            outline: none;
          }
          `}
        </style>
      </ThemedView>
    );
  } else {
    return (
      <ThemedView>
        <ThemedText>
          Initialisation of WYSIWYG rich text editor failed
        </ThemedText>
      </ThemedView>
    );
  }
}

const styles = StyleSheet.create((theme) => ({
  textEditorContainer: {
    // padding: 10,
    flex: 1,
    // justifyContent: 'space-between',
    // gap: "5%",
  },
  textEditorButtonsContainer: {
    flexDirection: "row",
    gap: "10%",
    justifyContent: "center",
    padding: 10,
    zIndex: -1,
    // backgroundColor: "lightyellow",
    // flex: 1,
  },
  textInput: {
    textAlign: "center",
  },
  editorContentContainer: {
    backgroundColor: theme.colors.card,
    flex: 1,
    // padding: 5,
    borderColor: theme.colors.border,
    borderWidth: 1,
    // padding: 10,
    zIndex: -1,
  },
}));
