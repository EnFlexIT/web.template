# Components

## Purpose

This document describes the reusable component architecture of `web.template`.

The component layer belongs primarily to Template and provides reusable:

* UI building blocks
* application layout
* theme-aware components
* notifications
* localization UI
* developer tools
* dynamic-content rendering/editing
* rich-text editing
* reusable feature presentation

The architecture follows:

```text
Application --> Template --> Core
```

Reusable React UI belongs to Template.

Standard Agent.Workbench UI belongs to Template when it is part of the reusable Base Template platform.

Concrete product-only UI belongs to Application.

Core must not depend on React presentation components.

---

# 1. Goals

The component architecture has these main goals:

* provide reusable UI instead of screen-specific duplicates
* keep visual behavior consistent
* separate Template UI from concrete product UI
* provide stable design-system integration
* keep business logic outside generic UI primitives
* keep Core independent from presentation
* allow future Applications such as HEMS to consume Template UI
* keep standard Agent.Workbench presentation inside the Base Template

Before creating a new component, existing Template and design-system components should be reviewed.

---

# 2. Current Component Structure

Reusable Template components live under:

```text
src/template/components/
```

Current high-level structure:

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

Reusable routing infrastructure belongs under:

```text
src/template/navigation/
```

Routing is not part of the component directory.

---

# 3. Component Ownership

Component ownership follows architectural responsibility.

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
+-- standard Agent.Workbench UI
+-- localization UI
+-- notifications
+-- developer tools
+-- dynamic content
+-- rich-text editor

Application
|
+-- concrete product-specific UI
+-- concrete product-specific screens
+-- product-specific branding extensions
+-- product-specific component extensions
```

A component must not move into Core merely because it is reusable.

React UI is generally Template-owned unless it represents concrete product-only behavior.

---

# 4. Agent.Workbench Component Ownership

Standard Agent.Workbench presentation is intentionally part of Template.

Examples may include reusable UI for:

```text
Program Start
Data Analyzing
Database configuration
Server configuration
Live Console
Settings
```

The presence of the term `Agent.Workbench` does not automatically make a component Application-owned.

The architectural rule is:

```text
standard Agent.Workbench platform UI
    -> Template

HEMS-specific UI
    -> HEMS Application

future concrete product-only UI
    -> respective Application
```

Agent.Workbench standard UI is not waiting for extraction into a separate Application repository.

---

# 5. Component Areas

Current component areas include:

| Area             | Path                                       | Purpose                                                                                 |
| ---------------- | ------------------------------------------ | --------------------------------------------------------------------------------------- |
| Design system    | `src/template/components/design-system`    | Reusable visual primitives, themed components, typography, icons and common UI elements |
| Layout           | `src/template/components/layout`           | Shared application shell                                                                |
| Notifications    | `src/template/components/notifications`    | Reusable notification presentation                                                      |
| Localization     | `src/template/components/localization`     | Reusable language-selection UI                                                          |
| Developer tools  | `src/template/components/developer-tools`  | Reusable developer-facing Template tools                                                |
| Dynamic content  | `src/template/components/dynamic-content`  | Backend-driven content rendering and editing                                            |
| Rich text editor | `src/template/components/rich-text-editor` | Reusable rich-text editor controls                                                      |
| Routing          | `src/template/navigation/routing`          | Reusable menu-based routing helpers                                                     |

---

# Design System

## 6. Design System Overview

The reusable design system lives under:

```text
src/template/components/design-system/
```

Current structure includes:

```text
design-system/
+-- icons/
+-- stylistic/
+-- themed/
+-- ui-elements/
+-- index.ts
```

The design system should be checked before introducing a new reusable component.

---

## 7. Public Design-System API

The design system exposes a central barrel through:

```text
src/template/components/design-system/index.ts
```

Preferred imports use the existing design-system alias where available.

Example:

```ts
import {
  ActionButton,
  Card,
  ConfirmDialog,
  ThemedText,
} from "@design-system";
```

Stable exports should be preferred over unnecessary deep imports.

Deep imports may remain appropriate for internal or not-yet-exported implementation details.

---

## 8. UI Elements

Reusable UI elements live under:

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

# 9. ActionButton

Location:

```text
src/template/components/design-system/ui-elements/ActionButton.tsx
```

`ActionButton` is a reusable component for user actions.

Typical uses include:

* Save
* Cancel
* Confirm
* Upload
* Download
* Edit
* Delete
* Close
* Retry
* Navigation actions

Example:

```tsx
<ActionButton
  label="Save"
  onPress={handleSave}
/>
```

With icon:

```tsx
<ActionButton
  icon="edit"
  label="Edit"
  onPress={handleEdit}
/>
```

Prefer configuration of `ActionButton` over creating trivial specialized wrappers such as:

```text
SaveButton
DeleteButton
DownloadButton
EditButton
```

A specialized component is justified only when it adds meaningful reusable behavior.

---

# 10. Card

Location:

```text
src/template/components/design-system/ui-elements/Card.tsx
```

`Card` is a reusable visual container.

Typical uses include:

* settings sections
* dashboard widgets
* profile sections
* server information
* update information
* form groups

Screens should not independently recreate the standard card presentation.

---

# 11. Infobox

Location:

```text
src/template/components/design-system/ui-elements/Infobox.tsx
```

`Infobox` provides reusable informational/status presentation.

Typical uses include:

* guidance
* warnings
* server information
* update information
* configuration explanations
* empty-state descriptions

User-facing text should use localization infrastructure.

---

# 12. Confirmation Components

Reusable confirmation components include:

```text
src/template/components/design-system/ui-elements/ConfirmDialog.tsx
src/template/components/design-system/ui-elements/ConfirmModal.tsx
```

Use confirmation UI when an action has significant consequences.

Examples:

* Delete
* Reset
* Configuration replacement
* Update installation
* Logout
* Important settings changes

Business logic must remain outside the generic confirmation component.

---

# 13. BaseModal

Location:

```text
src/template/components/design-system/ui-elements/BaseModal.tsx
```

`BaseModal` provides reusable modal infrastructure.

Feature dialogs should reuse the shared modal foundation where appropriate.

---

# 14. Dropdown

Location:

```text
src/template/components/design-system/ui-elements/Dropdown.tsx
```

Typical uses include:

* language selection
* server selection
* settings choices
* mode selection
* configuration options

The component owns reusable selection presentation.

Feature/business behavior belongs to the consuming feature.

---

# 15. Text Inputs

Current reusable input components include:

```text
src/template/components/design-system/ui-elements/TextInput.tsx
src/template/components/design-system/ui-elements/WebPasswordInput.tsx
```

Typical use cases:

* login forms
* settings forms
* password fields
* configuration values
* search/filter controls

Avoid duplicating shared input presentation and password-visibility behavior.

---

# 16. Tabs

Reusable tab presentation components include:

```text
src/template/components/design-system/ui-elements/Tab.tsx
src/template/components/design-system/ui-elements/TabsBar.tsx
```

These components own presentation only.

They do not define the architectural navigation model.

Reusable Template tabs remain Template-owned.

Concrete Application navigation extensions use the supported navigation architecture.

A separate Application-owned `tabs.properties` model is not part of the current architecture.

---

# 17. SettingsNavCard

Location:

```text
src/template/components/design-system/ui-elements/SettingsNavCard.tsx
```

`SettingsNavCard` is reusable settings-navigation presentation.

It may be used for areas such as:

* server settings
* update settings
* security settings
* file configuration
* profile settings

The component does not own navigation definitions.

Navigation ownership remains in the navigation architecture.

---

# 18. Table Components

Reusable table-related components include:

```text
src/template/components/design-system/ui-elements/Table.tsx
src/template/components/design-system/ui-elements/TableSwitchCell.tsx
```

`Table` provides reusable structured-data presentation.

`TableSwitchCell` provides reusable boolean interaction where appropriate.

Business-specific behavior remains in the consuming feature.

---

# 19. DataPermissionsDialog

Location:

```text
src/template/components/design-system/ui-elements/DataPermissionsDialog.tsx
```

The dialog is reusable Template UI.

State associated with reusable data-permission behavior belongs to its owning Template state infrastructure.

The component should remain focused on presentation and interaction.

---

# 20. UpdateProgressDialog

Location:

```text
src/template/components/design-system/ui-elements/UpdateProgressDialog.tsx
```

This component provides reusable progress presentation.

It may be consumed by workflows such as:

* update flows
* configuration uploads
* other long-running operations where the same UI is appropriate

The dialog itself must not own backend-update or upload business logic.

---

# 21. ThemeModeSwitchRow

Location:

```text
src/template/components/design-system/ui-elements/ThemeModeSwitchRow.tsx
```

The component provides reusable theme-mode selection presentation.

Global theme state belongs to the appropriate Template state/theme infrastructure.

---

# 22. Dashboard Components

Current reusable dashboard/statistic components include:

```text
HeroCard.tsx
MetricCard.tsx
SmallStat.tsx
```

Typical uses include:

* dashboard summaries
* important metrics
* compact status values
* highlighted information

The components should remain generic.

Concrete product metrics belong to their owning feature/Application.

---

# Charts

## 23. Chart Components

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

Feature-specific data transformation should remain outside generic chart components.

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

## 24. Icon Infrastructure

Reusable icons live under:

```text
src/template/components/design-system/icons/
```

The design system exposes:

```text
icons/index.ts
```

A general icon component exists at:

```text
src/template/components/design-system/ui-elements/Icon/Icon.tsx
```

Check existing icon infrastructure before introducing duplicate icons.

---

# 25. Rich-Text Icons

Rich-text-specific icons live under:

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

These icons support reusable rich-text editing infrastructure.

---

# Themed Components

## 26. Themed Components

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

These components integrate reusable UI with the active theme.

Prefer theme values over hard-coded colors where those values are part of the application theme.

---

# Stylistic Components

## 27. Stylistic Components

Reusable typography/stylistic components live under:

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

Shared stylistic components should be preferred over repeatedly recreating common typography conventions.

---

# Layout

## 28. Layout Components

Reusable application-platform layout components live under:

```text
src/template/components/layout/
```

Current files include:

```text
Footer.tsx
Header.tsx
Logo.tsx
Navigation.tsx
Screen.tsx
ToolBox.tsx
```

These components form the reusable Template shell.

---

# 29. Header

Location:

```text
src/template/components/layout/Header.tsx
```

The header may integrate reusable concerns such as:

* navigation context
* breadcrumbs
* toolbox actions
* Application identity

Concrete Application configuration must flow through supported Template integration contracts.

Template layout must not import concrete Application implementation.

---

# 30. Footer

Location:

```text
src/template/components/layout/Footer.tsx
```

The footer may consume reusable Template state such as:

* active server
* connectivity
* notifications
* release information
* developer-console access

The footer is a presentation consumer.

It must not own:

* server validation
* authentication algorithms
* update algorithms
* notification-generation algorithms

---

# 31. Navigation Component

Location:

```text
src/template/components/layout/Navigation.tsx
```

`Navigation` is the UI representation of Template navigation infrastructure.

Navigation logic belongs under:

```text
src/template/navigation/
```

The layout component renders navigation.

It does not own the complete navigation configuration.

Template owns reusable navigation and standard Agent.Workbench navigation.

Application may contribute Application-specific extensions through the supported navigation contract.

---

# 32. Screen

Location:

```text
src/template/components/layout/Screen.tsx
```

`Screen` provides reusable screen-layout behavior.

Feature screens should reuse common framing and spacing infrastructure.

---

# 33. Logo

Location:

```text
src/template/components/layout/Logo.tsx
```

`Logo` provides reusable Application-branding presentation.

Concrete branding data should flow through supported Application configuration.

The Template logo component must not import concrete Application implementation.

---

# 34. ToolBox

Location:

```text
src/template/components/layout/ToolBox.tsx
```

`ToolBox` provides reusable contextual-action presentation.

Feature-specific actions should be supplied to the component rather than hard-coded as product-specific behavior.

---

# Notifications

## 35. Notification Components

Notification presentation lives under:

```text
src/template/components/notifications/
```

Current file:

```text
NotificationPopup.tsx
```

Notification state belongs separately to Template state infrastructure.

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

Presentation components should not become the owner of notification generation or feature state.

---

# Localization

## 36. Localization Components

Reusable localization UI lives under:

```text
src/template/components/localization/
```

Current file:

```text
LanguageSwitcher.tsx
```

Translation resources live under:

```text
assets/locales/
```

User-facing labels should use the existing localization infrastructure.

---

# Developer Tools

## 37. Developer Tools

Reusable developer-facing functionality lives under:

```text
src/template/components/developer-tools/
```

Current Developer Console implementation:

```text
src/template/components/developer-tools/developer-console/DeveloperConsole.tsx
```

Developer tools belong to Template when they represent reusable Base Template functionality.

They must not be moved to Core merely because they are technical.

They also must not be treated as Agent.Workbench Application extraction candidates solely because they are heavily used by Agent.Workbench.

---

# 38. Developer Console

The Developer Console is Template-owned.

Its implementation is reusable application-platform functionality.

The close-button multiplication character is represented as:

```tsx
{"\u00D7"}
```

to avoid encoding corruption.

UI behavior belongs to the component.

Logging/business/runtime sources remain with their owning subsystems.

---

# Dynamic Content

## 39. Dynamic Content Overview

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

Dynamic content supports backend-defined content.

Rendering and editing responsibilities are separated.

Under the current architecture this infrastructure is Template-owned.

It is not waiting for Agent.Workbench Application extraction.

---

# 40. Dynamic Content Rendering

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

Feature screens should reuse this infrastructure instead of duplicating backend-driven content rendering.

---

# 41. Dynamic Content Editors

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

These components belong to dynamic-content editing.

Generic actions should still prefer reusable design-system components such as `ActionButton` where appropriate.

---

# 42. Dynamic Content Model

Model helpers live under:

```text
src/template/components/dynamic-content/model/
```

Known helper:

```text
isAbstractSiteContent.ts
```

Model helpers should remain independent from presentation where practical.

---

# Rich Text Editor

## 43. Rich Text Editor

Reusable rich-text editing lives under:

```text
src/template/components/rich-text-editor/
```

Current structure:

```text
rich-text-editor/
+-- ui/
+-- index.ts
```

Reusable editor controls should remain centralized.

---

# 44. Rich Text Editor UI

Current files include:

```text
bar.tsx
BoldButton.tsx
HeadingButton.tsx
HeadingExpandButton.tsx
ItalicButton.tsx
StrikeButton.tsx
```

These controls use icons from:

```text
src/template/components/design-system/icons/rich-text/
```

Shared editor behavior should not be duplicated inside individual screens.

---

# Routing

## 45. Routing Is Navigation Infrastructure

Reusable routing helpers belong under:

```text
src/template/navigation/routing/
```

Known helpers include:

```text
menuPaths.ts
useMenuNavigation.ts
```

Routing must not return to historical locations such as:

```text
src/components/routing
```

Conceptually:

```text
Template navigation
        +
Application navigation extensions
        |
        v
Template routing infrastructure
        |
        v
Navigation UI
```

---

# 46. Menu Navigation

`useMenuNavigation` provides reusable navigation based on navigation identifiers.

Route generation should remain centralized.

Screens should not manually reconstruct navigation paths when Template navigation infrastructure already provides them.

---

# Navigation Ownership

## 47. Navigation and Components

Navigation presentation and navigation definition are separate responsibilities.

Template owns:

```text
navigation infrastructure
Template navigation definitions
Template screen registry
standard Agent.Workbench navigation
visibility integration
menu ordering
```

Application owns:

```text
Application-specific navigation extensions
Application-specific screens
```

The following model is not current architecture:

```text
Application owns all menu definitions
Application owns all tab definitions
```

Application navigation extends Template navigation.

---

# Design-System Reuse

## 48. Reuse Rule

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

A new component should not be introduced merely because one screen needs a different:

* label
* icon
* callback
* spacing value

---

# 49. When to Add a Reusable Component

A reusable component is appropriate when:

* the same UI pattern appears in multiple places
* shared behavior should be centralized
* shared styling should remain consistent
* it represents a reusable Template concept
* repeated JSX would otherwise become difficult to maintain

A new reusable component is usually unnecessary when:

* it exists only on one product-specific screen
* it is a trivial wrapper
* an existing component already supports the requirement
* only a label or icon differs
* the behavior is genuinely concrete-product-specific

---

# Concrete Application Components

## 50. Product UI

Not every component belongs to the Base Template.

Concrete product UI belongs to Application when the behavior is truly product-specific.

Examples include:

```text
HEMS-specific dashboard widgets
HEMS-only workflow components
future product-specific dashboards
future product-specific business visualization
consumer-specific branding components
```

Do not classify a component as Application-owned merely because it contains Agent.Workbench terminology.

Standard Agent.Workbench platform functionality remains Template-owned.

---

# 51. Concrete Application Screens

A concrete Application screen may consume reusable Template UI.

Conceptually:

```text
HEMS screen
    |
    +-- ActionButton
    +-- Card
    +-- Table
    +-- ThemedText
    +-- Template navigation
    |
    v
HEMS-specific behavior
```

Template must not import the concrete Application screen.

Application screens are discovered through the Application screen-discovery mechanism documented in the architecture.

---

# Styling and Themes

## 52. Styling

The project uses React Native Unistyles.

Reusable components should use shared theme infrastructure.

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

# 53. Theme Responsibility

Themed and stylistic components provide reusable presentation.

Global theme state belongs to Template theme/state infrastructure.

Components consume theme information without becoming the owner of global theme state.

---

# Localization

## 54. User-Facing Text

Reusable components that display user-facing text should use the existing localization infrastructure where appropriate.

Translation files live under:

```text
assets/locales/
```

Do not duplicate hardcoded language-specific strings across reusable components.

---

# Business Logic

## 55. Keep Business Logic Outside UI Primitives

Design-system components must not contain feature-specific business logic.

Preferred:

```text
Feature logic
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
direct feature API call
```

API calls, Redux orchestration and business workflows belong to their owning feature/state layer.

---

# State

## 56. Component State

Local visual state may remain in a component when it only matters locally.

Examples:

```text
modal open/closed
temporary input focus
local expansion state
hover state
local toolbar state
```

Reusable application state belongs to Template state when Template owns the feature.

Concrete product-specific global state belongs to Application.

Redux ownership follows architectural responsibility.

---

# Public Integration

## 57. Stable Imports

Reusable Template UI should be consumed through stable supported exports where available.

Current preferred design-system alias:

```text
@design-system
```

Avoid unnecessary dependencies on arbitrary Template internals.

Future consumer integration may expose additional stable Template APIs when concrete requirements justify them.

Do not invent a large public API prematurely.

---

# Refactoring

## 58. Safe Component Refactoring

When moving or changing components:

1. Search all imports.

   ```bash
   git grep -n "<ComponentName>" -- src test
   ```

2. Inspect responsibility.

3. Move only one coherent component/group.

4. Update imports explicitly.

5. Search for the old path.

6. Run configuration generation when relevant.

   ```bash
   npm run config:generate
   ```

7. Run TypeScript validation.

   ```bash
   npx tsc --noEmit
   ```

8. Run affected tests.

9. Validate the diff.

   ```bash
   git diff --check
   ```

10. Start the application when visual/runtime behavior changed.

```bash
npm start
```

Avoid broad automated rewrites across unrelated source files.

---

# Current Status

## 59. Implemented

Current component architecture includes:

* reusable components under `src/template/components`
* design system under `src/template/components/design-system`
* central design-system barrel exports
* `@design-system` alias
* layout components under `layout`
* notification presentation under `notifications`
* localization UI under `localization`
* Developer Console under `developer-tools`
* dynamic content under `dynamic-content`
* rich-text editor under `rich-text-editor`
* routing under Template navigation infrastructure
* themed/stylistic components in the design system
* reusable charts in the design system
* rich-text icons in the design system

---

# 60. Established Ownership

The following ownership is established:

```text
Design system
    -> Template

Layout
    -> Template

Notifications UI
    -> Template

Localization UI
    -> Template

Developer Console
    -> Template

Dynamic Content infrastructure
    -> Template

Rich Text Editor
    -> Template

standard Agent.Workbench UI
    -> Template

HEMS-specific UI
    -> HEMS Application
```

These areas must not be described as waiting for a separate Agent.Workbench Application extraction.

---

# 61. Future Work

Future component work may include:

* continue refining supported Template UI exports
* reduce arbitrary deep imports where stable exports exist
* keep design-system components product-neutral
* review reusable branding extension points
* maintain dependency-boundary validation
* add reusable components only for actual reusable patterns
* validate Template UI consumption through a real concrete Application such as HEMS

Future work does **not** include moving standard Agent.Workbench UI into a separate Application repository.

---

# Architecture Rules

## 62. Rules

Component changes must preserve these rules:

1. Core must not import Template components.
2. Template must not import concrete Application components.
3. Reusable React UI belongs to Template.
4. Standard Agent.Workbench UI belongs to Template.
5. Concrete product-specific UI belongs to Application.
6. Design-system components should remain product-neutral.
7. Existing components should be reused before creating duplicates.
8. Navigation logic belongs under Template navigation.
9. Business/API logic should not live in generic UI primitives.
10. User-facing text should use localization infrastructure.
11. Theme values should be preferred over duplicated hardcoded visual constants.
12. Stable supported exports should be preferred where available.
13. Generated API code must not be modified during unrelated component cleanup.
14. Component ownership must follow responsibility rather than naming.
15. Agent.Workbench-related naming does not automatically imply Application ownership.

---

# Incorrect Legacy Statements

## 63. Legacy Architecture

The following statements do not describe the accepted architecture:

```text
"Agent.Workbench-specific UI should move to Application."

"Developer Console ownership is waiting for Agent.Workbench extraction."

"Dynamic Content should move into the Agent.Workbench repository."

"Product-specific components must be reviewed before Agent.Workbench Application repository extraction."

"Application owns all menu definitions."

"Application owns all tab definitions."

"Reusable Agent.Workbench UI inside Template is transitional."

"Separate Application repositories require removing standard Agent.Workbench UI from Template."
```

The correct ownership is:

```text
standard Agent.Workbench platform UI
    -> Template

HEMS/future concrete product-only UI
    -> Application
```

---

# Documentation Rule

## 64. Updating This Document

Update this document when reusable component architecture materially changes.

Examples:

```text
new reusable design-system component
component relocation
new public export
new component category
new reusable layout component
new shared editor infrastructure
new architectural ownership decision
```

Documentation should distinguish actual implementation from future ideas.

Do not document speculative component movement as accepted architecture.

---

# Validation

## 65. Validation Commands

Useful checks include:

```bash
git grep -n "@/application/" -- src/template
git grep -n "@/template/" -- src/application
```

For component changes:

```bash
git grep -n "<ComponentName>" -- src test
```

Then run:

```bash
npm run config:generate
npx tsc --noEmit
npm test -- --runInBand
git diff --check
git status --short
```

Runtime/visual validation should be performed when presentation behavior changes.

---

# Success Criteria

## 66. Target State

The component architecture is successful when:

1. Reusable Template UI has a clear owner and location.
2. Standard Agent.Workbench UI remains correctly Template-owned.
3. Concrete Applications reuse common Template components.
4. Core remains independent from Template presentation.
5. Concrete product-only UI does not leak into Template.
6. Design-system imports remain stable and predictable.
7. Theme and localization behavior remain centralized.
8. Layout, navigation, state and business responsibilities remain separated.
9. Template does not import concrete Application components.
10. A concrete consumer such as HEMS can use Template UI without modifying Template internals.
11. Component ownership is based on responsibility rather than product terminology.
12. No separate Agent.Workbench Application extraction is required.

---

# Summary

The component architecture follows:

```text
Application --> Template --> Core
```

Core contains no React presentation layer.

Template owns reusable UI, including:

```text
design system
layout
notifications
localization
developer tools
dynamic content
rich-text editing
standard Agent.Workbench UI
```

Application owns only concrete product-specific UI.

HEMS-specific UI belongs to the HEMS Application.

Standard Agent.Workbench presentation is part of the Base Template and is not transitional Application code.
