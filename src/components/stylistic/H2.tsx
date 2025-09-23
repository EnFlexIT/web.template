import { TextProps } from "react-native";
import { ThemedText } from "../themed/ThemedText";
import { StyleSheet } from "react-native-unistyles";

/**
 * Automatically styled text.
 *
 * @remarks
 * This is the package's equivalent of the html element \<h2/\>
 *
 * @readonly
 * @public
 */
export function H2(props: TextProps) {
  return <ThemedText {...props} style={[styles.h2, props.style]} />;
}

const styles = StyleSheet.create(theme => ({
  h2: {
    fontSize: theme.info.fontSize + 6,
    fontFamily: theme.info.fontFamily,
  },
}))
