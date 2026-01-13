/**
 * This Component wraps the React Native Text and should be used as an replacement wherever available.
 * Automatically sets the right text color and other properties described in the theme
 */

import { Text, TextProps } from "react-native";
import { StyleSheet } from "react-native-unistyles";

/**
 * Automatically styled react-native Text
 *
 * @readonly
 * @public
 */
export function ThemedText(props: TextProps) {
  return <Text {...props} style={[styles.text, props.style]} />;
}

const styles = StyleSheet.create((theme) => ({
  text: {
    color: theme.colors.text,
  },
}));
