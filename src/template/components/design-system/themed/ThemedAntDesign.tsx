import { AntDesign as AntDesign_ } from "@expo/vector-icons"
import { IconProps } from "@expo/vector-icons/build/createIconSet";
import { StyleSheet, withUnistyles } from "react-native-unistyles";

const AntDesign = withUnistyles(AntDesign_)

export function ThemedAntDesign(props: IconProps<keyof typeof AntDesign_.glyphMap>) {
    return <AntDesign {...props} style={[styles.color, props.style]} />
}

const styles = StyleSheet.create((theme) => ({
    color: {
        color: theme.colors.text,
    }
}))
