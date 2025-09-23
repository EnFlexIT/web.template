import { Pressable, View } from "react-native";
import { ThemedView } from "../../themed/ThemedView";
import { ThemedText } from "../../themed/ThemedText"
import React, { Dispatch, Fragment, SetStateAction, useState } from "react";
import { AbstractSiteContent as AbstractSiteContentType, SiteContentText } from "../../../api/implementation/Dynamic-Content-Api";
// import { createThematicallyDependentStyle, useThematicallyDependentStyle, useTheme } from "enflex.it-core";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { ConfirmButton } from "./ConfirmButton";
import { CancelButton } from "./CancelButton";
import { Bar } from "../../richtexteditor/ui/bar";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

interface SiteContentTextEditorProps {
    siteContentText: SiteContentText,
    setContent: Dispatch<React.SetStateAction<AbstractSiteContentType>>,
    setVisible: Dispatch<SetStateAction<boolean>>,
}
export function SiteContentTextEditor({ siteContentText: content, setContent, setVisible }: SiteContentTextEditorProps) {

    const [text, setText] = useState(content.text)

    async function confirmText() {
        if (text) {
            setContent({
                editable: content.editable,
                mimeType: content.mimeType,
                text: text,
                uniqueContentID: content.uniqueContentID,
                updatePeriodInSeconds: content.uniqueContentID,
                AbstractSiteContentType: "SiteContentText"
            } as SiteContentText)
            setVisible(false)
        }
    }

    const { theme } = useUnistyles()

    const editor = useEditor({
        extensions: [StarterKit],
        content: text,
        onUpdate({ editor }) {
            if (editor) {
                setText(editor.getHTML())
            }
        },
        editorProps: {
            attributes: {
                style: `color: ${theme.colors.text}; width: 100%; height: 100%; position: absolute`
            },

        }
    })


    if (editor) {
        return <ThemedView style={[styles.textEditorContainer]}>
            {/* <ThemedView style={{ flex: 1, backgroundColor: "blue" }}> */}
            <Bar editor={editor} />
            {/* </ThemedView> */}
            <Pressable
                onPress={() => {
                    if (editor) {
                        editor.chain().focus("end")
                    }
                }}
                style={[styles.editorContentContainer]}
            >
                {/* <ThemedView style={{ flex: 1, backgroundColor: "red" }}> */}
                <EditorContent editor={editor} />
                {/* </ThemedView> */}
            </Pressable>
            <ThemedView style={[styles.textEditorButtonsContainer]}>
                <CancelButton setVisible={setVisible} />
                <ConfirmButton confirm={confirmText} setVisible={setVisible} />
            </ThemedView>
        </ThemedView >
    } else {
        return <ThemedView>
            <ThemedText>Initialisation of WYSIWYG rich text editor failed</ThemedText>
        </ThemedView>
    }
}

const styles = StyleSheet.create(theme => ({
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
        textAlign: "center"
    },
    editorContentContainer: {
        backgroundColor: theme.colors.card,
        flex: 1,
        // padding: 5,
        borderColor: theme.colors.border,
        borderWidth: 1,
        // padding: 10,
        zIndex: -1,
    }
}))
