import React, { Dispatch, useEffect, useState } from "react"
import { SiteContentText as SiteContentTextType } from "../../../api/implementation/Dynamic-Content-Api"
import { Pressable } from "react-native"
import StarterKit from '@tiptap/starter-kit'
import { EditorContent, useEditor } from "@tiptap/react"
import { useUnistyles } from "react-native-unistyles"

type SiteContentTextProps = {
    content: SiteContentTextType,
    setChangerVisible: Dispatch<React.SetStateAction<boolean>>,
}
export function SiteContentText({ content, setChangerVisible }: SiteContentTextProps) {

    const { theme } = useUnistyles()

    const editor = useEditor({
        extensions: [StarterKit],
        content: content.text,
        editorProps: {
            attributes: {
                style: `color: ${theme.colors.text};`
            },
        },
        editable: false
    })

    useEffect(() => {
        if (editor) {
            editor.commands.setContent(content.text)
        }
    }, [content])

    if (content.editable) {
        return <Pressable onPress={() => setChangerVisible(true)}><EditorContent editor={editor} /></Pressable>
    } else {
        return <EditorContent editor={editor} />
    }
}
