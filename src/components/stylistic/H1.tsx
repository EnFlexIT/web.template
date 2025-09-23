import { TextProps } from "react-native";
import { ThemedText } from "../themed/ThemedText";
import { StyleSheet } from "react-native-unistyles";

/**
 * Automatically styled text.
 *
 * @remarks
 * This Text should by nature be used for the biggest type of heading.
 * It is this package's equivalent of the html element \<h1/\>
 *
 * @readonly
 * @public
 */
export function H1(props: TextProps) {
  return <ThemedText {...props} style={[styles.h1, props.style]} />;
}

const styles = StyleSheet.create(theme => ({
  h1: {
    fontSize: theme.info.fontSize + 8,
    fontFamily: theme.info.fontFamily,
    fontWeight: "bold",
  },
}))
