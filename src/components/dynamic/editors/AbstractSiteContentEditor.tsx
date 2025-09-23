import { Modal } from "react-native";
import { ThemedView } from "../../themed/ThemedView";
import React, { Dispatch, SetStateAction } from "react";
import { AbstractSiteContent as AbstractSiteContentType } from "../../../api/implementation/Dynamic-Content-Api";
import { BlurView as BlurView_ } from 'expo-blur';
// import { createThematicallyDependentStyle, useThematicallyDependentStyle } from "enflex.it-core";
import { isSiteContentImage, isSiteContentProperties, isSiteContentText } from "../../../util/isAbstractSiteContent";
import { SiteContentTextEditor } from "./SiteContentTextEditor";
import { SiteContentImageEditor } from "./SiteContentImageEditor";
import { SiteContentPropertiesEditor } from "./SiteContentPropertiesEditor";
import { StyleSheet, withUnistyles } from "react-native-unistyles";

const BlurView = withUnistyles(BlurView_)

interface EditorProps {
    abstractSiteContent: AbstractSiteContentType,
    setContent: Dispatch<React.SetStateAction<AbstractSiteContentType>>,
    setVisible: Dispatch<SetStateAction<boolean>>,
}
function Editor({ abstractSiteContent, setContent, setVisible }: EditorProps) {
    if (isSiteContentText(abstractSiteContent)) {
        return <SiteContentTextEditor siteContentText={abstractSiteContent} setContent={setContent} setVisible={setVisible} />
    } else if (isSiteContentImage(abstractSiteContent)) {
        return <SiteContentImageEditor siteContentImage={abstractSiteContent} setContent={setContent} setVisible={setVisible} />
    } else if (isSiteContentProperties(abstractSiteContent)) {
        return <SiteContentPropertiesEditor setContent={setContent} setVisible={setVisible} siteContentProperties={abstractSiteContent} />
    } else {
        return undefined
    }
}

interface DynamicContentChangerProps {
    visible: boolean, setVisible: Dispatch<SetStateAction<boolean>>,
    abstractSiteContent: AbstractSiteContentType,
    setContent: Dispatch<React.SetStateAction<AbstractSiteContentType>>
}
export function AbstractSiteContentEditor({ setVisible, visible, abstractSiteContent, setContent }: DynamicContentChangerProps) {
    return (
        <Modal visible={visible} onRequestClose={() => setVisible(false)} transparent style={{}}>
            <BlurView style={[styles.blurView]}>
                <ThemedView style={[styles.contentContainer]}>
                    <Editor abstractSiteContent={abstractSiteContent} setContent={setContent} setVisible={setVisible} />
                </ThemedView>
            </BlurView>
        </Modal>
    )
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
    },
}))
