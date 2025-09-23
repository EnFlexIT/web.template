import React, { Dispatch } from "react"
import { SiteContentProperties as SiteContentPropertiesType } from "../../../api/implementation/Dynamic-Content-Api"
import { Pressable } from "react-native"
// import { useTheme } from "enflex.it-core"
// import { ThemedText, ThemedView } from "enflex.it-styled-ui"
import { Text } from "../../stylistic/Text"
import { Table } from "../../Table"

type SiteContentPropertiesProps = {
    content: SiteContentPropertiesType,
    setChangerVisible: Dispatch<React.SetStateAction<boolean>>,
}
export function SiteContentProperties({ content, setChangerVisible }: SiteContentPropertiesProps) {
    if (content.editable) {
        return (
            <Pressable
                onPress={() => setChangerVisible(true)}
            >
                <Table
                    data={content.propertyEntries.map(({ key, value }) => [<Text>{key}</Text>, <Text>{value}</Text>])}
                />
            </Pressable>
        )
    } else {
        return (
            <Table
                data={content.propertyEntries.map(({ key, value }) => [<Text>{key}</Text>, <Text>{value}</Text>])}
            />
        )
    }
}

