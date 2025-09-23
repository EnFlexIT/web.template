import { Image as ImageJSX } from "react-native";
import { ThemedView } from "../../themed/ThemedView";
import React, { Dispatch, SetStateAction, useState } from "react";
import { AbstractSiteContent as AbstractSiteContentType, SiteContentImage } from "../../../api/implementation/Dynamic-Content-Api";
// import { createThematicallyDependentStyle, useThematicallyDependentStyle } from "enflex.it-core";
import * as DocumentPicker from 'expo-document-picker';
import { CancelButton } from "./CancelButton";
import { ConfirmButton } from "./ConfirmButton";
import { UploadButton } from "./UploadButton";
import { StyleSheet } from "react-native-unistyles";

interface SiteContentImageEditorProps {
    siteContentImage: SiteContentImage,
    setContent: Dispatch<React.SetStateAction<AbstractSiteContentType>>,
    setVisible: Dispatch<SetStateAction<boolean>>,
}
export function SiteContentImageEditor({ siteContentImage: content, setVisible, setContent }: SiteContentImageEditorProps) {

    async function chooseImage() {
        const l = await DocumentPicker.getDocumentAsync({
            type: content.mimeType
        });

        try {
            if (!l.canceled) {
                if (l.assets) {
                    const [asset] = l.assets
                    const image = new Image()
                    image.onload = function (e) {
                        setImage(image)
                    }
                    image.src = asset.uri
                }
            }
        } catch (e) {
            console.error(`Error while trying to pick image`)
            console.error(e)
        }
    }

    const [image, setImage] = useState<HTMLImageElement | undefined>(undefined)

    async function confirmImage() {
        if (image) {
            console.log(image.src)
            /* This regex comes from <https://stackoverflow.com/questions/5714281/regex-to-parse-image-data-uri> */
            const regex = /^\s*data:(?<media_type>(?<mime_type>[a-z\-]+\/[a-z\-\+]+)(?<params>(;[a-z\-]+\=[a-z\-]+)*))?(?<encoding>;base64)?,(?<data>[a-z0-9\!\$\&\'\,\(\)\*\+\,\;\=\-\.\_\~\:\@\/\?\%\s]*\s*)$/i;

            const result = regex.exec(image.src)
            if (result && result.groups && result.groups) {
                setContent({
                    dataInB64: result.groups.data,
                    editable: content.editable,
                    mimeType: content.mimeType,
                    uniqueContentID: content.uniqueContentID,
                    updatePeriodInSeconds: content.updatePeriodInSeconds,
                    AbstractSiteContentType: "SiteContentImage"
                } as SiteContentImage)
                setVisible(false)
            }
        }
    }

    if (image) {
        return (
            <ThemedView style={[styles.imageEditorContainer]}>
                <ImageJSX
                    style={{ width: image.width, height: image.height, }}
                    source={{ uri: image.src }}
                />
                <ThemedView style={[styles.imageEditorButtonsContainer]}>
                    <CancelButton setVisible={setVisible} />
                    <ConfirmButton setVisible={setVisible} confirm={confirmImage} />
                </ThemedView>
            </ThemedView>
        )
    } else {
        return (
            <ThemedView style={[styles.imageEditorContainer]}>
                <UploadButton onPress={chooseImage} />
            </ThemedView>
        )
    }
}

const styles = StyleSheet.create(theme => ({
    imageEditorContainer: {
        padding: 5,
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    imageEditorButtonsContainer: {
        alignSelf: "stretch",
        flexDirection: "row",
        marginTop: 20,
        // backgroundColor: "red",
        gap: "10%",
        justifyContent: "center",
    },
    confirmContainer: {

    },
    confirmText: {

    }
}))

