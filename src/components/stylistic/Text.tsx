import { TextProps } from "react-native";
import { ThemedText } from "../themed/ThemedText";
import { StyleSheet } from "react-native-unistyles";
/**
 * Automatically styled text.
 *
 * @remarks
 * This is the package's equivalent of the html element \<p/\>
 *
 * @readonly
 * @public
 */
export function Text(props: TextProps) {
  return <ThemedText {...props} style={[styles.text, props.style]} />;
}

const styles = StyleSheet.create(theme => ({
  text: {
    fontSize: theme.info.fontSize,
    fontFamily: theme.info.fontFamily,
  },
}))
