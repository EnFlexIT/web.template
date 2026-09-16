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

export function NavigationExampleTab() {
  return (
    <View
      style={
        styles.container
      }
    >
      <Card padding="md">
        <H2>
          Application Navigation
        </H2>

        <ThemedText>
          Application navigation is configured in
          src/application/config/navigation.properties.
        </ThemedText>

        <ThemedText>
          Application developers do not need to know
          internal menu IDs or Template navigation details.
        </ThemedText>
      </Card>

      <Card padding="md">
        <H2>
          Add a Menu
        </H2>

        <ThemedText>
          A new Application menu can be declared with a
          semantic menu key.
        </ThemedText>

        <CodeExample
          code={`menu.example.enabled=true
menu.example.caption=exampleApplication
menu.example.parent=settings
menu.example.position=99
menu.example.screen=example-screen`}
        />

        <ThemedText>
          The Generator assigns the internal menu ID
          automatically.
        </ThemedText>
      </Card>

      <Card padding="md">
        <H2>
          Add an Application Tab
        </H2>

        <ThemedText>
          Tabs that belong to the Application navigation
          are configured in the same navigation.properties
          file.
        </ThemedText>

        <CodeExample
          code={`tab.example.overview.enabled=true
tab.example.overview.caption=Overview
tab.example.overview.position=1
tab.example.overview.screen=overview-screen`}
        />

        <ThemedText>
          The first key identifies the parent menu.
          The second key identifies the tab.
        </ThemedText>
      </Card>

      <Card padding="md">
        <H2>
          Add a Screen
        </H2>

        <ThemedText>
          Navigable Application screens are stored below
          src/application/screens.
        </ThemedText>

        <CodeExample
          code={`src/application/screens/ExampleScreen.tsx

export function ExampleScreen() {
  return (
    // Application content
  );
}`}
        />

        <ThemedText>
          Files ending with Screen.tsx are discovered
          automatically.
        </ThemedText>

        <ThemedText>
          ExampleScreen.tsx becomes the registry key
          example-screen.
        </ThemedText>
      </Card>

      <Card padding="md">
        <H2>
          Generate Navigation
        </H2>

        <ThemedText>
          After changing Application configuration,
          screens or assets, run the generator.
        </ThemedText>

        <CodeExample
          code={`npm run config:generate`}
        />

        <ThemedText>
          The Generator validates the configuration and
          creates the required TypeScript wiring.
        </ThemedText>
      </Card>

      <Card padding="md">
        <H2>
          Important Rule
        </H2>

        <ThemedText>
          Application developers configure what should
          exist.
        </ThemedText>

        <ThemedText>
          The Base Template and its generators decide how
          the technical navigation is implemented.
        </ThemedText>

        <CodeExample
          code={`Application
    ↓
navigation.properties
    ↓
Generator
    ↓
Generated navigation
    ↓
Base Template`}
        />
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