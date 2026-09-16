import {
  View,
} from "react-native";

import {
  StyleSheet,
  useUnistyles,
} from "react-native-unistyles";

import {
  ThemedText,
} from "@design-system";

type CodeExampleProps = {
  code: string;
};

export function CodeExample({
  code,
}: CodeExampleProps) {
  const {
    theme,
  } = useUnistyles();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor:
            theme.colors.card,
          borderColor:
            theme.colors.border,
        },
      ]}
    >
      <ThemedText
        style={
          styles.code
        }
      >
        {code}
      </ThemedText>
    </View>
  );
}

const styles =
  StyleSheet.create(() => ({
    container: {
      marginTop: 12,
      padding: 16,
      borderWidth: 1,
      borderRadius: 6,
    },

    code: {
      fontFamily:
        "monospace",
    },
  }));