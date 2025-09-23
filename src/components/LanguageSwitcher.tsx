import { DropdownProps } from 'react-native-element-dropdown/lib/typescript/components/Dropdown/model';
import { useUnistyles } from 'react-native-unistyles';
import { useTranslation } from "react-i18next"
import { StylisticDropdown } from './stylistic/StylisticDropdown';

export const data = [
  { label: 'Deutsch', value: 'de' },
  { label: 'Englisch', value: 'en' },
];

type LanguageSwitcherProps<T> = Omit<
  DropdownProps<T>,
  | 'onChange'
  | 'data'
  | 'valueField'
  | 'labelField'
  | 'activeColor'
  | 'placeholder'
>;

export function LanguageSwitcher<T>(props: LanguageSwitcherProps<T>) {
  const { theme } = useUnistyles()
  const { i18n } = useTranslation()

  return (
    <StylisticDropdown
      data={data}
      labelField="label"
      onChange={({ value }) => {
        i18n.changeLanguage(value);
      }}
      valueField="value"
      style={[
        {
          width: 100,
        },
        props.style,
      ]}
      containerStyle={[
        {
          backgroundColor: theme.colors.card,
          // backgroundColor: 'green',
          // height: 30,
        },
        props.containerStyle,
      ]}
      itemTextStyle={[
        {
          color: theme.colors.text,
        },
        props.itemTextStyle,
      ]}
      placeholderStyle={[
        {
          color: theme.colors.text,
        },
        props.placeholderStyle,
      ]}
      selectedTextStyle={[
        {
          // backgroundColor: theme.colors.card,
          color: theme.colors.text,
        },
        props.selectedTextStyle,
      ]}
      itemContainerStyle={[
        {
          // backgroundColor: theme.colors.card,
        },
        props.itemContainerStyle,
      ]}
      iconStyle={[
        {
          tintColor: theme.colors.text,
        },
        props.iconStyle,
      ]}
      activeColor={theme.colors.card}
      placeholder={(() => {
        switch (i18n.language) {
          case 'de':
            return 'Deutsch';
          case 'en':
            return 'Englisch';
          default:
            return 'NA';
        }
      })()}
    />
  );
}
