import { ActivityIndicator, View } from "react-native"
import { StyleSheet } from "react-native-unistyles"
import { Screen } from "../components/Screen"

export function LoadingScreen() {
    return (
        <Screen style={[styles.container]}>
            <ActivityIndicator />
        </Screen>
    )
}

const styles = StyleSheet.create(theme => ({
    container: {
        justifyContent: "center",
        alignItems: "center",
    }
}))
