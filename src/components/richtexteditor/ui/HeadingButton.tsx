import { Pressable } from "react-native";
import React, { useState } from "react";
// import { createThematicallyDependentStyle, useThematicallyDependentStyle } from "enflex.it-core";
import { Editor as TipTapEditorType } from '@tiptap/react';
import { Level } from "@tiptap/extension-heading";
import { H1_Icon } from "../../richtexteditor/icons/H1-Icon";
import { H2_Icon } from "../../richtexteditor/icons/H2-Icon";
import { H3_Icon } from "../../richtexteditor/icons/H3-Icon";
import { H4_Icon } from "../../richtexteditor/icons/H4-Icon";
import { H5_Icon } from "../../richtexteditor/icons/H5_Icon";
import { H6_Icon } from "../../richtexteditor/icons/H6_Icon";
import { SvgProps } from "react-native-svg";


interface HeadingButtonProps extends SvgProps {
    level: Level,
    editor: TipTapEditorType,
}
export function HeadingButton({ editor, level, ...rest }: HeadingButtonProps) {

    const [over, setOver] = useState(false)

    switch (level) {
        case 1:
            return <Pressable
                onPress={() => {
                    if (editor) {
                        editor.chain().focus().toggleHeading({ level: level }).run()
                    }
                    setOver(false)
                }}
            // onHoverIn={() => setOver(true)}
            // onHoverOut={() => setOver(false)}
            >
                <H1_Icon {...rest} />
            </Pressable>
        case 2:
            return <Pressable
                onPress={() => {
                    if (editor) {
                        editor.chain().focus().toggleHeading({ level: level }).run()
                    }
                    setOver(false)
                }}
            // onHoverIn={() => setOver(true)}
            // onHoverOut={() => setOver(false)}
            >
                <H2_Icon {...rest} />
            </Pressable>
        case 3:
            return <Pressable
                onPress={() => {
                    if (editor) {
                        editor.chain().focus().toggleHeading({ level: level }).run()
                    }
                    setOver(false)
                }}
            // onHoverIn={() => setOver(true)}
            // onHoverOut={() => setOver(false)}
            >
                <H3_Icon {...rest} />
            </Pressable>
        case 4:
            return <Pressable
                onPress={() => {
                    if (editor) {
                        editor.chain().focus().toggleHeading({ level: level }).run()
                    }
                    setOver(false)
                }}
            // onHoverIn={() => setOver(true)}
            // onHoverOut={() => setOver(false)}
            >
                <H4_Icon {...rest} />
            </Pressable>
        case 5:
            return <Pressable
                onPress={() => {
                    if (editor) {
                        editor.chain().focus().toggleHeading({ level: level }).run()
                    }
                    setOver(false)
                }}
            // onHoverIn={() => setOver(true)}
            // onHoverOut={() => setOver(false)}
            >
                <H5_Icon {...rest} />
            </Pressable>
        case 6:
            return <Pressable
                onPress={() => {
                    if (editor) {
                        editor.chain().focus().toggleHeading({ level: level }).run()
                    }
                    setOver(false)
                }}
            // onHoverIn={() => setOver(true)}
            // onHoverOut={() => setOver(false)}
            >
                <H6_Icon {...rest} />
            </Pressable>
    }
}
