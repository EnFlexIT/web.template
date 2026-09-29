# Application Navigation Architecture

## Purpose

This document describes the supported navigation composition model between a concrete Application and the reusable Base Template.

The navigation architecture follows the established dependency direction:

```text
Application --> Template --> Core
```

A concrete Application owns its product-specific navigation configuration.

The Base Template owns reusable navigation infrastructure, Template-owned menu definitions, internal menu IDs, routing integration and navigation rendering.

The developer-facing configuration remains:

```text
src/application/config/navigation.properties
```

Applications must not require knowledge of internal Template menu IDs.

---

# 1. Ownership Model

Navigation responsibilities are separated between Application and Template.

## Application owns

```text
Application navigation root
Application-specific menu entries
Application-specific captions
Application-specific screens
Application menu positions
Application navigation presentation options
navigation root composition mode
```

## Template owns

```text
navigation infrastructure
internal Template menu IDs
internal Template parent IDs
Template-owned navigation definitions
Template screen registry keys
runtime visibility rules
authentication visibility
menu rendering
routing integration
generated runtime navigation
```

The Application configures navigation semantically.

It must not duplicate the internal Template navigation structure.

---

# 2. Developer-Facing Configuration

Application navigation is configured through:

```text
src/application/config/navigation.properties
```

The configuration is intentionally properties-based.

Developers must not need to edit generated TypeScript to configure navigation.

Generated files such as:

```text
src/application/generated/applicationConfig.generated.ts
```

are runtime/build artifacts.

They are not the primary developer-facing configuration surface.

---

# 3. Navigation Root Modes

The Application can configure how Application navigation and Template settings navigation are composed.

The supported property is:

```properties
NavigationRootMode=split
```

or:

```properties
NavigationRootMode=unified
```

The supported values are:

```text
split
unified
```

If the property is omitted, the default is:

```text
split
```

This preserves compatibility with existing Applications.

---

# 4. Split Navigation Mode

Split mode keeps Application navigation and Template settings navigation as separate roots where required by the concrete Application.

Example:

```text
Application Root             Settings Root
├── Home                     ├── Notifications
└── Project Setup            ├── System Settings
                             └── Personal Settings
```

Configuration:

```properties
NavigationRootMode=split
```

Split mode represents the traditional navigation composition.

It is useful when Application functionality and reusable Template settings should remain visually separated.

The Template remains responsible for its own Settings root and its internal descendants.

---

# 5. Unified Navigation Mode

Unified mode combines Application navigation and reusable Template settings under one Application-owned root.

Example:

```text
HEMS
├── Home
├── Project Setup
├── Notifications
├── System Settings
│   ├── Server Settings
│   ├── Update
│   ├── Log
│   └── Configuration
└── Personal Settings
    ├── Appearance
    ├── Privacy
    ├── User Profile
    └── Change Password
```

Configuration:

```properties
NavigationRootMode=unified
```

In unified mode, the Template Settings root itself is not materialized as an additional visible root.

Instead, its direct children are composed below the Application root.

Deeper Template-owned hierarchy remains unchanged.

---

# 6. applicationRoot

The semantic Application navigation root is:

```text
applicationRoot
```

Example:

```properties
menu.applicationRoot.enabled=true
menu.applicationRoot.caption=hems
menu.applicationRoot.position=1
menu.applicationRoot.screen=home-screen
```

Application-owned child menus may reference it:

```properties
menu.home.enabled=true
menu.home.caption=home
menu.home.parent=applicationRoot
menu.home.position=1
menu.home.screen=home-screen
```

and:

```properties
menu.projectSetup.enabled=true
menu.projectSetup.caption=projectSetup
menu.projectSetup.parent=applicationRoot
menu.projectSetup.position=2
menu.projectSetup.screen=project-setup-screen
```

`applicationRoot` is part of the semantic Application navigation contract.

It allows concrete Applications to compose their own root without depending on Template implementation details.

---

# 7. Internal Template Settings Root

The Template internally owns its Settings navigation structure.

Concrete Applications must not depend on the internal Template root key:

```text
settings
```

This key is an implementation detail of the Base Template.

Incorrect Application coupling:

```properties
menu.example.parent=settings
```

Preferred Application composition:

```properties
menu.example.parent=applicationRoot
```

Applications should use semantic Application-owned navigation relationships instead of Template-internal parent keys.

This keeps the Template free to change internal navigation structure without requiring changes in every consumer Application.

---

# 8. Unified Composition Behavior

When:

```properties
NavigationRootMode=unified
```

is active, the configuration generator performs the following logical composition:

```text
Application root
    +
Application-owned children
    +
direct children of Template Settings
    |
    v
Unified runtime navigation
```

Conceptually:

```text
applicationRoot
├── Application child 1
├── Application child 2
├── Template settings child 1
├── Template settings child 2
└── Template settings child 3
```

The Template Settings root itself is omitted from the generated visible root hierarchy.

Its direct children receive the generated ID of `applicationRoot` as their runtime parent.

---

# 9. Menu Ordering

Application-owned child menus may define explicit positions.

Example:

```properties
menu.home.position=1
menu.projectSetup.position=2
```

In unified mode, direct Template Settings children are positioned after the direct Application children.

Example:

```text
Home                 position 1
Project Setup        position 2
Notifications        position 3
System Settings      position 4
Personal Settings    position 5
```

This prevents position collisions between Application-owned entries and Template-owned Settings entries.

The generated menu collection is ordered by menu position before it is materialized into the runtime Application configuration.

Items without an explicit position use the existing navigation fallback behavior.

---

# 10. Nested Template Navigation

Unified mode only changes the composition of the Template Settings root.

It does not flatten the complete Template navigation tree.

For example:

```text
System Settings
├── Server Settings
├── Update
├── Log
└── Configuration
```

remains Template-owned.

Likewise:

```text
Personal Settings
├── Appearance
├── Privacy
├── User Profile
└── Change Password
```

remains Template-owned.

Concrete Applications do not need to reproduce these definitions.

---

# 11. Feature Selection versus Navigation Composition

Template capability selection and navigation composition are separate responsibilities.

Reusable Template features are selected through:

```text
src/application/config/features.properties
```

Example:

```properties
feature.notifications.enabled=true
feature.serverSettings.enabled=true
feature.liveConsole.enabled=true
```

Application navigation composition is configured through:

```text
src/application/config/navigation.properties
```

Conceptually:

```text
features.properties
    |
    +-- Which reusable Template capabilities are enabled?

navigation.properties
    |
    +-- How is Application-owned navigation composed and presented?
```

Navigation configuration must not duplicate Template feature definitions.

---

# 12. Application Screens

Application-owned navigation entries may reference Application-owned screens.

Example:

```properties
menu.projectSetup.screen=project-setup-screen
```

Application screens are discovered through the existing Application screen discovery mechanism.

Example:

```text
ProjectSetupScreen.tsx
    |
    v
project-setup-screen
```

The Template must not import the concrete screen directly.

The generated Application screen registry resolves the Application-owned screen.

---

# 13. Translation Keys

Navigation captions are semantic translation keys.

Example:

```properties
menu.applicationRoot.caption=hems
menu.home.caption=home
menu.projectSetup.caption=projectSetup
```

Visible labels belong to the Application translation resources.

Example:

```json
{
  "hems": "HEMS",
  "home": "Home",
  "projectSetup": "Project Setup"
}
```

This keeps navigation configuration independent from the displayed language.

---

# 14. HEMS Example

HEMS currently uses unified navigation.

Conceptually:

```text
HEMS
├── Home
├── Project Setup
├── Notifications
├── System Settings
│   ├── Server Settings
│   ├── Update
│   ├── Log
│   └── Configuration
└── Personal Settings
```

The relevant Application configuration follows this model:

```properties
NavigationRootMode=unified

menu.applicationRoot.enabled=true
menu.applicationRoot.caption=hems
menu.applicationRoot.position=1
menu.applicationRoot.screen=home-screen

menu.home.enabled=true
menu.home.caption=home
menu.home.parent=applicationRoot
menu.home.position=1
menu.home.screen=home-screen

menu.projectSetup.enabled=true
menu.projectSetup.caption=projectSetup
menu.projectSetup.parent=applicationRoot
menu.projectSetup.position=2
menu.projectSetup.screen=project-setup-screen
```

HEMS does not need to define the internal Template Settings hierarchy.

---

# 15. Generation

The navigation configuration is processed by the Template configuration generator:

```text
src/template/config/build/generateApplicationConfig.mjs
```

The normal generation command is:

```text
npm run config:generate
```

The generator is responsible for:

```text
parsing navigation.properties
validating NavigationRootMode
allocating Application menu IDs
resolving Application parent relationships
composing Template and Application navigation
resolving unified root composition
preventing direct position collisions
ordering generated menu entries
materializing runtime Application configuration
```

Concrete Applications must not manually reproduce this behavior.

---

# 16. Validation

Navigation changes should normally be validated with:

```text
npm run config:generate
npx tsc --noEmit
git diff --check
git status --short
```

Generated navigation should also be reviewed when changing:

```text
NavigationRootMode
applicationRoot
Application menu parent relationships
menu positions
Template navigation composition
```

For unified navigation, the generated direct children of `applicationRoot` should have deterministic positions.

---

# 17. Architecture Rules

The following rules must remain true:

1. Application owns concrete product navigation.
2. Template owns reusable navigation infrastructure.
3. Template owns internal Template navigation IDs.
4. Applications must not manually maintain Template numeric menu IDs.
5. `applicationRoot` is the semantic Application root.
6. Applications should not depend on the internal Template `settings` root.
7. `split` is the default navigation root mode.
8. `unified` composes Template Settings children below `applicationRoot`.
9. Unified mode does not flatten deeper Template navigation.
10. Application menu positions remain Application-controlled.
11. Direct Template Settings children follow direct Application children in unified mode.
12. Feature selection remains separate from navigation composition.
13. Generated TypeScript is implementation output, not developer-facing configuration.
14. Concrete Application screens remain Application-owned.
15. Template must not import concrete Application navigation implementation.

---

# 18. Summary

The supported navigation model is:

```text
Application
    |
    +-- navigation.properties
    |
    +-- applicationRoot
    |
    +-- Application-owned navigation
    |
    v
Base Template navigation composition
    |
    +-- Template-owned settings/features
    |
    v
Generated runtime navigation
```

The two supported root modes are:

```text
split
    Application navigation and Template Settings may remain separate.

unified
    Application navigation and Template Settings are composed below
    applicationRoot.
```

This model preserves the architecture rule:

```text
Application --> Template --> Core
```

while allowing each concrete Application to choose the navigation composition appropriate for its product without depending on internal Template navigation IDs.
