import { Pressable, GestureResponderEvent } from "react-native";
import { ThemedView } from "../../themed/ThemedView";
import React, { useState } from "react";
import AntDesign from '@expo/vector-icons/AntDesign';
import { StyleSheet } from "react-native-unistyles";
import { useUnistyles } from 'react-native-unistyles';

interface UploadButtonProps {
    onPress: (event: GestureResponderEvent) => void
}

export function UploadButton({ onPress }: UploadButtonProps) {
    const [over, setOver] = useState(false);
    const { theme } = useUnistyles();

    // Die Farbe dynamisch berechnen
    const iconColor = over ? theme.colors.highlight : theme.colors.text;

    return (
        <ThemedView style={styles.uploadButtonContainer}>
            <Pressable
                onHoverIn={() => setOver(true)}
                onHoverOut={() => setOver(false)}
                onPress={onPress}
            >
                <AntDesign
                    name="upload"
                    size={60}
                    color={iconColor}
                    style={styles.uploadButton}
                />
            </Pressable>
        </ThemedView>
    )
}

const styles = StyleSheet.create({
    uploadButtonContainer: {},
    uploadButton: {}
});
