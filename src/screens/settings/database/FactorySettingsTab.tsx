import { View } from "react-native";
import { ActionButton } from "../../../components/ui-elements/ActionButton";
import { Checkbox } from "../../../components/ui-elements/Checkbox";
import { TextInput } from "../../../components/ui-elements/TextInput";
import { useState } from "react";
import { H4 } from "../../../components/stylistic/H4";
import { Screen } from "../../../components/Screen";
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
        <Screen>
        <View >


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
                size="sm"
            />

            {/* Database system (read-only for now) */}
            <TextInput
                label="Database System"
                value={databaseSystem}
                onChangeText={() => {}}
                disabled
                size="sm"
            />

            {/* Database settings box */}
            <View style={{ gap: 12 }}>

                <H4 >
                    Database Settings
                </H4>

                <TextInput
                    label="Database"
                    value={database}
                    onChangeText={setDatabase}
                    size="sm"
                />

                <TextInput
                    label="Add. URL Params"
                    value={urlParams}
                    onChangeText={setUrlParams}
                    size="sm"

                />

                <TextInput
                    label="User Name"
                    value={user}
                    onChangeText={setUser}
                    size="sm"
                />

                <TextInput
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    size="sm"
                />
            </View>

            {/* Actions */}
            <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
                <ActionButton
                    label="Save"
                    size="sm"
                    variant="secondary"
                    onPress={() => {
                        console.log("Save factory DB settings");
                    }}
                />

                <ActionButton
                    label="Test Connection"
                    size="sm"
                    onPress={() => {
                        console.log("Test factory DB connection");
                    }}
                />
            </View>

        </View>
        </Screen>
    );
}
