import { View, ViewProps } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export function Screen(props: ViewProps) {
    return <View
        {...props}
        style={[styles.container, props.style]}
    />
}

const styles = StyleSheet.create(theme => ({
    container: {
        padding: theme.info.screenMargin,
        maxWidth: theme.info.maxContentWidth,
        flex: 1,
    }
}))
