import { View, Modal, Pressable } from "react-native";
import { Text } from "../../../components/stylistic/Text";
import { ActionButton } from "../../../components/ui-elements/ActionButton";
import { Checkbox } from "../../../components/ui-elements/Checkbox";
import { TextInput } from "../../../components/ui-elements/TextInput";
import { useState } from "react";
import AntDesign from "@expo/vector-icons/AntDesign";
import { ThemedView } from "../../../components/themed/ThemedView";
import { useUnistyles } from "react-native-unistyles";

export function DerbyNetworkServerTab() {
    const { theme } = useUnistyles();

    const [enabled, setEnabled] = useState(true);
    const [host, setHost] = useState("localhost");
    const [port, setPort] = useState("1527");
    const [user, setUser] = useState("awb");
    const [password, setPassword] = useState("");

    const [showIpSelector, setShowIpSelector] = useState(false);

    // Mock-Daten (später Redux / API)
    const ipAddresses = [
        "127.0.0.1 (Loopback)",
        "192.168.1.105 (IPv4)",
        "0:0:0:0:0:0:0:1 (IPv6)",
    ];

    return (
        <View style={{ gap: 24, paddingTop: 16 }}>

            <Checkbox
                label="Start a Derby database server that is accessible via network"
                value={enabled}
                onChange={setEnabled}
            />

            {/* Host + Edit */}
            <View style={{ gap: 6 }}>
                <Text>Host or IP</Text>

                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <View style={{ flex: 1 }}>
                        <TextInput
                            value={host}
                            onChangeText={setHost}
                        />
                    </View>

                    <Pressable onPress={() => setShowIpSelector(true)}>
                        <AntDesign
                            name="edit"
                            size={22}
                            color={theme.colors.text}
                        />
                    </Pressable>
                </View>
            </View>

            <TextInput
                label="Port (default: 1527)"
                value={port}
                keyboardType="numeric"
                onChangeText={setPort}
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
                secureTextEntry
            />

            {/* Actions */}
            <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
                <ActionButton
                    label="Save"
                    variant="primary"
                    onPress={() => console.log("Save Derby settings")}
                />

                <ActionButton
                    label="Test Connection"
                    onPress={() => console.log("Test Derby connection")}
                />
            </View>

            {/* IP Selector Modal */}
            <Modal visible={showIpSelector} transparent animationType="fade">
                <Pressable
                    style={{
                        flex: 1,
                        backgroundColor: "rgba(0,0,0,0.4)",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                    onPress={() => setShowIpSelector(false)}
                >
                    {/* STOP propagation here */}
                    <Pressable>
                        <ThemedView
                            style={{
                                width: 420,
                                padding: 16,
                                borderRadius: 8,
                                gap: 12,
                                backgroundColor: theme.colors.card,
                                borderColor: theme.colors.border,
                                borderWidth: 1,
                            }}
                        >
                            <Text style={{ fontWeight: "600" }}>
                                Select IP Address
                            </Text>
{ipAddresses.map((ip, index) => (
    <Pressable
        key={index}
        onPress={() => {
            setHost(ip.split(" ")[0]);
            setShowIpSelector(false);
        }}
    >
        <Text>{ip}</Text>
    </Pressable>
))}

                            <ActionButton
                                label="Close"
                                onPress={() => setShowIpSelector(false)}
                            />
                        </ThemedView>
                    </Pressable>
                </Pressable>
            </Modal>

        </View>
    );
}
