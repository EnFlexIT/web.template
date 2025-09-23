import { Dispatch, ReactNode, useEffect, useState } from "react"
import { SiteContentImage as SiteContentImageType } from "../../../api/implementation/Dynamic-Content-Api"
// import * as DocumentPicker from 'expo-document-picker';
import { Image as ImageJSX, Pressable } from "react-native";
// import { AbstractSiteContent as AbstractSiteContentType } from "../../api/implementation/Dynamic-Content-Api"
// import { ThemedText } from "enflex.it-styled-ui"

interface SiteContentImageProps {
    content: SiteContentImageType,
    setChangerVisible: Dispatch<React.SetStateAction<boolean>>,
}
export function SiteContentImage({ content, setChangerVisible }: SiteContentImageProps) {

    const [node, setNode] = useState<ReactNode>(undefined)

    useEffect(() => {
        const image = new Image()
        image.onload = function () {
            if (content.editable) {
                setNode(
                    <Pressable onPress={() => setChangerVisible(true)}>
                        <ImageJSX
                            style={{ width: image.width, height: image.height, }}
                            source={{ uri: image.src }}
                        />
                    </Pressable>
                )
            } else {
                setNode(
                    <ImageJSX
                        style={{ width: image.width, height: image.height, }}
                        source={{ uri: image.src }}
                    />
                )
            }
        }
        image.src = `data:${content.mimeType};base64,${content.dataInB64}`
    }, [content])


    return node
}
