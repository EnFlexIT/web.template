import {
  Image,
  View,
} from "react-native";

import {
  useTranslation,
} from "react-i18next";

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
} from "../generated/applicationAssets.generated";

/**
 * Minimal example of an Application-owned screen.
 *
 * The screen is not part of the Base Template.
 * It demonstrates how an Application can provide
 * its own screen, translations and assets.
 */
export function ExampleScreen() {
  const {
    t,
  } = useTranslation(
    "ExampleApplication",
  );

  return (
    <View
      style={
        styles.container
      }
    >
      <Card padding="md">
        <H2>
          {t("title")}
        </H2>

        <ThemedText>
          {t("description")}
        </ThemedText>

        <ThemedText>
          {t("extensionHint")}
        </ThemedText>

        <Image
          source={
            ApplicationImages.solar
          }
          style={
            styles.image
          }
          resizeMode="contain"
        />
      </Card>
    </View>
  );
}

const styles =
  StyleSheet.create(() => ({
    container: {
      width: "100%",
      padding: 16,
    },

    image: {
      width: "100%",
      height: 220,
      marginTop: 16,
    },
  }));