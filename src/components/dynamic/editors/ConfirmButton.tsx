import { Pressable } from "react-native";
import { ThemedText } from "../../themed/ThemedText";
import { ThemedView } from "../../themed/ThemedView"
import React, { Dispatch, SetStateAction, useState } from "react";
import { StyleSheet } from "react-native-unistyles";
// import { createThematicallyDependentStyle, useThematicallyDependentStyle } from "enflex.it-core";


interface ConfirmButtonProps {
    setVisible: Dispatch<SetStateAction<boolean>>,
    confirm: () => Promise<void>
}
export function ConfirmButton({ setVisible, confirm }: ConfirmButtonProps) {

    const [over, setOver] = useState(false)
    // const styles = useThematicallyDependentStyle(confirmButtonStyles)

    return (
        <Pressable
            onPress={async () => {
                setVisible(false)
                await confirm()
            }}
            onHoverIn={() => setOver(true)}
            onHoverOut={() => setOver(false)}
        >
            <ThemedView style={[styles.container, over ? styles.over : styles.notOver]}>
                <ThemedText>Confirm</ThemedText>
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
