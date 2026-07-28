import { View, ViewProps } from "react-native";
import { StyleSheet } from "react-native-unistyles";

/**
 * Automatically styled react-native View
 *
 * @readonly
 * @public
 */
export function ThemedView(props: ViewProps) {
  return (
    <View
      {...props}
      style={[styles.container, props.style]}
    />
  );
}

const styles = StyleSheet.create(theme => ({
  container: {
    backgroundColor: theme.colors.background,
  }
}))
