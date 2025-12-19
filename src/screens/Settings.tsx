import { View } from "react-native";
import { Text } from "../components/stylistic/Text";
import { SettingsCard } from "../components/settings-ui/SettingsCard";
import { useLinkTo } from "@react-navigation/native";

export function SettingsScreen() {
    const linkTo = useLinkTo();

    return (
        <View style={{ flex: 1, padding: 24, gap: 24 }}>

            {/* Header */}
            <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 22, fontWeight: "600" }}>
                    Settings
                </Text>
                <Text style={{ fontSize: 14, opacity: 0.7 }}>
                    Configure system behaviour and upcoming features.
                </Text>
            </View>

            {/* Settings cards */}
            <View style={{ gap: 12 }}>
                <SettingsCard
                    title="Database Connections & Settings"
                    description="Configure database system, connection parameters and credentials."
                    onPress={() => linkTo("/3010")}
                />

                <SettingsCard
                    title="Operating Mode"
                    description="Configure server and runtime behaviour."
                />

                <SettingsCard
                    title="Feature Handling"
                    description="Enable or disable system features."
                />
            </View>

        </View>
    );
}
