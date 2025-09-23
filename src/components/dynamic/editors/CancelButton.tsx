import { Pressable } from "react-native";
import { ThemedText } from "../../themed/ThemedText";
import { ThemedView } from "../../themed/ThemedView"
import React, { Dispatch, SetStateAction, useState } from "react";
import { StyleSheet } from "react-native-unistyles";
// import { createThematicallyDependentStyle, useThematicallyDependentStyle } from "enflex.it-core";

interface CancelButtonProps {
    setVisible: Dispatch<SetStateAction<boolean>>,
}
export function CancelButton({ setVisible }: CancelButtonProps) {

    const [over, setOver] = useState(false)
    // const styles = useThematicallyDependentStyle(cancelButtonStyles)

    return (
        <Pressable
            onPress={() => setVisible(false)}
            onHoverIn={() => setOver(true)}
            onHoverOut={() => setOver(false)}
        >
            <ThemedView style={[styles.container, over ? styles.over : styles.notOver]}>
                <ThemedText>Cancel</ThemedText>
            </ThemedView>
        </Pressable>
    )
}

const styles = StyleSheet.create(theme => ({
    container: {
        padding: 5,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    over: {
        backgroundColor: theme.colors.highlight
    },
    notOver: {

    }
}))
