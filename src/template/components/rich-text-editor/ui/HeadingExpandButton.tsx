import { Dispatch, SetStateAction, useState } from "react";
import { HIcon } from "@design-system";
import { Pressable, ScrollView } from "react-native";
// import { createThematicallyDependentStyle, useThematicallyDependentStyle, useTheme } from "enflex.it-core";
import { ThemedView } from "@/template/components/design-system/themed/ThemedView"
import { ThemedText } from "@/template/components/design-system/themed/ThemedText"
import { HeadingButton } from "./HeadingButton";
import { Editor as TipTapEditorType } from '@tiptap/react';
import { Level } from "@tiptap/extension-heading";
import { HeadingIcon } from "@design-system";
import { StyleSheet } from "react-native-unistyles";

interface HeadingExpandButtonProps {
    editor: TipTapEditorType;
}

const dropdownStyles = StyleSheet.create(theme => ({
    hover: {
        backgroundColor: theme.colors.highlight,
    },
    menu: {
        position: "absolute",
        top: 32,
        left: 0,
        width: 128,
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 6,
        padding: 4,
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 4,
        zIndex: 1000,
        elevation: 10,
    },
}));

export function HeadingExpandButton({
    editor,
}: HeadingExpandButtonProps) {
    const [open, setOpen] = useState(false);
    const [hoveredLevel, setHoveredLevel] = useState<Level | null>(null);

    const applyHeading = (level: Level) => {
        editor.chain().focus().toggleHeading({ level }).run();
        setOpen(false);
    };

    return (
        <ThemedView
            style={{
                position: "relative",
                zIndex: open ? 1000 : 1,
                overflow: "visible",
            }}
        >
            <Pressable
                accessibilityRole="button"
                accessibilityLabel="Ueberschriften auswaehlen"
                accessibilityState={{ expanded: open }}
                onPress={() => setOpen(current => !current)}
                style={{
                    minWidth: 30,
                    minHeight: 30,
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "row",
                    gap: 2,
                }}
            >
                <ThemedText
                    style={{
                        fontSize: 22,
                        fontWeight: "600",
                    }}
                >
                    H
                </ThemedText>
                <ThemedText style={{ fontSize: 11 }}>
                    {open ? "▴" : "▾"}
                </ThemedText>
            </Pressable>

            {open && (
                <ThemedView style={dropdownStyles.menu}>
                    {([1, 2, 3, 4, 5, 6] as Level[]).map(level => (
                        <Pressable
                            key={level}
                            accessibilityRole="button"
                            accessibilityLabel={`Heading ${level}`}
                            onPress={() => applyHeading(level)}
                            onHoverIn={() => setHoveredLevel(level)}
                            onHoverOut={() => setHoveredLevel(null)}
                            style={[
                                {
                                    width: 56,
                                    minHeight: 30,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    borderRadius: 4,
                                },
                                hoveredLevel === level && dropdownStyles.hover,
                            ]}
                        >
                            <ThemedText style={{ fontSize: 13 }}>
                                {`H${level}`}
                            </ThemedText>
                        </Pressable>
                    ))}
                </ThemedView>
            )}
        </ThemedView>
    );
}
