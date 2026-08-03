import { Pressable } from "react-native";
import React, { useState } from "react";
// import { createThematicallyDependentStyle, useThematicallyDependentStyle } from "enflex.it-core";
import { Editor as TipTapEditorType } from '@tiptap/react';
import { Level } from "@tiptap/extension-heading";
import {
  H1Icon,
  H2Icon,
  H3Icon,
  H4Icon,
  H5Icon,
  H6Icon,
} from "@design-system";
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
                <H1Icon {...rest} />
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
                <H2Icon {...rest} />
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
                <H3Icon {...rest} />
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
                <H4Icon {...rest} />
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
                <H5Icon {...rest} />
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
                <H6Icon {...rest} />
            </Pressable>
    }
}
