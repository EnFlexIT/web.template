import { DropdownProps } from "react-native-element-dropdown/lib/typescript/components/Dropdown/model";
import { ThemedDropdown } from "../themed/ThemedDropdown";
import { StyleSheet } from "react-native-unistyles";

/**
 * Dropdown in the fashion of \<Text /\>.
 *
 * @remarks
 * This Dropdown component is a direct extension of the ThemedDropdown.
 * It is further modified to make all visible Text the size of \<Text /\> which by definition should represent html's \<p /\>
 *
 * @readonly
 * @public
 */
export function StylisticDropdown<T>(props: DropdownProps<T>) {
  return (
    <ThemedDropdown
      {...props}
      itemTextStyle={[styles.text, props.itemTextStyle]}
      selectedTextStyle={[styles.text, props.selectedTextStyle]}
      placeholderStyle={[styles.text, props.placeholderStyle]}
    />
  );
}

const styles = StyleSheet.create(theme => ({
  text: {
    fontSize: theme.info.fontSize,
    fontFamily: theme.info.fontFamily,
  },
}))
