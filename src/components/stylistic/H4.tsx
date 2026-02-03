import { TextProps } from "react-native";
import { ThemedText } from "../themed/ThemedText";
import { StyleSheet } from "react-native-unistyles";

/**
 * Automatically styled text.
 *
 * @remarks
 * This is the package's equivalent of the html element \<h4/\>
 *
 * @readonly
 * @public
 */
export function H4(props: TextProps) {
  return <ThemedText {...props} style={[styles.h4, props.style]} />;
}

const styles = StyleSheet.create(theme => ({
  h4: {
    fontSize: theme.info.fontSize ,
    fontFamily: theme.info.fontFamily,
    fontWeight: "bold",
    
  },
}))
