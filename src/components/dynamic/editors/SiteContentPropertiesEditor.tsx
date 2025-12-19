import { ViewStyle } from "react-native";
import React, { Dispatch, SetStateAction, useState } from "react";
//Dynamic-Content-Api
import { AbstractSiteContent as AbstractSiteContentType, SiteContentProperties, PropertyEntry } from "../../../api/implementation/Dynamic-Content-Api";
//Elemente
import { ActionButton } from "../../../components/ui-elements/ActionButton";

//Style
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { ThemedText } from "../../themed/ThemedText";
import { ThemedTextInput } from "../../themed/ThemedTextInput";
import { ThemedView } from "../../themed/ThemedView";

interface PropertyEntryKeyProps {
    propertyEntry: PropertyEntry,
    /**
     * We pass the style as a prop (even if it is just the borderBottomWidth) so we can render the last item in the box without a bottom line
     * Otherwise we have two bottom lines which looks like crap
     */
    containerStyle: ViewStyle
}
function PropertyEntryKey({ propertyEntry: { key }, containerStyle: style }: PropertyEntryKeyProps) {
    return (
        <ThemedView style={[style]}>
            <ThemedText style={{
                paddingLeft: 10,
                paddingVertical: 5,
            }}>{key}</ThemedText>
        </ThemedView>
    )
}

interface PropertyEntryValueProps {
    propertyEntry: PropertyEntry,
    setPropertyEntry: (_: PropertyEntry) => void;
    containerStyle: ViewStyle
}
function PropertyEntryValue({ propertyEntry: { value, valueType, key }, setPropertyEntry, containerStyle }: PropertyEntryValueProps) {
    switch (valueType) {
        case "BOOLEAN":
            return (
                <ThemedView style={[containerStyle]}>
                    <ThemedText
                        style={{
                            paddingLeft: 10,
                            paddingVertical: 5,
                        }}
                        onPress={() => setPropertyEntry({
                            key: key,
                            value: value === "true" ? "false" : "true",
                            valueType: valueType
                        })}

                    >{value}</ThemedText>
                </ThemedView>
            )
        case "DOUBLE":
            return (
                <ThemedView style={[containerStyle]}>
                    <ThemedTextInput
                        value={value}
                        onChangeText={(text) => setPropertyEntry({
                            key: key,
                            value: text,
                            valueType: valueType
                        })}
                        style={{
                            paddingLeft: 10,
                            paddingVertical: 5,
                        }}
                    />
                </ThemedView>
            )
        case "STRING":
            return (
                <ThemedView style={[containerStyle]}>
                    <ThemedTextInput
                        value={value}
                        onChangeText={(text) => setPropertyEntry({
                            key: key,
                            value: text,
                            valueType: valueType
                        })}
                        style={{
                            paddingLeft: 10,
                            paddingVertical: 5,
                        }}
                    />
                </ThemedView>
            )
        case "INTEGER":
            return (
                <ThemedView style={[containerStyle]}>
                    <ThemedTextInput
                        value={value}
                        onChangeText={(text) => setPropertyEntry({
                            key: key,
                            value: text,
                            valueType: valueType
                        })}
                        style={{
                            paddingLeft: 10,
                            paddingVertical: 5,
                        }}
                    />
                </ThemedView>
            )
        case "LONG":
            return (
                <ThemedView style={[containerStyle]}>
                    <ThemedTextInput
                        value={value}
                        onChangeText={(text) => setPropertyEntry({
                            key: key,
                            value: text,
                            valueType: valueType
                        })}
                        style={{
                            paddingLeft: 10,
                            paddingVertical: 5,
                        }}
                    />
                </ThemedView>
            )
    }
}

interface SiteContentPropertiesEditorProps {
    siteContentProperties: SiteContentProperties,
    setContent: Dispatch<React.SetStateAction<AbstractSiteContentType>>,
    setVisible: Dispatch<SetStateAction<boolean>>,
}
export function SiteContentPropertiesEditor({ setContent, setVisible, siteContentProperties }: SiteContentPropertiesEditorProps) {
    const [properties, setProperties] = useState(siteContentProperties.propertyEntries)

    const { theme } = useUnistyles()



    const setPropertyEntry: (_: PropertyEntry) => void = function ({ key, value, valueType }) {
        setProperties((oldProperties) => oldProperties.map((val) => {
            if (key === val.key) {
                return {
                    key: key,
                    value: value,
                    valueType: valueType
                }
            }
            return val
        }))
    }

    async function confirmProperties() {
        setContent({
            editable: siteContentProperties.editable,
            propertyEntries: properties,
            uniqueContentID: siteContentProperties.uniqueContentID,
            updatePeriodInSeconds: siteContentProperties.updatePeriodInSeconds,
            AbstractSiteContentType: "SiteContentProperties"
        } as SiteContentProperties)
    }

    return (
        <ThemedView style={{ justifyContent: "space-between", flex: 1, padding: 10, }}>
            <ThemedView style={{
                flexDirection: "row",
                borderWidth: 1,
                borderColor: theme.colors.border
            }}>
                <ThemedView style={{
                    width: "50%",
                }}>
                    {
                        properties.map((entry, idx, array) => {
                            return <PropertyEntryKey key={idx} propertyEntry={entry} containerStyle={{
                                borderBottomWidth: (idx < (array.length - 1)) ? 1 : 0,
                                // backgroundColor: (idx % 2 == 0) ? "white" : "white",
                                backgroundColor: theme.colors.background,
                                borderColor: theme.colors.border
                            }} />
                        })
                    }
                </ThemedView>
                <ThemedView style={{
                    borderLeftWidth: 1,
                    borderColor: theme.colors.border,
                    width: "50%",
                }}>
                    {
                        properties.map((entry, idx, array) => {
                            return <PropertyEntryValue key={idx} propertyEntry={entry} setPropertyEntry={setPropertyEntry} containerStyle={{
                                borderBottomWidth: (idx < (array.length - 1)) ? 1 : 0,
                                // backgroundColor: (idx % 2 == 0) ? theme.colors : "white",
                                backgroundColor: theme.colors.background,
                                borderColor: theme.colors.border
                            }} />
                        })
                    }
                </ThemedView>
            </ThemedView>
            <ThemedView style={styles.siteContentPropertiesEditorButtonsContainer}>
         <ActionButton
          label="Cancel"
          onPress={() => setVisible(false)}/>

         <ActionButton
         label="Confirm"
         variant="primary"
         onPress={async () => {
            await confirmProperties();
            setVisible(false);}} />
           </ThemedView>

        </ThemedView>
    )
}
const styles = StyleSheet.create(theme => ({
    siteContentPropertiesEditorContainer: {
        // padding: 5,
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 5,
    },
    siteContentPropertiesEditorButtonsContainer: {
        // alignSelf: "stretch",
        flexDirection: "row",
        // marginTop: 20,
        // backgroundColor: "red",
        gap: "10%",
        justifyContent: "center",
    },
    confirmContainer: {

    },
    confirmText: {

    }
}))
