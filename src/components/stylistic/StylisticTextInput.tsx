import { TextInput, TextInputProps } from "react-native";
import { ThemedTextInput } from "../themed/ThemedTextInput";
import { forwardRef } from "react";
import { StyleSheet } from "react-native-unistyles";

/**
 * TextInput in the fashion of \<Text /\>.
 *
 * @remarks
 * This Dropdown component is a direct extension of the ThemedTextInput.
 * It is further modified to make all visible Text the size of \<Text /\> which by definition should represent html's \<p /\>
 *
 * @readonly
 * @public
 */
export const StylisticTextInput = forwardRef<TextInput, TextInputProps>(
  (props, ref) => {
    return (
      <ThemedTextInput
        {...props}
        style={[styles.text, props.style]}
        ref={ref}
      />
    );
  }
);


const styles = StyleSheet.create(theme => ({
  text: {
    fontSize: theme.info.fontSize,
    fontFamily: theme.info.fontFamily,
  },
}))
