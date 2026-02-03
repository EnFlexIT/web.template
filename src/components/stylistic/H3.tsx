import { TextProps } from "react-native";
import { ThemedText } from "../themed/ThemedText";
import { StyleSheet } from "react-native-unistyles";

/**
 * Automatically styled text.
 *
 * @remarks
 * This is the package's equivalent of the html element \<h3/\>
 *
 * @readonly
 * @public
 */
export function H3(props: TextProps) {
  return <ThemedText {...props} style={[styles.h3, props.style]} />;
}

const styles = StyleSheet.create(theme => ({
  h3: {
    fontSize: theme.info.fontSize + 4,
    fontFamily: theme.info.fontFamily,
    fontWeight: "bold",
  },
}))
