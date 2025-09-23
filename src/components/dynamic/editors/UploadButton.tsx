import { Pressable, GestureResponderEvent } from "react-native";
import { ThemedView } from "../../themed/ThemedView";
import React, { useState } from "react";
// import { createThematicallyDependentStyle, useThematicallyDependentStyle } from "enflex.it-core";
import AntDesign from '@expo/vector-icons/AntDesign';
import { StyleSheet } from "react-native-unistyles";



interface UploadButtonProps {
    onPress: (event: GestureResponderEvent) => void
}
export function UploadButton({ onPress }: UploadButtonProps) {
    const [over, setOver] = useState(false)

    return (
        <ThemedView style={[styles.uploadButtonContainer]}>
            <Pressable
                onHoverIn={() => setOver(true)}
                onHoverOut={() => setOver(false)}
                onPress={onPress}
            >
                <AntDesign
                    name="upload"
                    size={24}
                    style={[styles.uploadButton, over ? styles.uploadButtonOver : styles.uploadButtonNotOver]}
                />
            </Pressable>
        </ThemedView>
    )
}

const styles = StyleSheet.create(theme => ({
    uploadButtonContainer: {
    },
    uploadButton: {
    },
    uploadButtonOver: {
        color: theme.colors.highlight
    },
    uploadButtonNotOver: {
        color: theme.colors.text
    },
}))
