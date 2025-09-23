import { forwardRef } from "react";
import { TextInput, TextInputProps } from "react-native";
import { StyleSheet } from "react-native-unistyles";

/**
 * Automatically styled react-native TextInput
 *
 * @readonly
 * @public
 */
export const ThemedTextInput = forwardRef<TextInput, TextInputProps>(
  (props, ref) => {
    return (
      <TextInput
        {...props}
        style={[styles.text, props.style]}
        ref={ref}
      />
    );
  }
);

const styles = StyleSheet.create(theme => ({
  text: {
    color: theme.colors.text
  }
}))
