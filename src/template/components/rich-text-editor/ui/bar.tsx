import { ThemedView } from "@/template/components/design-system/themed/ThemedView";
import React from "react";
// import { createThematicallyDependentStyle, useThematicallyDependentStyle } from "enflex.it-core";
import { Editor as TipTapEditorType } from '@tiptap/react';
import { HeadingButton } from "./HeadingButton"
import { BoldButton } from "./BoldButton";
import { ItalicButton } from "./ItalicButton";
import { StrikeButton } from "./StrikeButton";
import { HIcon } from "@design-system";
import { HeadingExpandButton } from "./HeadingExpandButton";
import { StyleSheet } from "react-native-unistyles";


interface BarProps {
    editor: TipTapEditorType
    compact?: boolean
}
export function Bar({ editor, compact = false }: BarProps) {

    return <ThemedView style={[barStyles.container, compact && { padding: 6, gap: 8, flexWrap: "wrap" }]}>
        <HeadingExpandButton editor={editor} />
        {/* <H_Icon />
        <HeadingButton editor={editor} level={1} />
        <HeadingButton editor={editor} level={2} />
        <HeadingButton editor={editor} level={3} />
        <HeadingButton editor={editor} level={4} />
        <HeadingButton editor={editor} level={5} />
        <HeadingButton editor={editor} level={6} /> */}
        <BoldButton editor={editor} />
        <ItalicButton editor={editor} />
        <StrikeButton editor={editor} />
    </ThemedView>
}
const barStyles = StyleSheet.create(theme => ({
    container: {
        padding: 10,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 20,
        borderBottomColor: theme.colors.border,
        borderBottomWidth: 1,
        position: "relative",
        zIndex: 100,
        overflow: "visible",
        // backgroundColor: "lightgreen",
    }
}))
