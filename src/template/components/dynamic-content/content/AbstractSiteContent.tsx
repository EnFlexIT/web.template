import React, { useEffect, useState } from "react"
import { AbstractSiteContent as AbstractSiteContentType } from "@/api/implementation/Dynamic-Content-Api"
import { isSiteContentText, isSiteContentImage, isSiteContentProperties } from "@/template/components/dynamic-content/model/isAbstractSiteContent"
// import { DynamicContentChanger } from "../editors/DynamicContextChanger"
import { SiteContentImage } from "./SiteContentImage"
import { SiteContentText } from "./SiteContentText"
// import { ThemedView, ThemedText } from "enflex.it-styled-ui"
import { SiteContentProperties } from "./SiteContentProperties"
import { View } from "react-native"
import { useAppSelector } from "@/template/state/store/useAppSelector"
import { selectCanEditInUiPreview } from "@/template/state/authorization/selectUiPreviewMode"
import { selectBackendContentWriteContext } from "@/template/editor/adapters/updateBackendContentElementFromStore"
import { AbstractSiteContentEditor } from "../editors/AbstractSiteContentEditor"


interface AbstractSiteContentProps {
    abstractSiteContent: AbstractSiteContentType
}
export function AbstractSiteContent({ abstractSiteContent }: AbstractSiteContentProps) {
    const [editorVisible, setEditorVisible] = useState(false)

    // Eine bearbeitbare Content-Eigenschaft ist keine Benutzerberechtigung.
    // Nur die bestätigte EDITOR-Perspektive und eine gültige
    // Backend-Schreibsitzung dürfen den alten Editor öffnen.
    const canEdit = useAppSelector(state => {
        const context = selectBackendContentWriteContext(state)

        return (
            state.backendRoles.status === "ready" &&
            selectCanEditInUiPreview(state) &&
            context.isLoggedIn &&
            context.canEdit &&
            !context.isSwitchingServer &&
            !context.isLoggingOut &&
            context.server.trim().length > 0
        )
    })

    useEffect(() => {
        if (!canEdit) {
            setEditorVisible(false)
        }
    }, [canEdit])

    const [content, setContent] = useState(abstractSiteContent)

    // console.log(content)

    useEffect(() => {
        const interval = abstractSiteContent.updatePeriodInSeconds !== 0 ? setInterval(() => {
            console.log(`UniqueContentID-${abstractSiteContent.uniqueContentID} would like to update`)
        }, abstractSiteContent.updatePeriodInSeconds * 1000) : undefined
        return () => clearInterval(interval)
    }, [])

    const editor = canEdit ? <AbstractSiteContentEditor abstractSiteContent={content} setVisible={setEditorVisible} visible={editorVisible} setContent={setContent} /> : null

    if (isSiteContentText(content)) {
        return (
            <View>
                {editor}
                <SiteContentText content={content} canEdit={canEdit} setChangerVisible={setEditorVisible} />
            </View>
        )
    } else if (isSiteContentImage(content)) {
        return (
            <View>
                {editor}
                <SiteContentImage content={content} canEdit={canEdit} setChangerVisible={setEditorVisible} />
            </View>
        )
    } else if (isSiteContentProperties(content)) {
        return (
            <View>
                {editor}
                <SiteContentProperties content={content} canEdit={canEdit} setChangerVisible={setEditorVisible} />
            </View>
        )
    } else {
        return undefined
    }
    
}
