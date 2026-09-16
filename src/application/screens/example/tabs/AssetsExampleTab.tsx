import {
  Image,
  View,
} from "react-native";

import {
  StyleSheet,
} from "react-native-unistyles";

import {
  Card,
  H2,
  ThemedText,
} from "@design-system";

import {
  ApplicationImages,
} from "../../../generated/applicationAssets.generated";

export function AssetsExampleTab() {
  return (
    <View
      style={
        styles.container
      }
    >
      <Card padding="md">
        <H2>
          Application Assets
        </H2>

        <ThemedText>
          Application images are stored in
          src/application/assets.
        </ThemedText>

        <ThemedText>
          The asset generator discovers supported images
          automatically and creates the ApplicationImages registry.
        </ThemedText>
      </Card>

      <Card padding="md">
        <H2>
          Live Example
        </H2>

        <Image
          source={
            ApplicationImages.solar
          }
          style={
            styles.image
          }
          resizeMode="contain"
        />

        <ThemedText>
          This image is loaded through ApplicationImages.solar.
        </ThemedText>
      </Card>

      <Card padding="md">
        <H2>
          How to add an image
        </H2>

        <ThemedText>
          1. Add the image to:
        </ThemedText>

        <ThemedText>
          src/application/assets/solar.png
        </ThemedText>

        <ThemedText>
          2. Run:
        </ThemedText>

        <ThemedText>
          npm run config:generate
        </ThemedText>

        <ThemedText>
          3. Use the generated asset:
        </ThemedText>

        <ThemedText>
          ApplicationImages.solar
        </ThemedText>
      </Card>

      <Card padding="md">
        <H2>
          Important
        </H2>

        <ThemedText>
          Generated files must not be edited manually.
        </ThemedText>

        <ThemedText>
          Developers only add or remove images inside the
          Application assets directory.
        </ThemedText>
      </Card>
    </View>
  );
}

const styles =
  StyleSheet.create(() => ({
    container: {
      width: "100%",
      gap: 16,
    },

    image: {
      width: "100%",
      height: 240,
      marginVertical: 16,
    },
  }));