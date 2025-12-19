import { View } from "react-native";
import { Text } from "../../../components/stylistic/Text";
import { ActionButton } from "../../../components/ui-elements/ActionButton";
import { Checkbox } from "../../../components/ui-elements/Checkbox";
import { TextInput } from "../../../components/ui-elements/TextInput";
import { useState } from "react";

export function FactorySettingsTab() {
    //  (später API/Redux)
    const [useGlobalSettings, setUseGlobalSettings] = useState(true);

    const [factoryId, setFactoryId] = useState("de.enflexit.awb.bgSystem.db");
    const [databaseSystem, setDatabaseSystem] = useState("Apache Derby (Embedded)");
    const [database, setDatabase] = useState("ems");
    const [urlParams, setUrlParams] = useState("create=true");
    const [user, setUser] = useState("awb");
    const [password, setPassword] = useState("•••");

    return (
        <View style={{ gap: 24, paddingTop: 16 }}>

            {/* Header */}
            <View style={{ gap: 4 }}>
                <Text style={{ fontSize: 16, fontWeight: "600" }}>
                    Individual Database Connections & Settings
                </Text>
                <Text style={{ opacity: 0.7 }}>
                    Configure database settings for a specific factory.
                </Text>
            </View>

            {/* Global toggle */}
            <Checkbox
                label="Use settings below for every database connection"
                value={useGlobalSettings}
                onChange={setUseGlobalSettings}
            />

            {/* Factory selection (placeholder)(read-only for now) */}
            <TextInput
                label="Factory ID"
                value={factoryId}
                onChangeText={setFactoryId}
                disabled
            />

            {/* Database system (read-only for now) */}
            <TextInput
                label="Database System"
                value={databaseSystem}
                onChangeText={() => {}}
                disabled
            />

            {/* Database settings box */}
            <View style={{ gap: 12 }}>

                <Text style={{ fontWeight: "600" }}>
                    Database Settings
                </Text>

                <TextInput
                    label="Database"
                    value={database}
                    onChangeText={setDatabase}
                />

                <TextInput
                    label="Add. URL Params"
                    value={urlParams}
                    onChangeText={setUrlParams}
                />

                <TextInput
                    label="User Name"
                    value={user}
                    onChangeText={setUser}
                />

                <TextInput
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                />
            </View>

            {/* Actions */}
            <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
                <ActionButton
                    label="Save"
                    variant="primary"
                    onPress={() => {
                        console.log("Save factory DB settings");
                    }}
                />

                <ActionButton
                    label="Test Connection"
                    onPress={() => {
                        console.log("Test factory DB connection");
                    }}
                />
            </View>

        </View>
    );
}
