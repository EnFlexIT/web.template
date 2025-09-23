import { Dispatch, SetStateAction, useState } from "react";
import { H_Icon } from "../icons/H-Icon";
import { Pressable, ScrollView } from "react-native";
// import { createThematicallyDependentStyle, useThematicallyDependentStyle, useTheme } from "enflex.it-core";
import { ThemedView } from "../../themed/ThemedView"
import { ThemedText } from "../../themed/ThemedText"
import { HeadingButton } from "./HeadingButton";
import { Editor as TipTapEditorType } from '@tiptap/react';
import { Level } from "@tiptap/extension-heading";
import { HeadingIcon } from "../icons/Headin-Icon";
import { StyleSheet } from "react-native-unistyles";

interface MenuEntryProps {
    editor: TipTapEditorType,
    level: Level,
    setMenuVisible: Dispatch<SetStateAction<boolean>>
}
function MenuEntry({ editor, level, setMenuVisible }: MenuEntryProps) {

    const [over, setOver] = useState(false)

    return (
        <Pressable
            onHoverIn={() => setOver(true)}
            onHoverOut={() => setOver(false)}
            onPress={e => {
                editor.chain().focus().toggleHeading({ level: level }).run()
                setMenuVisible(false)
            }}
        >
            <ThemedView style={[over ? styles.over : styles.notOver, styles.container1]}>
                <HeadingIcon
                    level={level}
                    style={[over ? styles.over : styles.notOver]}
                />
                <ThemedText>Heading {level}</ThemedText>
            </ThemedView>
        </Pressable>
    )
}

const styles = StyleSheet.create((theme) => ({
    over: {
        backgroundColor: theme.colors.highlight
    },
    notOver: {

    },
    container1: {
        width: 120,
        paddingLeft: 10,
        borderRadius: 10,
        margin: 3,
        flexDirection: "row",
        gap: 10,
        alignItems: "center"
    },
    container2: {
        borderRadius: 5,
    },
    containerOver: {
        backgroundColor: theme.colors.highlight
    },
    containerNotOver: {

    },
    menu: {
        position: "absolute",
        top: 24,
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderRadius: 10,
    }
}))


interface HeadingExpandButtonProps {
    editor: TipTapEditorType
}
export function HeadingExpandButton({ editor }: HeadingExpandButtonProps) {

    const [open, setOpen] = useState(false)
    const [over, setOver] = useState(false)

    return (
        <Pressable
            onPress={() => setOpen(!open)}
            onHoverIn={() => setOver(true)}
            onHoverOut={() => setOver(false)}
        >
            <ThemedView>
                <H_Icon style={[styles.container2, over ? styles.containerOver : styles.containerNotOver]} />
                {
                    open &&
                    <ThemedView style={[styles.menu]}>
                        {
                            Array<Level>(1, 2, 3, 4, 5, 6).map((val, idx, array) => {
                                return (
                                    <MenuEntry key={idx} editor={editor} level={val} setMenuVisible={setOpen} />
                                )
                            })
                        }
                    </ThemedView>
                }
            </ThemedView>
        </Pressable>
    )
}
