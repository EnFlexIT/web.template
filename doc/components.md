# Components

This document describes the reusable component architecture of
`web.template`.

The component layer belongs primarily to the Base Template and provides shared
UI building blocks, application layout, theme-aware components, dynamic
content rendering, notifications, localization UI, developer tools, and rich
text editing.

The architecture follows:

```text
Application --> Template --> Core
```

Reusable UI belongs to Template.

Core must not depend on React presentation components.

---

## 1. Purpose

The component architecture has four main goals:

- Provide reusable UI instead of screen-specific duplicates.
- Keep visual behavior consistent across applications.
- Separate reusable Template UI from product-specific Application UI.
- Provide a stable public design-system API for future application
  repositories.

Before creating a new UI component, existing Template and design-system
components should always be reviewed first.

---

## 2. Current Component Structure

Reusable Template components currently live under:

```text
src/template/components/
```

Current structure:

```text
src/template/components/
+-- design-system/
|   +-- icons/
|   |   +-- rich-text/
|   |
|   +-- stylistic/
|   +-- themed/
|   +-- ui-elements/
|       +-- charts/
|       +-- Icon/
|
+-- developer-tools/
|   +-- developer-console/
|
+-- dynamic-content/
|   +-- content/
|   +-- editors/
|   +-- model/
|
+-- layout/
|
+-- localization/
|
+-- notifications/
|
+-- rich-text-editor/
    +-- ui/
```

Routing helpers are no longer part of the component directory.

Reusable navigation infrastructure belongs under:

```text
src/template/navigation/
```

---

## 3. Component Ownership

Component ownership follows architectural responsibility.

Conceptually:

```text
Core
|
+-- no Template UI
+-- no application layout
+-- no design-system components

Template
|
+-- design system
+-- reusable layout
+-- reusable feature UI
+-- localization UI
+-- notifications
+-- reusable developer tools
+-- dynamic content infrastructure
+-- rich text editor

Application
|
+-- product-specific UI
+-- product-specific screens
+-- product-specific branding
+-- product-specific component extensions
```

A component should not be moved into Core simply because it is reusable.

React UI is generally Template-owned.

---

## 4. Component Areas

The current component areas are:

| Area | Path | Purpose |
| --- | --- | --- |
| Design system | `src/template/components/design-system` | Reusable visual primitives, themed components, typography, icons and common UI elements. |
| Layout | `src/template/components/layout` | Shared application shell such as header, footer, navigation and screen wrapper. |
| Notifications | `src/template/components/notifications` | Reusable notification presentation. |
| Localization | `src/template/components/localization` | Reusable language-selection UI. |
| Developer tools | `src/template/components/developer-tools` | Reusable developer-facing Template tools. |
| Dynamic content | `src/template/components/dynamic-content` | Backend-driven content rendering and editing. |
| Rich text editor | `src/template/components/rich-text-editor` | Reusable rich-text editor controls and UI. |
| Routing | `src/template/navigation/routing` | Reusable menu-based routing helpers. |

---

# Design System

## 5. Design System Overview

The reusable design system lives under:

```text
src/template/components/design-system/
```

It contains:

```text
design-system/
+-- icons/
+-- stylistic/
+-- themed/
+-- ui-elements/
+-- index.ts
```

The design system should be the first place to check before creating a new
reusable UI component.

---

## 6. Public Design-System API

The design system provides a central barrel export through:

```text
src/template/components/design-system/index.ts
```

The preferred architectural import is:

```ts
import {
  ActionButton,
  Card,
  ConfirmDialog,
  ThemedText,
} from "@design-system";
```

This is preferable to importing deep internal files when the component is part
of the supported public design-system API.

Deep imports may still be necessary for internal or not-yet-exported
components, but public exports should be preferred.

---

## 7. UI Elements

Reusable UI primitives live under:

```text
src/template/components/design-system/ui-elements/
```

Current components include:

```text
ActionButton.tsx
BaseModal.tsx
Card.tsx
Checkbox.tsx
ConfirmDialog.tsx
ConfirmModal.tsx
DataPermissionsDialog.tsx
Dropdown.tsx
HeroCard.tsx
Infobox.tsx
MetricCard.tsx
SelectableList.tsx
SettingsNavCard.tsx
SmallStat.tsx
Tab.tsx
Table.tsx
TableSwitchCell.tsx
TabsBar.tsx
TextInput.tsx
ThemeModeSwitchRow.tsx
UpdateProgressDialog.tsx
WebPasswordInput.tsx
```

Additional areas include:

```text
ui-elements/charts/
ui-elements/Icon/
```

---

## 8. ActionButton

### Location

```text
src/template/components/design-system/ui-elements/ActionButton.tsx
```

### Purpose

`ActionButton` is the central reusable component for user actions.

Typical use cases include:

- Save
- Cancel
- Confirm
- Upload
- Download
- Edit
- Delete
- Close
- Retry
- Navigation actions

The component represents an action rather than a concrete business operation.

Example:

```tsx
<ActionButton
  label="Save"
  onPress={handleSave}
/>
```

With an icon:

```tsx
<ActionButton
  icon="edit"
  label="Edit"
  onPress={handleEdit}
/>
```

### Guideline

Prefer configuring `ActionButton` instead of creating specialized button
components such as:

```text
SaveButton
DeleteButton
DownloadButton
EditButton
```

A specialized button component should only exist when it provides genuinely
reusable behavior beyond a different label or icon.

---

## 9. Card

### Location

```text
src/template/components/design-system/ui-elements/Card.tsx
```

### Purpose

`Card` is the reusable visual container for grouped content.

Typical use cases include:

- Settings sections
- Dashboard widgets
- Profile sections
- Server information
- Update information
- Form groups

Example:

```tsx
<Card>
  <ThemedText>Content</ThemedText>
</Card>
```

Screens should not recreate the standard card appearance independently.

---

## 10. Infobox

### Location

```text
src/template/components/design-system/ui-elements/Infobox.tsx
```

### Purpose

`Infobox` presents reusable informational or status-oriented content.

Typical examples include:

- User guidance
- Warnings
- Server information
- Update information
- Configuration explanations
- Empty-state descriptions

Use translation resources for user-facing text.

---

## 11. Confirmation Components

Current confirmation components are:

```text
src/template/components/design-system/ui-elements/ConfirmDialog.tsx
src/template/components/design-system/ui-elements/ConfirmModal.tsx
```

Use confirmation UI when an action has a significant consequence.

Typical examples:

- Delete
- Reset
- Configuration replacement
- Update installation
- Logout
- Important settings changes

Confirmation UI should present consequences.

Business logic should remain outside the reusable dialog component.

---

## 12. BaseModal

### Location

```text
src/template/components/design-system/ui-elements/BaseModal.tsx
```

`BaseModal` provides reusable modal infrastructure for other Template
components.

Feature-specific dialogs should reuse the shared modal behavior instead of
implementing independent modal foundations.

---

## 13. Dropdown

### Location

```text
src/template/components/design-system/ui-elements/Dropdown.tsx
```

Typical use cases include:

- Language selection
- Server selection
- Settings choices
- Mode selection
- Configuration options

The dropdown is responsible for reusable selection presentation.

Feature or business behavior should remain outside the component.

---

## 14. Text Inputs

Current input components include:

```text
src/template/components/design-system/ui-elements/TextInput.tsx
src/template/components/design-system/ui-elements/WebPasswordInput.tsx
```

Use shared inputs for:

- Login forms
- Settings forms
- Password fields
- Configuration values
- Search/filter controls

Avoid reproducing text-input styling and password visibility behavior inside
individual screens.

---

## 15. Tabs

Reusable tab components are:

```text
src/template/components/design-system/ui-elements/Tab.tsx
src/template/components/design-system/ui-elements/TabsBar.tsx
```

These components provide tab presentation.

Navigation configuration and tab feature rules belong to the navigation
architecture rather than the UI components themselves.

Conceptually:

```text
Application tab configuration
        |
        v
Template tab navigation
        |
        v
Tab / TabsBar presentation
```

---

## 16. SettingsNavCard

### Location

```text
src/template/components/design-system/ui-elements/SettingsNavCard.tsx
```

`SettingsNavCard` is a reusable settings-navigation element.

It can be used for settings areas such as:

- Server settings
- Update settings
- Security settings
- File configuration
- Profile settings

Product-specific destination definitions should remain outside the reusable
card component.

---

## 17. Table Components

Reusable table-related components include:

```text
src/template/components/design-system/ui-elements/Table.tsx
src/template/components/design-system/ui-elements/TableSwitchCell.tsx
```

`Table` provides reusable structured-data presentation.

`TableSwitchCell` provides reusable boolean interaction inside suitable table
or settings contexts.

Business-specific table behavior should remain in the consuming feature.

---

## 18. DataPermissionsDialog

### Location

```text
src/template/components/design-system/ui-elements/DataPermissionsDialog.tsx
```

The data-permission dialog is part of the reusable design-system UI.

State associated with reusable data-permission behavior belongs to its owning
Template state infrastructure.

The component should remain focused on presentation and interaction.

---

## 19. UpdateProgressDialog

### Location

```text
src/template/components/design-system/ui-elements/UpdateProgressDialog.tsx
```

This dialog provides reusable progress presentation for update-like workflows.

It may be reused where the same progress-dialog behavior is appropriate.

The dialog itself must not own backend-update or configuration-upload business
logic.

---

## 20. ThemeModeSwitchRow

### Location

```text
src/template/components/design-system/ui-elements/ThemeModeSwitchRow.tsx
```

This component provides reusable theme-mode selection presentation.

The active theme state remains managed by the appropriate Template state and
theme infrastructure.

---

## 21. Dashboard Components

Current reusable dashboard/statistic components include:

```text
HeroCard.tsx
MetricCard.tsx
SmallStat.tsx
```

Typical use cases include:

- Dashboard summaries
- Important metrics
- Compact status values
- Highlighted information

These components should remain generic.

Product-specific metrics belong to the consuming Application or feature.

---

# Charts

## 22. Chart Components

Reusable chart components live under:

```text
src/template/components/design-system/ui-elements/charts/
```

Current files include:

```text
BarChartWidget.tsx
ChartCard.tsx
types.ts
index.ts
```

The chart components provide reusable visualization infrastructure.

Feature-specific data transformation should generally remain outside the
generic chart components.

Conceptually:

```text
Feature data
    |
    v
Feature-specific mapping
    |
    v
Reusable chart component
```

---

# Icons

## 23. Icon Infrastructure

Reusable icons live under:

```text
src/template/components/design-system/icons/
```

The design system provides:

```text
icons/index.ts
```

A general icon component also exists at:

```text
src/template/components/design-system/ui-elements/Icon/Icon.tsx
```

Before adding a duplicate icon implementation, check the existing icon
infrastructure.

---

## 24. Rich-Text Icons

Rich-text-specific icons currently live under:

```text
src/template/components/design-system/icons/rich-text/
```

Current files include:

```text
BoldIcon.tsx
H1Icon.tsx
H2Icon.tsx
H3Icon.tsx
H4Icon.tsx
H5Icon.tsx
H6Icon.tsx
HeadingIcon.tsx
HIcon.tsx
ItalicIcon.tsx
StrikeIcon.tsx
index.ts
```

These icons are shared by the reusable rich-text editing infrastructure.

---

# Themed Components

## 25. Themed Components

Theme-aware components live under:

```text
src/template/components/design-system/themed/
```

Current components include:

```text
ThemedAntDesign.tsx
ThemedDropdown.tsx
ThemedText.tsx
ThemedTextInput.tsx
ThemedView.tsx
index.ts
```

These components integrate reusable UI with the active Unistyles theme.

### Guideline

Prefer theme values and theme-aware components over hardcoded colors.

Avoid:

```tsx
<View style={{ backgroundColor: "#ffffff" }} />
```

when the color is part of the application's theme.

Theme changes should be centralized in the design/theme infrastructure.

---

# Stylistic Components

## 26. Stylistic Components

Reusable typography and stylistic wrappers live under:

```text
src/template/components/design-system/stylistic/
```

Current components include:

```text
H1.tsx
H2.tsx
H3.tsx
H4.tsx
StylisticDropdown.tsx
StylisticTextInput.tsx
Text.tsx
index.ts
```

These components provide consistent typography and higher-level visual
conventions.

Prefer shared heading components over repeatedly defining heading sizes inside
individual screens.

---

# Layout

## 27. Layout Components

Reusable application-shell layout components live under:

```text
src/template/components/layout/
```

Current files are:

```text
Footer.tsx
Header.tsx
Logo.tsx
Navigation.tsx
Screen.tsx
ToolBox.tsx
```

These components form the reusable Template application frame.

---

## 28. Header

### Location

```text
src/template/components/layout/Header.tsx
```

The header belongs to the reusable Template shell.

It may integrate reusable concerns such as:

- Navigation context
- Breadcrumbs
- Toolbox actions
- Application identity

Concrete product configuration should be obtained through supported Template
configuration contracts rather than direct imports from a concrete
Application.

---

## 29. Footer

### Location

```text
src/template/components/layout/Footer.tsx
```

The footer may consume reusable Template state such as:

- Active server
- Connectivity information
- Notifications
- Release information
- Developer-console access

The footer should remain a consumer of these systems.

It should not own server validation, authentication, update, or notification
algorithms.

---

## 30. Navigation Component

### Location

```text
src/template/components/layout/Navigation.tsx
```

`Navigation` is the UI representation of the Template navigation
infrastructure.

Navigation configuration and routing algorithms belong under:

```text
src/template/navigation/
```

The layout component should render navigation rather than own concrete
application menu definitions.

---

## 31. Screen

### Location

```text
src/template/components/layout/Screen.tsx
```

`Screen` provides reusable screen-layout behavior.

Feature screens should use common layout infrastructure instead of duplicating
screen framing and spacing.

---

## 32. Logo

### Location

```text
src/template/components/layout/Logo.tsx
```

`Logo` displays reusable application branding.

Concrete branding information should eventually come through supported
Application configuration.

The Template logo component must not directly import a concrete application's
implementation.

---

## 33. ToolBox

### Location

```text
src/template/components/layout/ToolBox.tsx
```

`ToolBox` provides reusable contextual-action presentation.

Feature-specific actions should be supplied to the reusable component rather
than embedded as product-specific behavior inside it.

---

# Notifications

## 34. Notification Components

Notification presentation lives under:

```text
src/template/components/notifications/
```

Current file:

```text
NotificationPopup.tsx
```

Notification state belongs separately under Template state infrastructure.

Conceptually:

```text
Notification state
        |
        v
Notification components
        |
        v
User presentation
```

Notification UI should not become the owner of notification state or
feature-specific notification generation.

---

# Localization

## 35. Localization Components

Reusable localization UI lives under:

```text
src/template/components/localization/
```

Current file:

```text
LanguageSwitcher.tsx
```

The language switcher is reusable Template UI.

Translation resources remain under:

```text
assets/locales/
```

User-facing labels should use the existing i18next infrastructure instead of
hardcoded strings.

---

# Developer Tools

## 36. Developer Tools

Reusable developer-facing components live under:

```text
src/template/components/developer-tools/
```

The current developer-console implementation is located at:

```text
src/template/components/developer-tools/developer-console/DeveloperConsole.tsx
```

Developer-facing tools should remain separated from general design-system
primitives.

Whether a developer feature belongs permanently to Template or should become
Application-specific must be decided based on reusability.

Do not move developer tools into Core solely because they are technical.

---

# Dynamic Content

## 37. Dynamic Content Overview

Reusable dynamic-content infrastructure lives under:

```text
src/template/components/dynamic-content/
```

Current structure:

```text
dynamic-content/
+-- content/
+-- editors/
+-- model/
```

Dynamic content supports backend-defined site content.

Rendering and editing responsibilities are intentionally separated.

---

## 38. Dynamic Content Rendering

Rendering components live under:

```text
src/template/components/dynamic-content/content/
```

Current files include:

```text
AbstractSiteContent.tsx
SiteChart.tsx
SiteContentImage.tsx
SiteContentList.tsx
SiteContentProperties.tsx
SiteContentText.tsx
```

These components are responsible for rendering supported dynamic-content
representations.

Feature screens should reuse this infrastructure rather than reimplementing
backend-driven content rendering.

---

## 39. Dynamic Content Editors

Editor components live under:

```text
src/template/components/dynamic-content/editors/
```

Current files include:

```text
AbstractSiteContentEditor.tsx
CancelButton.tsx
ConfirmButton.tsx
SiteContentImageEditor.tsx
SiteContentPropertiesEditor.tsx
SiteContentTextEditor.tsx
UploadButton.tsx
XButton.tsx
```

These components are specific to dynamic-content editing.

Their existence does not mean that general-purpose actions should create
similar specialized buttons elsewhere.

For generic UI actions, prefer `ActionButton`.

---

## 40. Dynamic Content Model

Dynamic-content model helpers live under:

```text
src/template/components/dynamic-content/model/
```

Current helper:

```text
isAbstractSiteContent.ts
```

Model helpers should remain independent from presentation where possible.

---

# Rich Text Editor

## 41. Rich Text Editor Overview

The reusable rich-text editor lives under:

```text
src/template/components/rich-text-editor/
```

Current structure:

```text
rich-text-editor/
+-- ui/
+-- index.ts
```

The rich-text editor should remain isolated from unrelated application
screens.

---

## 42. Rich Text Editor UI

Current UI files include:

```text
bar.tsx
BoldButton.tsx
HeadingButton.tsx
HeadingExpandButton.tsx
ItalicButton.tsx
StrikeButton.tsx
```

These controls work with the rich-text icon infrastructure from:

```text
src/template/components/design-system/icons/rich-text/
```

Reusable editor controls should be extended centrally instead of duplicating
toolbar behavior in individual screens.

---

# Routing

## 43. Routing Is Not a Component Folder

Routing helpers no longer belong under an old path such as:

```text
src/components/routing
```

Reusable routing infrastructure belongs under:

```text
src/template/navigation/routing/
```

Known routing helpers include:

```text
menuPaths.ts
useMenuNavigation.ts
```

Conceptually:

```text
Application menu definition
        |
        v
Template navigation infrastructure
        |
        v
Routing helper
        |
        v
Navigation UI
```

This keeps navigation mechanics separate from visual components.

---

## 44. Menu Navigation

`useMenuNavigation` provides reusable navigation based on menu identifiers.

Menu route generation should remain centralized.

Avoid manually recreating navigation paths in individual screens when the
Template navigation infrastructure already provides the required behavior.

---

# Design-System Reuse

## 45. Reuse Rule

Before creating a new component, search the existing design system.

Useful searches include:

```bash
git grep -n "ActionButton" -- src
git grep -n "Card" -- src
git grep -n "ConfirmDialog" -- src
git grep -n "Dropdown" -- src
git grep -n "TextInput" -- src
```

Also inspect:

```text
src/template/components/design-system/
```

A new component should not be introduced merely because a screen needs a
different label, icon, spacing value, or callback.

---

## 46. When to Add a New Reusable Component

A new reusable component is appropriate when:

- The same UI pattern appears in multiple places.
- Shared behavior should be centralized.
- Shared styling should remain consistent.
- The component represents a reusable Template concept.
- Repeated JSX would otherwise become difficult to maintain.

A new reusable component is usually unnecessary when:

- The UI exists only on one feature screen.
- It is a trivial wrapper with no reusable behavior.
- An existing design-system component already supports the requirement.
- Only a different label or icon is required.
- The behavior is strongly product-specific.

---

# Application-Specific Components

## 47. Product UI

Not every component should become part of the Base Template.

A component belongs to Application when it represents concrete product
behavior that is not reusable across applications.

Examples may include:

```text
Agent.Workbench-specific business widgets
Agent.Workbench-specific configuration editors
HEMS-specific dashboards
product-specific data visualization
product-specific workflow components
```

The target dependency remains:

```text
Application --> Template
```

Template must not import those concrete product components.

---

## 48. Product Screens and Reusable Components

A product-specific screen may consume reusable Template components.

Conceptually:

```text
Application screen
    |
    +-- ActionButton
    +-- Card
    +-- Table
    +-- ThemedText
    +-- Template navigation
    |
    v
Product-specific behavior
```

Reusable UI should remain generic even when first introduced for one concrete
application.

---

# Styling and Themes

## 49. Styling

The project uses React Native Unistyles.

Reusable components should use the shared theme infrastructure rather than
introducing independent styling conventions.

Prefer:

```text
theme values
shared components
Unistyles
design-system primitives
```

Avoid:

```text
repeated hardcoded colors
duplicated typography
screen-specific copies of shared button styles
parallel design systems
```

---

## 50. Theme Responsibility

Themed and stylistic components provide reusable presentation.

The active theme itself is managed separately by Template state and styling
infrastructure.

Components should consume theme information without becoming responsible for
global theme state.

---

# Localization

## 51. User-Facing Text

Reusable components that display user-facing text should integrate with the
existing localization infrastructure where appropriate.

Translation files live under:

```text
assets/locales/
```

Do not add duplicated hardcoded German and English text directly into shared
components.

---

# Business Logic

## 52. Keep Business Logic Outside UI Primitives

Design-system components should not contain product-specific business logic.

Preferred separation:

```text
Screen / feature logic
        |
        v
props
        |
        v
Reusable UI component
```

Avoid:

```text
Reusable button
        |
        v
direct Agent.Workbench API call
```

API calls, Redux orchestration, and concrete business workflows should remain
in their owning feature or state layer.

---

# State

## 53. Component State

Local visual state may remain inside a component when it only matters to that
component.

Examples:

```text
modal open/closed
temporary input focus
local expansion state
hover state
local toolbar state
```

Reusable application state should live in the appropriate Template state
module.

Product-specific global state belongs to Application.

Redux ownership follows responsibility, not component location.

---

# Public API

## 54. Stable Imports

The long-term goal is that separate Application repositories consume reusable
Template UI through stable public exports.

For the design system, the current preferred alias is:

```text
@design-system
```

Future external package usage may conceptually look like:

```ts
import {
  ActionButton,
  Card,
  ThemedText,
} from "@enflex/web-template";
```

Application repositories should eventually avoid depending on arbitrary
internal Template file paths.

---

# Refactoring

## 55. Safe Component Refactoring

When moving or changing components:

1. Search all imports.

   ```bash
   git grep -n "<ComponentName>" -- src test
   ```

2. Inspect current responsibilities.

3. Move only one coherent component group.

4. Update imports explicitly.

5. Search for the old path.

6. Run TypeScript validation.

   ```bash
   npx tsc --noEmit
   ```

7. Run affected tests.

8. Validate the diff.

   ```bash
   git diff --check
   ```

9. Start the application when visual/runtime behavior changed.

   ```bash
   npm start
   ```

Avoid broad automated rewrites across unrelated source files.

---

# Current Status

## 56. Implemented

The current component migration includes:

- Reusable components moved under `src/template/components`.
- Design system established under
  `src/template/components/design-system`.
- Central design-system barrel exports.
- `@design-system` alias.
- Layout components separated under `layout`.
- Notification presentation separated under `notifications`.
- Localization UI separated under `localization`.
- Developer console separated under `developer-tools`.
- Dynamic content separated under `dynamic-content`.
- Rich text editor separated under `rich-text-editor`.
- Routing moved into Template navigation infrastructure.
- Reusable themed and stylistic components grouped in the design system.
- Reusable charts grouped inside the design system.
- Rich-text icons grouped inside the design system.

---

## 57. Transitional Areas

Some ownership questions remain open.

Examples include:

```text
Developer Console
Dynamic Content
some settings components
some Agent.Workbench-specific UI
```

Their final ownership should be determined by actual reuse across products.

Do not move them merely because of their current physical location.

---

## 58. Planned

Future component architecture work includes:

- Continue defining the supported Base Template public UI API.
- Reduce arbitrary deep imports where stable exports are available.
- Review product-specific components before Application repository extraction.
- Keep design-system components product-neutral.
- Review reusable branding extension points.
- Maintain dependency-boundary validation.
- Add reusable components only when a real reusable pattern exists.

---

# Architecture Rules

## 59. Rules

Component changes must preserve these rules:

1. Core must not import Template components.
2. Template must not import concrete Application components.
3. Reusable UI belongs to Template.
4. Product-specific UI belongs to Application.
5. Design-system components must remain product-neutral.
6. Reuse existing components before creating new ones.
7. Navigation logic belongs under Template navigation, not the component tree.
8. API and business logic should not be placed in UI primitives.
9. User-facing text should use localization infrastructure.
10. Theme values should be preferred over hardcoded visual constants.
11. Stable public exports should be preferred where available.
12. Generated API code must not be modified as part of component cleanup.

---

# Documentation Rule

## 60. Updating This Document

When reusable component architecture changes, update this document.

Relevant changes include:

```text
new reusable design-system component
component relocation
new public export
new component category
new reusable layout component
new shared editor infrastructure
new architectural ownership decision
```

The documentation must distinguish between:

```text
Implemented
Transitional
Planned
```

Do not document planned component structure as if it already exists.

---

# Success Criteria

## 61. Target State

The component architecture is successful when:

1. Reusable Template UI has a clear owner and location.
2. Applications reuse common components rather than duplicating them.
3. Core remains independent from Template presentation.
4. Product-specific UI does not leak into the Base Template.
5. Design-system imports are stable and predictable.
6. Theme and localization behavior remain centralized.
7. Layout, navigation, state and business responsibilities remain separated.
8. Separate Application repositories can consume the Base Template UI without
   editing Template internals.