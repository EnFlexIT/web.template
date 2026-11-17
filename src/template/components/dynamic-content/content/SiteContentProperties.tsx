import React, { Dispatch } from "react"
import { SiteContentProperties as SiteContentPropertiesType } from "@/api/implementation/Dynamic-Content-Api"
import { Pressable } from "react-native"
// import { useTheme } from "enflex.it-core"
// import { ThemedText, ThemedView } from "enflex.it-styled-ui"
import { Text } from "@/template/components/design-system/stylistic/Text";
import { Table } from "@design-system";
type SiteContentPropertiesProps = {
    content: SiteContentPropertiesType,
    canEdit: boolean,
    setChangerVisible: Dispatch<React.SetStateAction<boolean>>,
}
export function SiteContentProperties({ content, canEdit, setChangerVisible }: SiteContentPropertiesProps) {
    if (content.editable && canEdit) {
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

