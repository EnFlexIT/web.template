import { Image as ImageJSX, View } from "react-native";
import React, { Dispatch, SetStateAction, useState } from "react";

// Dynamic-Content-Api
import {
  AbstractSiteContent as AbstractSiteContentType,
  SiteContentImage,
} from "../../../api/implementation/Dynamic-Content-Api";

// Picker
import * as DocumentPicker from "expo-document-picker";

// UI Elements
import { XButton } from "./XButton";
import { ActionButton } from "../../ui-elements/ActionButton";

// Styling
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
    const result = await DocumentPicker.getDocumentAsync({
      type: content.mimeType,
    });

    try {
      if (!result.canceled && result.assets) {
        const [asset] = result.assets;
        const img = new Image();
        img.onload = () => setImage(img);
        img.src = asset.uri;
      }
    } catch (e) {
      console.error("Error while trying to pick image", e);
    }
  }

  async function confirmImage() {
    if (!image) return;

    const regex =
      /^\s*data:(?<media_type>(?<mime_type>[a-z\-]+\/[a-z\-\+]+)(?<params>(;[a-z\-]+\=[a-z\-]+)*))?(?<encoding>;base64)?,(?<data>[a-z0-9\!\$\&\'\,\(\)\*\+\,\;\=\-\.\_\~\:\@\/\?\%\s]*\s*)$/i;

    const result = regex.exec(image.src);

    if (result?.groups?.data) {
      setContent({
        dataInB64: result.groups.data,
        editable: content.editable,
        mimeType: content.mimeType,
        uniqueContentID: content.uniqueContentID,
        updatePeriodInSeconds: content.updatePeriodInSeconds,
        AbstractSiteContentType: "SiteContentImage",
      } as SiteContentImage);

      setVisible(false);
    }
  }

  /* -------------------------
     RENDER
  --------------------------*/

  // ✅ Bild wurde ausgewählt
  if (image) {
    return (
      <ThemedView style={styles.imageEditorContainer}>
        <View style={styles.closeButtonContainer}>
          <XButton onPress={() => setVisible(false)} />
        </View>

        <ImageJSX
          style={{ width: image.width, height: image.height }}
          source={{ uri: image.src }}
        />

        <ThemedView style={styles.imageEditorButtonsContainer}>
          <ActionButton
            label="Abbrechen"
            variant="secondary"
            onPress={() => setVisible(false)}
          />

          <ActionButton
            label="Bestätigen"
            variant="primary"
            onPress={confirmImage}
          />
        </ThemedView>
      </ThemedView>
    );
  }

  // ✅ Noch kein Bild → Upload über ActionButton mit Icon
  return (
    <ThemedView style={styles.imageEditorContainer}>
      <View style={styles.closeButtonContainer}>
        <XButton onPress={() => setVisible(false)} />
      </View>

      <ActionButton
        icon="upload"
        iconSize={60}
        onPress={chooseImage}
      />
    </ThemedView>
  );
}

/* -------------------------
   STYLES
--------------------------*/
const styles = StyleSheet.create({
  imageEditorContainer: {
    padding: 5,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  closeButtonContainer: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 999,
  },

  imageEditorButtonsContainer: {
    alignSelf: "stretch",
    flexDirection: "row",
    marginTop: 20,
    gap: "10%",
    justifyContent: "center",
  },
});
