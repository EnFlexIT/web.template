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

export function LayoutExampleTab() {
  return (
    <View
      style={
        styles.container
      }
    >
      <Card padding="md">
        <H2>
          Application Layout
        </H2>

        <ThemedText>
          Application screens can combine Base Template
          components with React Native layout primitives.
        </ThemedText>

        <ThemedText>
          Applications should reuse the Design System
          wherever possible and keep layout-specific
          styling inside the Application.
        </ThemedText>
      </Card>

      <Card padding="md">
        <H2>
          Vertical Layout
        </H2>

        <View
          style={
            styles.verticalExample
          }
        >
          <Card padding="md">
            <ThemedText>
              First section
            </ThemedText>
          </Card>

          <Card padding="md">
            <ThemedText>
              Second section
            </ThemedText>
          </Card>

          <Card padding="md">
            <ThemedText>
              Third section
            </ThemedText>
          </Card>
        </View>

        <CodeExample
          code={`<View style={styles.container}>
  <Card padding="md">
    First section
  </Card>

  <Card padding="md">
    Second section
  </Card>
</View>`}
        />
      </Card>

      <Card padding="md">
        <H2>
          Responsive Row
        </H2>

        <ThemedText>
          flexWrap can be used when content should move
          automatically depending on the available width.
        </ThemedText>

        <View
          style={
            styles.rowExample
          }
        >
          <View
            style={
              styles.layoutItem
            }
          >
            <Card padding="md">
              <ThemedText>
                Item A
              </ThemedText>
            </Card>
          </View>

          <View
            style={
              styles.layoutItem
            }
          >
            <Card padding="md">
              <ThemedText>
                Item B
              </ThemedText>
            </Card>
          </View>

          <View
            style={
              styles.layoutItem
            }
          >
            <Card padding="md">
              <ThemedText>
                Item C
              </ThemedText>
            </Card>
          </View>
        </View>

        <CodeExample
          code={`row: {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 12,
}

item: {
  flexGrow: 1,
  flexBasis: 220,
}`}
        />
      </Card>

      <Card padding="md">
        <H2>
          Nested Content
        </H2>

        <ThemedText>
          Screens can compose smaller sections without
          introducing Template-specific dependencies.
        </ThemedText>

        <View
          style={
            styles.nestedExample
          }
        >
          <Card padding="md">
            <H2>
              Dashboard Area
            </H2>

            <ThemedText>
              Application-owned content can be nested
              inside reusable Design System containers.
            </ThemedText>
          </Card>
        </View>
      </Card>

      <Card padding="md">
        <H2>
          Layout Principle
        </H2>

        <CodeExample
          code={`Application Screen
        ↓
Layout composition
        ↓
Design System components
        ↓
Base Template styling`}
        />

        <ThemedText>
          The Application owns its screen composition.
          Reusable visual building blocks remain part of
          the Base Template Design System.
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

    verticalExample: {
      marginTop: 16,
      gap: 12,
    },

    rowExample: {
      marginTop: 16,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },

    layoutItem: {
      flexGrow: 1,
      flexBasis: 220,
    },

    nestedExample: {
      marginTop: 16,
    },
  }));