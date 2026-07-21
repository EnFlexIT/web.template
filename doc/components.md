# Components

The project contains a reusable component layer for layout, theming, routing, dynamic content and shared UI elements.

The goal of this document is to explain which components exist, where they are located and how they should be reused across screens and features.

## Overview

The component layer is mainly organized into the following areas:

| Area | Path | Purpose |
| --- | --- | --- |
| Layout components | `src/components` | Shared application layout such as header, footer, screen wrapper and navigation. |
| UI elements | `src/components/ui-elements` | Reusable UI primitives such as buttons, cards, dialogs, dropdowns and inputs. |
| Themed components | `src/components/themed` | Low-level theme-aware components using Unistyles theme values. |
| Stylistic components | `src/components/stylistic` | Typography and input components with predefined styling. |
| Routing helpers | `src/components/routing` | Menu-based navigation utilities. |
| Dynamic content | `src/components/dynamic` | Rendering and editing dynamic backend-driven content. |
| Rich text editor | `src/components/richtexteditor` | Tiptap-based rich text editor components. |

## Layout components

Layout components define the global application frame and common UI structure.

| File | Purpose |
| --- | --- |
| `src/components/Header.tsx` | Drawer header, breadcrumbs and toolbox integration. |
| `src/components/Footer.tsx` | Footer with server dropdown, notification button, version information and test release badge. |
| `src/components/Navigation.tsx` | Drawer navigation rendering. |
| `src/components/Screen.tsx` | Common screen wrapper used by screens. |
| `src/components/Logo.tsx` | Application logo component. |
| `src/components/NotificationPopup.tsx` | Popup for local/application notifications. |
| `src/components/DataPermissionsDialog.tsx` | Dialog for data permission information and confirmation. |
| `src/components/Table.tsx` | Generic table component used for structured data. |
| `src/components/ToolBox.tsx` | Toolbox component for contextual actions. |

### Usage guideline

Layout components should be reused instead of rebuilding layout logic inside individual screens.

Screens should focus on feature-specific content and use common layout components for:

- header and footer integration
- consistent spacing
- navigation context
- notification access
- server information
- application status display

## UI Elements

`src/components/ui-elements` contains reusable UI primitives and controls.

These components should be preferred over custom one-off UI implementations inside screens.

### UI Elements overview

| Component | Purpose |
| --- | --- |
| `ActionButton` | Central reusable button component for user actions. |
| `BaseModal` | Basic modal shell used by modal/dialog implementations. |
| `Card` | Themed card wrapper with optional interaction behavior. |
| `Checkbox` | Basic checkbox row/control. |
| `ConfirmDialog` / `ConfirmModal` | Confirmation dialogs for destructive or important user actions. |
| `Dropdown` | Reusable dropdown component with configurable size and menu appearance. |
| `HeroCard` | Prominent card for dashboard or highlight content. |
| `MetricCard` | Card for displaying metrics or status values. |
| `SmallStat` | Compact statistic display component. |
| `Infobox` | Reusable information/status box. |
| `SelectableList` | List control for selectable items. |
| `SettingsNavCard` | Navigation card used in settings areas. |
| `Tab` / `TabsBar` | Generic tab UI components. |
| `TableSwitchCell` | Switch cell used in table or settings rows. |
| `TextInput` | Application text input with common styling and password support. |
| `ThemeModeSwitchRow` | Settings row with theme mode switch and optional status text. |
| `WebPasswordInput` | Web-specific password input implementation. |

---

## ActionButton

### Purpose and role

`ActionButton` is a central UI primitive for triggering user actions.

It is intended to provide one consistent action interface instead of creating many specialized button components such as:

- `UploadButton`
- `SaveButton`
- `CancelButton`
- `ConfirmButton`
- `DeleteButton`

The meaning of the button should come from its props, label, icon and context.

### Typical actions

`ActionButton` can be used for:

- navigation
- save actions
- cancel actions
- confirmation
- upload
- download
- edit
- delete
- close
- retry actions

### Location

```txt
src/components/ui-elements/ActionButton.tsx
```

### Basic usage

```tsx
<ActionButton
  label="Save"
  onPress={handleSave}
/>
```

### Icon action

```tsx
<ActionButton
  icon="upload"
  onPress={handleUpload}
/>
```

### Icon and label

```tsx
<ActionButton
  icon="edit"
  label="Edit"
  onPress={handleEdit}
/>
```

### Design idea

The component represents an action, not a specific business case.

Do not create a new button component only because the action has another label. Prefer configuring `ActionButton`.

### Best practices

Do:

- use `ActionButton` for repeated user actions
- configure meaning through props
- keep button styling centralized
- reuse the same component in screens, dialogs and settings pages

Do not:

- create separate button components for every action without a strong reason
- hardcode button colors in screens
- duplicate button styling in feature components
- place business logic inside the UI component

### Future extension points

Possible future extensions:

- loading state
- danger variant
- small / medium / large sizes
- tooltip
- confirmation before action
- improved accessibility labels

---

## Card

### Purpose and role

`Card` is a reusable visual container for grouped content.

It provides a consistent card appearance across the application and should be used when content needs to be visually separated from the surrounding screen.

### Location

```txt
src/components/ui-elements/Card.tsx
```

### Typical usage

Use `Card` for:

- settings blocks
- profile sections
- dashboard widgets
- grouped form content
- update information
- server status areas

### Example

```tsx
<Card>
  <ThemedText>Content inside the card</ThemedText>
</Card>
```

### Best practices

Do:

- use cards to group related content
- keep spacing consistent
- use theme-aware text/components inside cards

Do not:

- rebuild card styling in screens
- use inline background colors unless there is a strong reason
- use cards for every small element if no grouping is needed

---

## Infobox

### Purpose and role

`Infobox` is a reusable component for displaying informational, warning or status-related messages.

It helps present messages consistently across settings, update screens, server checks and configuration flows.

### Location

```txt
src/components/ui-elements/Infobox.tsx
```

### Typical usage

Use `Infobox` for:

- server status hints
- update information
- configuration upload explanations
- warning messages
- user guidance
- empty-state explanations

### Best practices

Do:

- use `Infobox` for explanatory messages
- keep the message short and clear
- use translations for user-facing text

Do not:

- hardcode long technical explanations directly in screens
- use different custom info boxes in every feature
- use alert dialogs for non-critical information

---

## ConfirmDialog / ConfirmModal

### Purpose and role

Confirmation dialogs are used when the user should explicitly confirm or cancel an action.

They are especially important for actions that:

- change application state
- start an update
- upload or overwrite configuration
- delete or reset something
- log out the user
- switch important settings

### Location

```txt
src/components/ui-elements/ConfirmDialog.tsx
src/components/ui-elements/ConfirmModal.tsx
```

### Typical usage

Use confirmation dialogs for important actions where accidental clicks should be avoided.

### Best practices

Do:

- use clear titles
- explain the consequence of the action
- provide cancel and confirm actions
- use translated labels

Do not:

- use confirmation dialogs for harmless actions
- use vague labels such as "OK" when the action is destructive
- place complex business logic inside the dialog component

---

## Dropdown

### Purpose and role

`Dropdown` is a reusable selection component.

It should be used when the user needs to select one option from a list.

### Location

```txt
src/components/ui-elements/Dropdown.tsx
```

### Typical usage

Use `Dropdown` for:

- language selection
- server selection
- setting choices
- feature configuration
- status or mode selection

### Best practices

Do:

- use dropdown options with clear labels
- keep selected value in state or Redux depending on scope
- use translations for user-facing labels

Do not:

- rebuild dropdowns manually inside screens
- use dropdowns for very small binary choices where a switch would be clearer
- mix business logic into the dropdown component

---

## TextInput and WebPasswordInput

### Purpose and role

`TextInput` provides a consistent application input style.

`WebPasswordInput` is a web-specific password input implementation.

### Locations

```txt
src/components/ui-elements/TextInput.tsx
src/components/ui-elements/WebPasswordInput.tsx
```

### Typical usage

Use these components for:

- login forms
- password fields
- settings forms
- configuration values
- search/filter inputs

### Best practices

Do:

- use shared input components for consistent styling
- use password-specific input for password fields
- keep validation logic close to the form/screen

Do not:

- use raw inputs with custom styling in every screen
- hardcode input colors
- duplicate password visibility logic

---

## Tabs

### Purpose and role

`Tab` and `TabsBar` provide a reusable tab navigation UI.

### Location

```txt
src/components/ui-elements/Tab.tsx
src/components/ui-elements/TabsBar.tsx
```

### Typical usage

Use tabs when a screen has multiple related sections.

Examples:

- settings sections
- update views
- data views
- feature tabs

### Best practices

Do:

- use tabs for related content sections
- keep tab labels short
- keep active tab state clearly defined

Do not:

- use tabs for unrelated navigation levels
- duplicate tab styling in screens

---

## SettingsNavCard

### Purpose and role

`SettingsNavCard` is used as a navigation entry in settings areas.

It provides a consistent card-like appearance for navigating to settings subpages.

### Location

```txt
src/components/ui-elements/SettingsNavCard.tsx
```

### Typical usage

Use it inside settings overview screens to link to:

- database settings
- update settings
- privacy/security settings
- file configuration upload
- user profile settings

---

## TableSwitchCell

### Purpose and role

`TableSwitchCell` is a reusable switch cell for table or settings rows.

### Location

```txt
src/components/ui-elements/TableSwitchCell.tsx
```

### Typical usage

Use it when a table row or settings row needs a boolean on/off value.

Examples:

- enable/disable feature
- active/inactive setting
- permission switch
- table-based configuration

---

## Dashboard and statistic cards

The project contains several card-like components for dashboard or statistic content.

| Component | Purpose |
| --- | --- |
| `HeroCard` | Prominent visual card for important information. |
| `MetricCard` | Displays metric values or status numbers. |
| `SmallStat` | Compact statistic element. |

### Typical usage

Use these components for:

- dashboard overview pages
- status summaries
- update state summaries
- server/application metrics
- compact KPI display

---

## Themed components

`src/components/themed` contains low-level components that apply theme colors from Unistyles.

These components are responsible for adapting colors and visual appearance to the active theme.

### Purpose

Themed components should be used as the foundation for UI elements that need theme-aware colors.

They help avoid hardcoded color values inside screens.

### Best practices

Do:

- use themed components for theme-aware UI
- rely on theme values instead of inline colors
- keep color changes centralized in theme definitions

Do not:

- hardcode light/dark colors in screens
- bypass the theme system without a strong reason

---

## Stylistic components

`src/components/stylistic` contains higher-level text and input components with predefined typography and layout styles.

Examples include:

- `H1`
- `H2`
- `H3`
- `H4`
- `Text`
- `StylisticTextInput`

### Purpose

Stylistic components provide consistent typography across the application.

They should be used instead of manually styling text in every screen.

### Best practices

Do:

- use `H1`, `H2`, `H3`, `H4` for headings
- use shared text components for consistent typography
- keep typography changes centralized

Do not:

- define different heading styles in every screen
- hardcode font sizes repeatedly
- mix multiple typography systems

---

## Routing components

Routing helpers are stored in:

```txt
src/components/routing
```

| File | Purpose |
| --- | --- |
| `src/components/routing/menuPaths.ts` | Builds slug paths from menu IDs and captions. |
| `src/components/routing/useMenuNavigation.ts` | Navigates by menu ID and updates Redux active menu state. |

### Purpose

The routing helpers support menu-based navigation.

This allows screens and menu entries to navigate by menu ID instead of duplicating route logic everywhere.

### Best practices

Do:

- use `useMenuNavigation` when navigating from menu entries
- keep menu path generation centralized
- avoid hardcoded paths when menu IDs are available

Do not:

- duplicate menu navigation logic in multiple screens
- manually build paths in feature components without checking existing helpers

---

## Dynamic content components

Dynamic content components are stored in:

```txt
src/components/dynamic
```

| Path | Purpose |
| --- | --- |
| `src/components/dynamic/content` | Renders dynamic site content returned by the backend. |
| `src/components/dynamic/editors` | Contains editor controls for dynamic content editing. |

### Purpose

Dynamic content components make it possible to render backend-provided content structures in the frontend.

They separate dynamic content rendering from normal static screens.

### Best practices

Do:

- keep dynamic content rendering inside dynamic content components
- keep editor logic separated from display logic
- document new dynamic content types when added

Do not:

- mix dynamic content rendering deeply into unrelated screens
- duplicate backend content rendering logic

---

## Rich text editor

The rich text editor is stored in:

```txt
src/components/richtexteditor
```

It contains Tiptap-based editor UI, editor controls and icons.

### Purpose

The rich text editor provides editing functionality for rich content areas.

### Best practices

Do:

- keep editor-specific UI inside the rich text editor folder
- reuse existing toolbar and icon components
- keep rich text behavior separated from normal screen layout

Do not:

- duplicate editor toolbar logic in screens
- mix rich text editor internals with unrelated UI elements

---

## General component best practices

### Do

- Reuse existing components before creating new ones.
- Keep layout components separate from business logic.
- Use theme-aware components and Unistyles.
- Use translation files for user-facing text.
- Keep screen components focused on feature logic.
- Prefer props over creating many specialized components.
- Document new reusable components in this file.

### Do not

- Do not duplicate UI styling in multiple screens.
- Do not hardcode colors when theme values exist.
- Do not create one-off components if a reusable component already exists.
- Do not place backend/API logic inside UI primitives.
- Do not add user-facing strings without translation support.

## When to add a new component

A new reusable component should be created when:

- the same UI pattern appears in multiple screens
- styling or behavior should be centralized
- the component represents a reusable application concept
- maintaining repeated JSX would become difficult

A new component should not be created when:

- the UI is only used once
- the component would only wrap a single element without adding clarity
- the logic is strongly tied to one specific screen

## Documentation rule

Whenever a new reusable component is added, this document should be updated with:

- component name
- file path
- purpose
- typical usage
- important best practices
- extension points if relevant