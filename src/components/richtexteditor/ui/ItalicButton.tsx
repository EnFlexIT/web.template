import { Pressable } from "react-native";
import React, { useState } from "react";
// import { createThematicallyDependentStyle, useThematicallyDependentStyle } from "enflex.it-core";
import { Editor as TipTapEditorType } from '@tiptap/react';
import { Italic_Icon } from "../../richtexteditor/icons/Italic-Icon";
import { StyleSheet } from "react-native-unistyles";


interface ItalicButtonProps {
    editor: TipTapEditorType
}
export function ItalicButton({ editor }: ItalicButtonProps) {
    const [over, setOver] = useState(false)

    return <Pressable
        onPress={() => {
            if (editor) {
                editor.chain().focus().toggleItalic().run()
            }
        }}
        onHoverIn={() => setOver(true)}
        onHoverOut={() => setOver(false)}
    >
        <Italic_Icon style={[over ? styles.over : styles.notOver, styles.container]} />
    </Pressable>
}


const styles = StyleSheet.create(theme => ({
    text: {
        userSelect: "none"
    },
    over: {
        backgroundColor: theme.colors.highlight
    },
    notOver: {

    },
    container: {
        borderRadius: 5,
    }
}))
