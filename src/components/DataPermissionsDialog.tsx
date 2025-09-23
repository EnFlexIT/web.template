// import { createThematicallyDependentStyle, useDataPermissions, useThematicallyDependentStyle, useTheme } from "enflex.it-core";
import { Modal, Pressable } from "react-native";
import { BlurView as BlurView_ } from 'expo-blur';
import { ThemedText } from "./themed/ThemedText";
import { ThemedView } from "./themed/ThemedView";
import AntDesign from '@expo/vector-icons/AntDesign';
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import { useAppSelector } from "../hooks/useAppSelector";
import { selectDataPermissions, setDataPermissions } from "../redux/slices/dataPermissionsSlice";
import { useAppDispatch } from "../hooks/useAppDispatch";

const BlurView = withUnistyles(BlurView_)

const TEXT = `
Wir verwenden Daten, um ihnen ein Optimales Erlebnis zu bieten.
Dazu zählen Daten, die für den Betrieb der Seite notwendig sind, sowie solche, die zu Statistikzwecken, für Komforteinstellungen, oder zur Anzeige personalisierter Inhalte genutzt werden.
Sie können selbst entscheiden, welche Kategorieren sie zulassen möchten.
Bitte beachten sie, dass auf Basis ihrer Einstellungen womöglich nicht mehr alle Funktionalitäten der Seite zur Verfügung stehen`
    ;

function Statistics() {


    const { accepted, comfort, mandatory, personalised, statistics } = useAppSelector(selectDataPermissions)
    const dispatch = useAppDispatch()

    const onPress = function () {

        dispatch(setDataPermissions({
            accepted: accepted,
            "comfort": comfort,
            "mandatory": mandatory,
            "personalised": personalised,
            "statistics": !statistics
        }))

    }

    return (
        <ThemedView style={[StatisticsStyles.container]}>
            <ThemedText style={[StatisticsStyles.text]}>Statistics</ThemedText>
            <Pressable onPress={onPress}>
                <AntDesign name={statistics ? "checkcircleo" : "closecircleo"} size={24} color="black" />
            </Pressable>
        </ThemedView>
    )
}
const StatisticsStyles = StyleSheet.create(theme => ({
    container: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: "30%",
    },
    text: {
        fontWeight: "bold",
    }
}))

function Personalised() {

    const { accepted, comfort, mandatory, personalised, statistics } = useAppSelector(selectDataPermissions)
    const dispatch = useAppDispatch()

    const onPress = function () {
        dispatch(setDataPermissions({
            accepted: accepted,
            comfort: comfort,
            mandatory: mandatory,
            personalised: !personalised,
            statistics: statistics,
        }))
    }

    return (
        <ThemedView style={[PersonalisedStyles.container]}>
            <ThemedText style={[PersonalisedStyles.text]}>Personalised</ThemedText>
            <Pressable onPress={onPress}>
                <AntDesign name={personalised ? "checkcircleo" : "closecircleo"} size={24} color="black" />
            </Pressable>
        </ThemedView>
    )
}
const PersonalisedStyles = StyleSheet.create(theme => ({
    container: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: "30%",
    },
    text: {
        fontWeight: "bold",
    }
}))

function Comfort() {

    const { accepted, comfort, mandatory, personalised, statistics } = useAppSelector(selectDataPermissions)
    const dispatch = useAppDispatch()

    const onPress = function () {
        dispatch(setDataPermissions({
            accepted: accepted,
            comfort: !comfort,
            mandatory: mandatory,
            personalised: personalised,
            statistics: statistics
        }))
    }

    return (
        <ThemedView style={[ComfortStyles.container]}>
            <ThemedText style={[ComfortStyles.text]}>Comfort</ThemedText>
            <Pressable onPress={onPress}>
                <AntDesign name={comfort ? "checkcircleo" : "closecircleo"} size={24} color="black" />
            </Pressable>
        </ThemedView>
    )
}
const ComfortStyles = StyleSheet.create(theme => ({
    container: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: "30%",
    },
    text: {
        fontWeight: "bold",
    }
}))

function Mandatory() {

    return (
        <ThemedView style={[MandatoryStyles.container]}>
            <ThemedText style={[MandatoryStyles.text]}>Mandatory</ThemedText>
            <Pressable onPress={() => undefined}>
                <AntDesign name="checkcircleo" size={24} color="black" />
            </Pressable>
        </ThemedView>
    )
}
const MandatoryStyles = StyleSheet.create((theme) => ({
    container: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: "30%",
    },
    text: {
        fontWeight: "bold",
    }
}))

function HorizontalLine() {
    return <ThemedView style={[horizontalLineStyles.color]} />
}
const horizontalLineStyles = StyleSheet.create((theme) => ({
    color: {
        borderBottomColor: theme.colors.border,
        borderBottomWidth: 1
    }
}))

export function DataPermissionsDialog() {
    const { accepted, comfort, mandatory, personalised, statistics } = useAppSelector(selectDataPermissions)
    const dispatch = useAppDispatch()

    const allesAkzeptieren = function () {
        dispatch(setDataPermissions({
            accepted: true,
            comfort: true,
            mandatory: true,
            personalised: true,
            statistics: true
        }))
    }

    const einstellungenSpeichern = function () {
        dispatch(setDataPermissions({
            accepted: true,
            comfort: comfort,
            mandatory: mandatory,
            personalised: personalised,
            statistics: statistics
        }))
    }

    // Data Permissions are not set in one way or the other
    if (!accepted) {
        return (
            <Modal transparent>
                <BlurView style={[styles.blurView]}>
                    <ThemedView style={[styles.contentContainer]}>
                        <ThemedView style={[styles.titleContainer]}>
                            <ThemedText style={[styles.title]}>Wir verwenden Cookies!</ThemedText>
                        </ThemedView>
                        <ThemedView style={[styles.textContainer]}>
                            <ThemedText style={[styles.text]}>{TEXT}</ThemedText>
                        </ThemedView>
                        <ThemedView style={[styles.switchesContainer]}>
                            <Mandatory />
                            <HorizontalLine />
                            <Comfort />
                            <HorizontalLine />
                            <Personalised />
                            <HorizontalLine />
                            <Statistics />
                        </ThemedView>
                        <ThemedView style={[styles.confirmContainer]}>
                            <Pressable onPress={allesAkzeptieren}>
                                <ThemedText>Alles akzeptieren</ThemedText>
                            </Pressable>
                            <Pressable onPress={einstellungenSpeichern}>
                                <ThemedText>Einstellungen speichern</ThemedText>
                            </Pressable>
                        </ThemedView>
                    </ThemedView>
                </BlurView>
            </Modal>
        )
    } else {
        return undefined
    }
}

const styles = StyleSheet.create(theme => ({
    blurView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    contentContainer: {
        width: "50%",
        height: "50%",
        borderColor: theme.colors.border,
        borderWidth: 1,
        padding: 20,
        justifyContent: "space-between"
    },
    titleContainer: {

    },
    title: {
        fontWeight: "bold",
        fontSize: 24,
    },
    textContainer: {
        margin: 10,
    },
    text: {
    },
    switchesContainer: {
        gap: 10,
    },
    confirmContainer: {
        flexDirection: "row",
        justifyContent: "space-around"
    }
}))
