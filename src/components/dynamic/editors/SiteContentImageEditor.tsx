import { Image as ImageJSX, View } from "react-native";
import React, { Dispatch, SetStateAction, useState } from "react";
//Dynamic-Content-Api
import {
    AbstractSiteContent as AbstractSiteContentType,
    SiteContentImage
} from "../../../api/implementation/Dynamic-Content-Api";
//picker
import * as DocumentPicker from "expo-document-picker";
//Elmente 
import { CancelButton } from "./CancelButton";
import { ConfirmButton } from "./ConfirmButton";
import { UploadButton } from "./UploadButton";
import { XButton } from "./XButton";
//StyleSheet
import { StyleSheet } from "react-native-unistyles";
import { ThemedView } from "../../themed/ThemedView";


interface SiteContentImageEditorProps {
    siteContentImage: SiteContentImage;
    setContent: Dispatch<React.SetStateAction<AbstractSiteContentType>>;
    setVisible: Dispatch<SetStateAction<boolean>>;
}

export function SiteContentImageEditor({
    siteContentImage: content,
    setVisible,
    setContent,
}: SiteContentImageEditorProps) {
    const [image, setImage] = useState<HTMLImageElement | undefined>(undefined);

    async function chooseImage() {
        const l = await DocumentPicker.getDocumentAsync({
            type: content.mimeType
        });

        try {
            if (!l.canceled && l.assets) {
                const [asset] = l.assets;
                const img = new Image();
                img.onload = function () {
                    setImage(img);
                };
                img.src = asset.uri;
            }
        } catch (e) {
            console.error(`Error while trying to pick image`);
            console.error(e);
        }
    }

    async function confirmImage() {
        if (image) {
            console.log(image.src);
            /* Regex parsing */
            const regex =
                /^\s*data:(?<media_type>(?<mime_type>[a-z\-]+\/[a-z\-\+]+)(?<params>(;[a-z\-]+\=[a-z\-]+)*))?(?<encoding>;base64)?,(?<data>[a-z0-9\!\$\&\'\,\(\)\*\+\,\;\=\-\.\_\~\:\@\/\?\%\s]*\s*)$/i;

            const result = regex.exec(image.src);
            if (result && result.groups) {
                setContent({
                    dataInB64: result.groups.data,
                    editable: content.editable,
                    mimeType: content.mimeType,
                    uniqueContentID: content.uniqueContentID,
                    updatePeriodInSeconds: content.updatePeriodInSeconds,
                    AbstractSiteContentType: "SiteContentImage"
                } as SiteContentImage);

                setVisible(false);
            }
        }
    }

    /* -------------------------
       RENDER BEREICH
    --------------------------*/

    // Wenn bereits ein Bild ausgewählt wurde
    if (image) {
        return (
            <ThemedView style={[styles.imageEditorContainer]}>

               
                <View style={styles.closeButtonContainer}>
                    <XButton onPress={() => setVisible(false)} />
                </View>

                <ImageJSX
                    style={{ width: image.width, height: image.height }}
                    source={{ uri: image.src }}
                />

                <ThemedView style={[styles.imageEditorButtonsContainer]}>
                    <CancelButton setVisible={setVisible} />
                    <ConfirmButton setVisible={setVisible} confirm={confirmImage} />
                </ThemedView>
            </ThemedView>
        );
    }

    // Wenn NOCH kein Bild ausgewählt wurde
    return (
        <ThemedView style={[styles.imageEditorContainer]}>

            {/*Blur X Button */}
            <View style={styles.closeButtonContainer}>
               <XButton onPress={() => setVisible(false)} />
            </View>

            <UploadButton onPress={chooseImage} />

        </ThemedView>
    );
}


/* -------------------------
   STYLES
--------------------------*/
const styles = StyleSheet.create((theme) => ({
    imageEditorContainer: {
        padding: 5,
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },

    /*  Glas-X */
    closeButtonContainer: {
        position: "absolute",
        top: 10,
        right: 10,
        zIndex: 999,
    },

    closeButtonBlur: {
        width: 34,
        height: 34,
        borderRadius: 17,
        overflow: "hidden",
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 5, // Android shadow
    },

    closeButtonPressable: {
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
    },

    imageEditorButtonsContainer: {
        alignSelf: "stretch",
        flexDirection: "row",
        marginTop: 20,
        gap: "10%",
        justifyContent: "center",
    },

    confirmContainer: {},
    confirmText: {},
}));
