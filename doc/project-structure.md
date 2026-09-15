# Project Structure

## Purpose

This document describes the current structure and architectural ownership of the `web.template` repository.

`web.template` is an Expo, React Native Web and TypeScript foundation for EnFlex.IT applications.

The current architecture is implemented and follows:

```text
Application --> Template --> Core
```

The repository provides:

* reusable technical capabilities through Core
* a reusable Base Template
* standard Agent.Workbench functionality as part of the Base Template
* the in-repository Agent.Workbench Application composition that validates the Application integration contract

Agent.Workbench is the current in-repository Application identity/composition, but it is not modeled as a separate consumer Application repository

HEMS is an example of a future concrete Application that can consume the Base Template.

---

# 1. Architecture Model

The implemented dependency direction is:

```text
Application
    |
    v
Template
    |
    v
Core
```

The dependency rules are:

* `application` may consume supported Template and Core integration surfaces.
* `template` may depend on Core.
* `template` must not depend on a concrete Application.
* `core` must not depend on Template.
* `core` must not depend on Application.
* reusable technical capabilities belong to Core.
* reusable application-platform functionality belongs to Template.
* concrete product composition belongs to Application.

Redux is a state-management technology and not a separate architectural layer.

State belongs to the architectural area that owns the corresponding responsibility.

---

# 2. Ownership Model

The general ownership rule is:

```text
Reusable technical capability
    --> Core

Reusable application platform
    --> Template

Concrete product composition
    --> Application
```

Agent.Workbench standard functionality follows the Template rule:

```text
Agent.Workbench standard functionality
    --> Template
```

Examples include:

```text
Program Start
Data Analyzing
Database configuration
Server configuration
Live Console
Settings
Agent.Workbench state
reusable Agent.Workbench navigation
reusable Agent.Workbench API integration where appropriate
```

Concrete HEMS functionality follows the Application rule:

```text
HEMS-specific functionality
    --> HEMS Application
```

---

# 3. Repository Model

The current `web.template` repository contains:

```text
web.template
|
+-- Core
|
+-- Base Template
|   |
|   +-- standard Agent.Workbench functionality
|   +-- reusable navigation
|   +-- reusable state infrastructure
|   +-- authentication/session handling
|   +-- server selection
|   +-- settings
|   +-- updates
|   +-- notifications
|   +-- design system
|   +-- Template screen registry
|
+-- Agent.Workbench Application composition
```

Future concrete Applications consume the Base Template.

Conceptually:

```text
                Base Template
                     ^
                     |
             +-------+-------+
             |               |
           HEMS        future Applications
```

A separate Agent.Workbench Application repository is not required by the current architecture.

---

# 4. Root Level

Important root-level files and directories include:

```text
.
├── .github/
├── assets/
├── doc/
├── src/
├── test/
├── app.json
├── i18n.ts
├── index.ts
├── jest.config.js
├── package.json
├── package-lock.json
├── tsconfig.json
└── unistyles.ts
```

| Path             | Purpose                                              |
| ---------------- | ---------------------------------------------------- |
| `.github/`       | Repository automation and workflows.                 |
| `assets/`        | Static assets and translation resources.             |
| `doc/`           | Architecture, feature and workflow documentation.    |
| `src/`           | Application, Template, Core and related source code. |
| `test/`          | Jest tests and test setup.                           |
| `index.ts`       | Expo application entry point.                        |
| `i18n.ts`        | Internationalization configuration.                  |
| `unistyles.ts`   | Theme and responsive-layout configuration.           |
| `jest.config.js` | Jest configuration.                                  |
| `package.json`   | Project scripts and dependencies.                    |
| `tsconfig.json`  | TypeScript configuration and aliases.                |

Build-related Application configuration tooling currently lives inside the Template configuration infrastructure.

---

# 5. Main Source Structure

The important architectural source structure is:

```text
src/
├── api/
│
├── application/
│   ├── config/
│   ├── generated/
│   ├── screens/
│   ├── state/
│   └── index.ts
│
├── core/
│
└── template/
    ├── application/
    ├── authentication/
    ├── components/
    ├── config/
    ├── hooks/
    ├── navigation/
    ├── screens/
    ├── state/
    ├── styles/
    ├── update/
    └── index.ts
```

The architectural boundary is defined by responsibility, not only by physical directory location.

---

# 6. Application Layer

`src/application/` is the concrete composition layer.

In the current repository it contains the in-repository Agent.Workbench Application composition used to validate the Base Template integration contract.

It is not Agent.Workbench.

The current important structure includes:

```text
src/application/
├── config/
│   ├── application.properties
│   ├── features.properties
│   └── navigation.properties
│
├── generated/
│   ├── applicationConfig.generated.ts
│   └── applicationScreenRegistry.generated.ts
│
├── screens/
│   └── ExampleScreen.tsx
│
├── state/
│   └── applicationReducers.ts
│
└── index.ts
```

Application responsibilities include:

* Application identity and metadata
* semantic Template feature selection
* Application-specific navigation extensions
* Application-specific screens
* Application translations
* optional Application-specific Redux state
* concrete product composition
* product-specific behavior
* product-specific branding where required
* product-specific build and deployment configuration in concrete consumer repositories

---

# 7. Developer-Facing Application Configuration

Developer-facing Application configuration is based on `.properties` files.

The current configuration files are:

```text
src/application/config/
├── application.properties
├── features.properties
└── navigation.properties
```

Their responsibilities are:

```text
application.properties
    Application identity and metadata

features.properties
    semantic activation or deactivation
    of reusable Template features

navigation.properties
    Application-specific navigation extensions
```

Developers should not need to edit TypeScript, TSX, JavaScript or JSON files for normal Application configuration.

Generated TypeScript may exist as build/runtime output, but it is not the developer-facing configuration surface.

---

# 8. Legacy Configuration Names

The following older configuration names are no longer part of the current architecture:

```text
menu.properties
tabs.properties
featureFlags.properties
menuFeatureFlags.properties
tabFeatureFlags.properties
```

They must not be documented as current or planned Application configuration.

The active configuration model is:

```text
application.properties
features.properties
navigation.properties
```

---

# 9. Application Identity

Application identity and metadata are defined through:

```text
src/application/config/application.properties
```

Application identity belongs to Application.

Template receives only the values it requires through the supported Application integration contract.

Template components must not rely on hardcoded product-specific identity values.

---

# 10. Semantic Feature Selection

Reusable Template features are enabled or disabled through:

```text
src/application/config/features.properties
```

Examples include:

```properties
feature.notifications.enabled=true
feature.appearance.enabled=true
feature.serverSettings.enabled=true
feature.liveConsole.enabled=true
feature.programStart.enabled=true
feature.dataAnalyzing.enabled=true
feature.database.general.enabled=true
```

The Application selects reusable capabilities.

Template owns their internal implementation.

This means the Application does not need to define:

* Template menu IDs
* Template parent IDs
* Template screen registry keys
* authentication visibility rules
* runtime visibility rules
* Agent.Workbench internal navigation structure

---

# 11. Application Navigation

Application-specific navigation is defined through:

```text
src/application/config/navigation.properties
```

Example:

```properties
menu.example.enabled=true
menu.example.caption=exampleApplication
menu.example.parent=settings
menu.example.position=99
menu.example.screen=example-screen
```

This configuration describes an Application-owned navigation extension.

Applications do not manually maintain Template internal numeric IDs.

Custom IDs are generated or resolved internally.

The custom Application `position` value remains optional.

---

# 12. Configuration Generation

Developer-facing configuration is transformed into generated runtime configuration.

Conceptually:

```text
Application .properties
        |
        v
Template configuration tooling
        |
        v
generated runtime configuration
        |
        v
Application composition
        |
        v
Base Template
```

The current Application configuration generator exists under:

```text
src/template/config/build/
```

A known generator is:

```text
generateApplicationConfig.mjs
```

Generated Application configuration is written under:

```text
src/application/generated/
```

Generated files must not become the primary manual configuration surface.

---

# 13. Automatic Application Screen Discovery

Application-owned screens are discovered automatically.

The discovery implementation is:

```text
src/template/config/build/applicationScreenDiscovery.mjs
```

Examples:

```text
ExampleScreen.tsx
    -> example-screen

ExampleScreen2.tsx
    -> example-screen2

HemsOverviewScreen.tsx
    -> hems-overview-screen
```

The generated registry is:

```text
src/application/generated/applicationScreenRegistry.generated.ts
```

The current Agent.Workbench Application composition contains:

```text
src/application/screens/ExampleScreen.tsx
```

Applications therefore do not need to manually import and register every Application screen inside Template.

---

# 14. Application Entry Point

The root project entry point is:

```text
index.ts
```

Application composition follows the direction:

```text
Application configuration
        |
        v
Application
        |
        v
createTemplateApp(...)
        |
        v
TemplateApp
```

The Application selects and configures the Base Template.

Template does not select a concrete Application.

There is no intended runtime multi-Application resolver inside Template.

---

# 15. Template Layer

`src/template/` contains the reusable application platform.

Important areas include:

```text
src/template/
├── application/
├── authentication/
├── components/
├── config/
├── hooks/
├── navigation/
├── screens/
├── state/
├── styles/
├── update/
└── index.ts
```

Template responsibilities include:

* reusable React application shell
* Application integration contract
* standard Agent.Workbench functionality
* reusable Agent.Workbench state
* reusable Agent.Workbench API integration where appropriate
* authentication/session orchestration
* server selection
* navigation infrastructure
* Template navigation definitions
* Template screen registry
* settings
* notifications
* update orchestration
* design system
* reusable components
* reusable hooks
* reusable screens
* reusable Redux infrastructure

Template may depend on Core.

Template must not depend on a concrete Application.

---

# 16. Template Application Shell

The Template application integration layer exists under:

```text
src/template/application/
├── ApplicationConfig.ts
├── ApplicationConfigContext.tsx
├── createTemplateApp.tsx
└── TemplateApp.tsx
```

## ApplicationConfig.ts

Defines the typed integration contract between a concrete Application and the Base Template.

Template owns the contract.

Application supplies concrete values.

## ApplicationConfigContext.tsx

Provides selected Application configuration values to reusable Template components.

This prevents Template UI from depending directly on concrete product implementation.

## createTemplateApp.tsx

Provides the reusable composition point between Application and Template.

Conceptually:

```text
Application
    |
    v
createTemplateApp(...)
    |
    v
TemplateApp
```

## TemplateApp.tsx

Provides the reusable runtime application shell.

Its responsibilities include reusable application-level integration such as:

* state integration
* navigation
* session protection
* application layout
* overlays and dialogs
* notifications
* update watchers
* developer tooling

---

# 17. Agent.Workbench Ownership

Agent.Workbench standard functionality is intentionally Template-owned.

It is not transitional Application code.

Known Agent.Workbench-related Template responsibilities include functionality such as:

```text
Program Start
Data Analyzing
Exec Settings
Data Analysis state
Database functionality
Live Console
Server configuration
Agent.Workbench navigation
```

A known dedicated state area is:

```text
src/template/state/agent-workbench/
```

This ownership is deliberate.

These modules are not waiting to be moved into a separate Agent.Workbench Application repository.

---

# 18. Template Navigation

Reusable navigation infrastructure belongs to Template.

Important navigation responsibilities include:

* menu tree construction
* menu rendering
* routing
* path generation
* Template feature navigation
* visibility integration
* static and dynamic navigation composition
* Template screen registration

Template also owns the internal navigation definitions for reusable Agent.Workbench functionality.

Application navigation extends Template navigation rather than replacing it.

Conceptually:

```text
Template navigation
        +
Application navigation extensions
        |
        v
runtime navigation
```

---

# 19. Template Menu Ordering

Normal Template menu order is derived automatically from sibling order in the Template menu catalog.

Template menu entries therefore do not require manually maintained numeric positions in normal cases.

Application custom `position` values remain optional.

For missing positions, MenuHub uses:

```ts
Number.MAX_SAFE_INTEGER
```

The relevant screen is:

```text
src/template/screens/menu/MenuHubScreen.tsx
```

This keeps Drawer and MenuHub ordering consistent.

---

# 20. Template State

Reusable Redux state is organized according to architectural ownership under:

```text
src/template/state/
```

Template-owned state includes reusable platform state and standard Agent.Workbench state.

Examples of reusable Template responsibility areas may include:

* authentication/session
* connectivity
* developer tools
* localization
* navigation
* notifications
* release information
* server handling
* settings
* theme
* updates
* user/session information
* Agent.Workbench state

State placement follows responsibility rather than a generic Redux-only architecture.

---

# 21. Redux Store Infrastructure

Reusable Redux infrastructure exists under:

```text
src/template/state/store/
```

Known files include:

```text
createTemplateStore.ts
rootReducer.ts
store.ts
templateReducers.ts
types.ts
useAppDispatch.ts
useAppSelector.ts
```

Template owns reusable Redux infrastructure.

The architectural composition model is:

```text
Template reducers
        +
optional Application reducers
        |
        v
runtime Redux store
```

Template must not import concrete Application reducers directly.

---

# 22. Application-Specific Redux State

Concrete Applications may provide Application-specific Redux reducers when required.

The current Application extension point is:

```text
src/application/state/applicationReducers.ts
```

The current Agent.Workbench Application composition does not require meaningful Application-specific Redux state.

Therefore this registry is currently essentially empty.

This is valid and expected.

Agent.Workbench state does not belong in this registry because Agent.Workbench standard state is Template-owned.

---

# 23. Reducer Ownership

The Redux ownership rule is:

```text
Reusable Template state
    -> Template

Agent.Workbench standard state
    -> Template

Concrete product-only state
    -> Application
```

Application reducers must not silently replace Template-owned reducer keys.

Reducer composition must preserve clear ownership boundaries.

---

# 24. Core Layer

`src/core/` contains reusable technical capabilities and technical types.

Core must remain independent from Template UI and concrete Application composition.

Known top-level areas include:

```text
src/core/
├── authentication/
├── runtime/
├── server/
└── update/
```

General dependency rules:

```text
Core -X-> Template
Core -X-> Application
```

Core should not contain:

* React application-shell composition
* Template navigation
* Template UI
* Agent.Workbench composition
* concrete product composition

---

# 25. Core Authentication

Reusable technical authentication capabilities exist under:

```text
src/core/authentication/
```

Examples include technical concerns such as:

* shared authentication types
* authentication transport
* JWT timing helpers
* interceptor behavior
* logout-flow guards

Higher-level session orchestration and authentication UI remain Template responsibilities.

---

# 26. Core Server Infrastructure

Reusable technical server capabilities exist under:

```text
src/core/server/
```

Responsibilities may include:

* server normalization
* validation
* technical server checks
* server-environment detection
* backend information parsing
* technical server types

Template owns higher-level server selection, state, orchestration and UI.

---

# 27. Core Runtime

Reusable technical runtime functionality exists under:

```text
src/core/runtime/
```

The ownership rule is:

```text
technical runtime capability
    -> Core

reusable application orchestration
    -> Template

product-specific runtime behavior
    -> Application
```

---

# 28. Core Update Infrastructure

Reusable technical update capabilities exist under:

```text
src/core/update/
```

Core contains technical update helpers.

Template contains reusable update orchestration, state, watchers, dialogs and notifications.

---

# 29. Design System

The reusable design system belongs to Template.

Important structure includes:

```text
src/template/components/design-system/
├── icons/
├── stylistic/
├── themed/
├── ui-elements/
└── index.ts
```

Reusable UI should prefer supported public exports rather than fragile deep imports.

The design system does not belong to Core because it is part of the reusable application platform.

---

# 30. Reusable Template Components

Reusable components include areas such as:

```text
src/template/components/design-system/
src/template/components/developer-tools/
src/template/components/dynamic-content/
src/template/components/layout/
src/template/components/localization/
src/template/components/notifications/
src/template/components/rich-text-editor/
```

A component belongs to Application only when it is genuinely product-specific.

---

# 31. API Structure

The repository contains an API area under:

```text
src/api/
```

Known areas include:

```text
src/api/definition/
src/api/implementation/
```

Generated clients include areas such as:

```text
src/api/implementation/AWB-RestAPI/
src/api/implementation/Dynamic-Content-Api/
```

Generated API code should not be manually reformatted during unrelated architecture cleanup.

API ownership follows responsibility:

```text
generic technical API capability
    -> Core where appropriate

reusable Agent.Workbench/Base Template API integration
    -> Template where appropriate

concrete product business API
    -> Application
```

Agent.Workbench API functionality is not automatically Application-owned merely because it contains Agent.Workbench-specific names.

---

# 32. Update Infrastructure

Reusable update orchestration belongs to Template.

Known watcher infrastructure includes:

```text
src/template/update/watchers/
```

Technical update helpers that do not depend on Template orchestration may belong to Core.

The distinction is based on responsibility rather than historical location.

---

# 33. Authentication and Session Handling

Authentication is distributed by responsibility:

```text
Core
├── technical authentication logic
├── technical types
└── transport helpers

Template
├── authentication UI
├── session guards
├── reusable authentication state
└── application-shell integration

Application
└── concrete product configuration where required
```

Authentication is therefore not a single architecture layer.

---

# 34. Public APIs and Aliases

The repository uses aliases to make architectural ownership clearer.

Known aliases include:

```text
@core
@template
@application
@design-system
@
```

Concrete consumer Applications should prefer supported public Template APIs and documented extension points.

Avoid unnecessary deep imports into Template implementation details.

The long-term public consumption surface may expose reusable APIs such as:

```ts
createTemplateApp
ApplicationConfig
Application reducer extension types
supported Template components
supported extension interfaces
```

Only intentionally supported APIs should form the public Template contract.

---

# 35. Future HEMS Consumer

HEMS is a concrete Application.

A future HEMS repository may own:

```text
HEMS Application configuration
HEMS feature selection
HEMS navigation extensions
HEMS-specific screens
HEMS translations
optional HEMS state
HEMS business APIs
HEMS branding
HEMS build and deployment configuration
```

Conceptually:

```text
HEMS Application
        |
        v
Base Template
        |
        v
Core
```

The Base Template continues to provide standard Agent.Workbench functionality.

---

# 36. Start Commands

Application configuration generation is integrated into the normal development lifecycle.

Normal development entry points include:

```bash
npm start
npm run web
npm run android
npm run ios
```

Application configuration can also be generated explicitly with:

```bash
npm run config:generate
```

When configuration changes, generation should occur before TypeScript validation.

Direct tooling commands that bypass npm lifecycle hooks should not be preferred when generated Application configuration may be stale.

---

# 37. Validation

Important validation commands include:

```bash
npm run config:generate
npx tsc --noEmit
npm test -- --runInBand
git diff --check
git status --short
```

Architecture dependency checks include:

```bash
git grep -n "@/application/" -- src/template
```

Template should not import concrete Application implementation.

A corresponding Application-side review is:

```bash
git grep -n "@/template/" -- src/application
```

Unexpected deep Template imports should be reviewed against the supported public integration API.

---

# 38. Refactoring Workflow

Architecture changes should be performed in small, controlled batches.

Recommended sequence:

1. Verify ownership.
2. Search current usages and imports.
3. Make the smallest coherent change.
4. Regenerate Application configuration when required.
5. Run TypeScript validation.
6. Run affected tests.
7. Run dependency checks where relevant.
8. Run `git diff --check`.
9. Review `git status --short`.
10. Commit a coherent completed change.

Avoid broad automated rewrites across unrelated files.

Generated API code should not be reformatted or moved as an unrelated side effect.

---

# 39. Current Implementation Status

## Implemented

* `Application --> Template --> Core` dependency model
* Core, Template and Application responsibility separation
* reusable Template application shell
* `ApplicationConfig`
* `ApplicationConfigContext`
* `createTemplateApp`
* properties-based Application configuration
* `application.properties`
* `features.properties`
* `navigation.properties`
* generated runtime Application configuration
* automatic Application screen discovery
* generated Application screen registry
* Agent.Workbench Application composition
* semantic Template feature selection
* Application-specific navigation extensions
* Template-owned navigation internals
* automatic Template menu ordering
* reusable Redux infrastructure
* Template-owned Agent.Workbench state
* optional Application reducer extension point
* Core authentication/server/runtime/update separation
* Template design system
* reusable update infrastructure
* standard Agent.Workbench functionality as part of the Base Template

## Current Agent.Workbench Application Composition

The current Agent.Workbench Application composition validates the integration contract.

It currently contains:

```text
Application configuration
ExampleScreen.tsx
generated runtime artifacts
optional Application reducer extension point
```

It does not represent Agent.Workbench.

## Future Consumer Work

Future work may include:

```text
HEMS consumer repository integration
Base Template consumption validation from a separate repository
public package/API refinement
consumer-specific build and deployment setup
```

These tasks extend the current architecture rather than redefining Agent.Workbench ownership.

---

# 40. Incorrect Legacy Assumptions

The following statements are no longer correct:

```text
"Agent.Workbench is a concrete Application."

"Agent.Workbench will move into a separate Application repository."

"Agent.Workbench screens inside Template are transitional."

"Agent.Workbench reducers must move into Application."

"The Base Template must not contain Agent.Workbench functionality."

"menu.properties is planned Application configuration."

"tabs.properties is planned Application configuration."

"featureFlags.properties is planned Application configuration."

"Concrete Applications provide the complete Template menu structure."

"The Redux architecture is incomplete because Agent.Workbench state
still exists inside Template."
```

The current architecture is:

```text
Agent.Workbench standard functionality
    -> Base Template

HEMS
    -> concrete Application
```

---

# 41. Current Project Structure Summary

The repository is structured around:

```text
Application --> Template --> Core
```

Core provides reusable technical capabilities.

Template provides the reusable application platform.

Standard Agent.Workbench functionality belongs to Template.

Application provides concrete product composition.

The current `src/application/` is the in-repository Agent.Workbench Application composition.

Developer-facing Application configuration uses:

```text
application.properties
features.properties
navigation.properties
```

Template owns reusable navigation internals and standard Agent.Workbench navigation.

Application-specific navigation extends the Template.

Application screens are discovered automatically.

Template owns reusable Redux infrastructure and Agent.Workbench state.

Application-specific Redux state is optional.

HEMS is a future concrete consumer Application.

A separate Agent.Workbench Application repository is not part of the current architecture.
