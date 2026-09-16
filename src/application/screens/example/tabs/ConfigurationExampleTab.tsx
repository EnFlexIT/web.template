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

import {
  CodeExample,
} from "../components/CodeExample";

export function ConfigurationExampleTab() {
  return (
    <View
      style={
        styles.container
      }
    >
      <Card padding="md">
        <H2>
          Application Configuration
        </H2>

        <ThemedText>
          Application-specific configuration is stored
          inside src/application/config.
        </ThemedText>

        <ThemedText>
          Application developers describe what their
          Application needs without editing Template
          internals.
        </ThemedText>
      </Card>

      <Card padding="md">
        <H2>
          application.properties
        </H2>

        <ThemedText>
          This file defines the identity and basic
          metadata of the Application.
        </ThemedText>

        <CodeExample
          code={`ApplicationId=example-app
ApplicationTitle=Example Application
ApplicationContact=admin@example.com
ApplicationOwner=EnFlex.IT`}
        />

        <ThemedText>
          These values are read by the build-time
          configuration generator.
        </ThemedText>
      </Card>

      <Card padding="md">
        <H2>
          features.properties
        </H2>

        <ThemedText>
          Reusable Base Template features can be enabled
          or disabled without changing Template code.
        </ThemedText>

        <CodeExample
          code={`feature.notifications.enabled=true
feature.appearance.enabled=true
feature.serverSettings.enabled=true
feature.liveConsole.enabled=false
feature.programStart.enabled=false`}
        />

        <ThemedText>
          The Application selects the features it needs.
          The Base Template owns their implementation.
        </ThemedText>
      </Card>

      <Card padding="md">
        <H2>
          Generate Configuration
        </H2>

        <ThemedText>
          After changing configuration, navigation,
          screens or assets, run:
        </ThemedText>

        <CodeExample
          code={`npm run config:generate`}
        />

        <ThemedText>
          The generator validates the Application and
          creates the required TypeScript configuration.
        </ThemedText>
      </Card>

      <Card padding="md">
        <H2>
          Generated Files
        </H2>

        <ThemedText>
          Generated files are stored in
          src/application/generated.
        </ThemedText>

        <CodeExample
          code={`src/application/generated/
├── applicationConfig.generated.ts
├── applicationScreenRegistry.generated.ts
└── applicationAssets.generated.ts`}
        />

        <ThemedText>
          These files must not be edited manually.
        </ThemedText>

        <ThemedText>
          They are recreated automatically from the
          Application source files and configuration.
        </ThemedText>
      </Card>

      <Card padding="md">
        <H2>
          Configuration Principle
        </H2>

        <CodeExample
          code={`Application configuration
        ↓
Generator
        ↓
Generated TypeScript
        ↓
Base Template runtime`}
        />

        <ThemedText>
          The Application describes what should exist.
          The Template decides how it is implemented.
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