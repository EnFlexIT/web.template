import React, { useEffect, useState } from "react"
import { AbstractSiteContent as AbstractSiteContentType } from "../../../api/implementation/Dynamic-Content-Api"
import { isSiteContentText, isSiteContentImage, isSiteContentProperties } from "../../../util/isAbstractSiteContent"
// import { DynamicContentChanger } from "../editors/DynamicContextChanger"
import { SiteContentImage } from "./SiteContentImage"
import { SiteContentText } from "./SiteContentText"
// import { ThemedView, ThemedText } from "enflex.it-styled-ui"
import { SiteContentProperties } from "./SiteContentProperties"
import { View } from "react-native"
import { AbstractSiteContentEditor } from "../editors/AbstractSiteContentEditor"

interface AbstractSiteContentProps {
    abstractSiteContent: AbstractSiteContentType
}
export function AbstractSiteContent({ abstractSiteContent }: AbstractSiteContentProps) {
    const [editorVisible, setEditorVisible] = useState(false)

    const [content, setContent] = useState(abstractSiteContent)

    // console.log(content)

    useEffect(() => {
        const interval = abstractSiteContent.updatePeriodInSeconds !== 0 ? setInterval(() => {
            console.log(`UniqueContentID-${abstractSiteContent.uniqueContentID} would like to update`)
        }, abstractSiteContent.updatePeriodInSeconds * 1000) : undefined
        return () => clearInterval(interval)
    }, [])

    const editor = <AbstractSiteContentEditor abstractSiteContent={content} setVisible={setEditorVisible} visible={editorVisible} setContent={setContent} />

    if (isSiteContentText(content)) {
        return (
            <View>
                {editor}
                <SiteContentText content={content} setChangerVisible={setEditorVisible} />
            </View>
        )
    } else if (isSiteContentImage(content)) {
        return (
            <View>
                {editor}
                <SiteContentImage content={content} setChangerVisible={setEditorVisible} />
            </View>
        )
    } else if (isSiteContentProperties(content)) {
        return (
            <View>
                {editor}
                <SiteContentProperties content={content} setChangerVisible={setEditorVisible} />
            </View>
        )
    } else {
        return undefined
    }
}
