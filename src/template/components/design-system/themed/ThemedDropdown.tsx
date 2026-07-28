import { Dropdown } from "react-native-element-dropdown";
import { DropdownProps } from "react-native-element-dropdown/lib/typescript/components/Dropdown/model";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

/**
 * Automatically styled Dropdown from the library react-native-element-dropdown
 *
 * @readonly
 * @public
 */
export function ThemedDropdown<T>(props: DropdownProps<T>) {
  const { theme } = useUnistyles()

  return (
    <Dropdown
      {...props}
      style={[
        styles.backgroundColor,
        props.style,
      ]}
      containerStyle={[
        styles.backgroundColor,
        props.containerStyle,
      ]}
      itemTextStyle={[
        styles.backgroundColor,
        styles.color,
        props.itemTextStyle,
      ]}
      placeholderStyle={[
        styles.backgroundColor,
        styles.color,
        props.placeholderStyle,
      ]}
      selectedTextStyle={[
        styles.backgroundColor,
        styles.color,
        props.selectedTextStyle,
      ]}
      itemContainerStyle={[
        styles.backgroundColor,
        props.itemContainerStyle,
      ]}
      activeColor={theme.colors.card}
      iconStyle={[
        styles.tintColor,
        props.iconStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create(theme => ({
  backgroundColor: {
    backgroundColor: theme.colors.card
  },
  color: {
    color: theme.colors.text,
  },
  tintColor: {
    tintColor: theme.colors.text
  }
}))
