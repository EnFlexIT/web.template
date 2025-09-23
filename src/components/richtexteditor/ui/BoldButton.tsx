import { Pressable } from "react-native";
import React, { useState } from "react";
// import { createThematicallyDependentStyle, useThematicallyDependentStyle } from "enflex.it-core";
import { Editor as TipTapEditorType } from '@tiptap/react';
import { Bold_Icon } from "../../richtexteditor/icons/Bold-Icon";
import { StyleSheet } from "react-native-unistyles";
// import { ThemedView } from "enflex.it-styled-ui"

interface BoldButtonProps {
    editor: TipTapEditorType
}
export function BoldButton({ editor }: BoldButtonProps) {
    const [over, setOver] = useState(false)

    return <Pressable
        onPress={() => {
            if (editor) {
                editor.chain().focus().toggleBold().run()
            }
        }}
        onHoverIn={() => setOver(true)}
        onHoverOut={() => setOver(false)}
    >
        <Bold_Icon style={[over ? styles.over : styles.notOver, styles.container]} />
    </Pressable>
}

const styles = StyleSheet.create(theme => ({
    text: {
        userSelect: "none"
    },
    over: {
        backgroundColor: theme.colors.highlight,
    },
    notOver: {

    },
    container: {
        borderRadius: 5,
    }
}))
