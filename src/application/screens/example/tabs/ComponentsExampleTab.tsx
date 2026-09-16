import {
  useState,
} from "react";

import {
  View,
} from "react-native";

import {
  StyleSheet,
} from "react-native-unistyles";

import {
  ActionButton,
  Card,
  H2,
  ThemedText,
} from "@design-system";

import {
  CodeExample,
} from "../components/CodeExample";

export function ComponentsExampleTab() {
  const [
    clickCount,
    setClickCount,
  ] =
    useState(0);

  return (
    <View
      style={
        styles.container
      }
    >
      <Card padding="md">
        <H2>
          Components
        </H2>

        <ThemedText>
          This area demonstrates reusable components
          provided by the Base Template Design System.
        </ThemedText>

        <ThemedText>
          Application developers should prefer these
          components instead of implementing their own
          versions of common UI elements.
        </ThemedText>
      </Card>

      <Card padding="md">
        <H2>
          ActionButton
        </H2>

        <ThemedText>
          ActionButton is the standard interactive button
          provided by the Design System.
        </ThemedText>

        <View
          style={
            styles.example
          }
        >
          <ActionButton
            label="Try it"
            variant="primary"
            onPress={() =>
              setClickCount(
                (current) =>
                  current + 1,
              )
            }
          />

          <ThemedText>
            Button pressed:
            {" "}
            {clickCount}
            {" "}
            times
          </ThemedText>
        </View>

        <CodeExample
          code={`<ActionButton
  label="Try it"
  variant="primary"
  onPress={() => {}}
/>`}
        />
      </Card>

      <Card padding="md">
        <H2>
          Variants
        </H2>

        <View
          style={
            styles.example
          }
        >
          <ActionButton
            label="Primary"
            variant="primary"
            onPress={() => {}}
          />

          <ActionButton
            label="Secondary"
            variant="secondary"
            onPress={() => {}}
          />

          <ActionButton
            label="Disabled"
            disabled
            onPress={() => {}}
          />
        </View>
      </Card>

      <Card padding="md">
        <H2>
          Sizes
        </H2>

        <View
          style={
            styles.example
          }
        >
          <ActionButton
            label="Extra Small"
            size="xs"
            onPress={() => {}}
          />

          <ActionButton
            label="Small"
            size="sm"
            onPress={() => {}}
          />

          <ActionButton
            label="Medium"
            size="md"
            onPress={() => {}}
          />
        </View>
      </Card>

      <Card padding="md">
        <H2>
          Card
        </H2>

        <ThemedText>
          Card provides a reusable container for grouped
          content. The examples on this page are already
          displayed inside Card components.
        </ThemedText>

        <CodeExample
          code={`<Card padding="md">
  <ThemedText>
    Content
  </ThemedText>
</Card>`}
        />
      </Card>

      <Card padding="md">
        <H2>
          Typography
        </H2>

        <ThemedText>
          H2 can be used for section headings.
        </ThemedText>

        <ThemedText>
          ThemedText automatically follows the active
          application theme.
        </ThemedText>

        <CodeExample
          code={`<H2>
  Section title
</H2>

<ThemedText>
  Application content
</ThemedText>`}
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

    example: {
      marginTop: 16,
      gap: 12,
    },
  }));