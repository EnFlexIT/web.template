# Components

The project contains a component layer for layout, theming, routing and reusable UI elements.

## Layout components

| File | Purpose |
| --- | --- |
| `src/components/Header.tsx` | Drawer header, breadcrumbs and toolbox integration. |
| `src/components/Footer.tsx` | Server dropdown, notification button and test release badge. |
| `src/components/Navigation.tsx` | Drawer navigation rendering. |
| `src/components/Screen.tsx` | Common screen wrapper. |
| `src/components/Logo.tsx` | Application logo. |
| `src/components/NotificationPopup.tsx` | Popup for local notifications. |
| `src/components/DataPermissionsDialog.tsx` | Data permission dialog. |

## Themed and stylistic components

`src/components/themed` contains low-level components that apply theme colors from Unistyles.

`src/components/stylistic` contains higher-level text/input components with predefined sizes and typography, for example `H1`, `H2`, `H3`, `H4`, `Text` and `StylisticTextInput`.

## UI elements

`src/components/ui-elements` contains reusable application controls:

| Component | Purpose |
| --- | --- |
| `ActionButton` | Button with variants, sizes, optional icon and tooltip. |
| `BaseModal` | Basic modal shell. |
| `Card` | Themed card wrapper with optional press behavior. |
| `Checkbox` | Basic checkbox row. |
| `ConfirmDialog` / `ConfirmModal` | Confirmation dialogs. |
| `Dropdown` | Reusable dropdown with size and menu appearance options. |
| `HeroCard`, `MetricCard`, `SmallStat` | Dashboard/statistic style cards. |
| `Infobox` | Reusable info/status box. |
| `SelectableList` | List control for selectable items. |
| `SettingsNavCard` | Navigation card for settings areas. |
| `Tab` / `TabsBar` | Generic tabs UI. |
| `TableSwitchCell` | Switch cell used in table/setting rows. |
| `TextInput` | Application text input with password support. |
| `ThemeModeSwitchRow` | Settings row with switch and optional status text. |
| `WebPasswordInput` | Web-specific password input implementation. |

## Routing components

| File | Purpose |
| --- | --- |
| `src/components/routing/menuPaths.ts` | Builds slug paths from menu IDs and captions. |
| `src/components/routing/useMenuNavigation.ts` | Navigates by menu ID and updates Redux active menu. |

## Dynamic content components

`src/components/dynamic/content` renders dynamic site content returned by the backend. `src/components/dynamic/editors` contains editor controls for dynamic content editing.

## Rich text editor

`src/components/richtexteditor` contains Tiptap-based rich text editor UI and icons.
