import { Pressable } from "react-native";
import React, { useState } from "react";
// import { createThematicallyDependentStyle, useThematicallyDependentStyle } from "enflex.it-core";
import { Editor as TipTapEditorType } from '@tiptap/react';
import { Strike_Icon } from "../../richtexteditor/icons/Strike-Icon";
import { StyleSheet } from "react-native-unistyles";


interface StrikeButtonProps {
    editor: TipTapEditorType
}
export function StrikeButton({ editor }: StrikeButtonProps) {

    // const styles = useThematicallyDependentStyle(strikeButtonStyles)
    const [over, setOver] = useState(false)

    return <Pressable
        onPress={() => {
            if (editor) {
                editor.chain().focus().toggleStrike().run()
            }
        }}
        onHoverIn={() => setOver(true)}
        onHoverOut={() => setOver(false)}
    >
        <Strike_Icon style={[over ? styles.over : styles.notOver, styles.container]} />
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

