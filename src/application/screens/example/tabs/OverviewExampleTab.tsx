import {
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

export function OverviewExampleTab() {
  return (
    <View
      style={
        styles.container
      }
    >
      <Card padding="md">
        <H2>
          Application Playground
        </H2>

        <ThemedText>
          This area demonstrates how an Application can extend
          the Base Template without changing Template internals.
        </ThemedText>

        <ThemedText>
          The architecture follows:
          Application → Template → Core.
        </ThemedText>
      </Card>

      <Card padding="md">
        <H2>
          How it works
        </H2>

        <ThemedText>
          Application developers configure features, navigation,
          screens, assets and optional state inside
          src/application.
        </ThemedText>

        <ThemedText>
          Build-time generators discover Application content and
          create the technical wiring automatically.
        </ThemedText>
      </Card>

      <Card padding="md">
        <H2>
          Application structure
        </H2>

        <ThemedText>
          config/ - Application configuration
        </ThemedText>

        <ThemedText>
          screens/ - Application-owned screens
        </ThemedText>

        <ThemedText>
          assets/ - Application images
        </ThemedText>

        <ThemedText>
          i18n/ - Application translations
        </ThemedText>

        <ThemedText>
          state/ - Optional Application Redux state
        </ThemedText>

        <ThemedText>
          generated/ - Automatically generated files
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
  }));