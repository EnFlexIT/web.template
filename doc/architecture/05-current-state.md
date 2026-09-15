# Current Architecture

## Purpose

This document describes the current implemented architecture of `web.template`.

The architecture described here is active. It is not merely a future target or an incremental migration plan.

The repository provides a reusable Base Template together with the in-repository Agent.Workbench Application composition that validates the Application integration contract.

The implemented dependency direction is:

```text
Application --> Template --> Core
```

The architectural layers have clearly separated responsibilities:

* **Core** provides reusable technical capabilities.
* **Template** provides the reusable application platform, including the standard Agent.Workbench functionality.
* **Application** is the concrete product and composition layer.

Agent.Workbench standard functionality is intentionally part of the Base Template.

HEMS is an example of a concrete Application that can consume the Base Template.

A separate Agent.Workbench Application repository is not required by the current architecture.

---

# 1. Current Repository State

The repository currently contains three architectural responsibility areas:

```text
src/
├── core/
├── template/
└── application/
```

Conceptually:

```text
Concrete Application
        |
        v
Base Template
        |
        v
Core
```

The current `src/application/` directory is the in-repository Agent.Workbench Application composition of this repository.

It demonstrates how a concrete Application can:

* provide Application metadata
* select reusable Template features
* provide Application-specific navigation
* provide Application-specific screens
* provide Application translations
* optionally provide Application-specific Redux state

The current Application composition is configured as Agent.Workbench.

Agent.Workbench standard functionality is intentionally owned by Template.

A future consumer such as HEMS is expected to use the Base Template from its own concrete Application repository.

---

# 2. Current Dependency Model

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

The dependency direction must not be reversed.

## Core

Core contains reusable technical capabilities.

Core must not depend on Template.

Core must not depend on Application.

```text
Core -X-> Template
Core -X-> Application
```

## Template

Template contains the reusable application platform.

Template may depend on Core.

Template must not depend on a concrete Application.

```text
Template ---> Core
Template -X-> Application
```

Template owns reusable platform functionality including:

* application bootstrap
* reusable React application shell
* Agent.Workbench standard functionality
* Agent.Workbench state
* reusable Agent.Workbench API integration where appropriate
* authentication and session orchestration
* server selection
* navigation infrastructure
* Template navigation definitions
* settings
* update orchestration
* design system
* notifications
* reusable screens
* Template screen registry
* Template feature definitions
* reusable Redux infrastructure

## Application

Application is the concrete composition root.

Application may consume the public integration surfaces provided by Template and Core.

Application owns:

* Application identity and metadata
* semantic Template feature selection
* Application-specific navigation
* Application-specific screens
* Application-specific translations
* optional Application-specific Redux state
* concrete product composition
* product-specific behavior

The Template must not need to know which concrete Application is consuming it.

---

# 3. Current Core Structure

The currently established top-level Core areas include:

```text
src/core/
├── authentication/
├── runtime/
├── server/
└── update/
```

Core contains reusable technical functionality.

Core is not the reusable React application platform.

React application-shell functionality remains in Template.

Core does not own:

* concrete product composition
* Application configuration
* Agent.Workbench composition
* Template navigation
* Template UI orchestration

Agent.Workbench standard functionality belongs to Template.

Concrete product functionality belongs to Application.

---

# 4. Core Authentication

Reusable technical authentication capabilities exist under:

```text
src/core/authentication/
```

Known files include:

```text
src/core/authentication/
├── types.ts
├── http/
│   └── attachAuthInterceptors.tsx
├── jwt/
│   └── jwtTime.ts
└── logout/
    └── logoutFlowGuard.ts
```

Core authentication is responsible for reusable technical authentication behavior.

Reusable session orchestration and authentication UI remain Template responsibilities.

The separation is therefore:

```text
Core
└── technical authentication capabilities

Template
└── reusable authentication/session orchestration and UI

Application
└── product-specific composition
```

---

# 5. Core Runtime

Reusable technical runtime functionality exists under:

```text
src/core/runtime/
```

Runtime ownership follows the general architecture rule:

```text
technical runtime capability
    --> Core

reusable application orchestration
    --> Template

product-specific runtime behavior
    --> Application
```

Core runtime functionality must remain independent from concrete Applications and from Template UI composition.

---

# 6. Core Server Infrastructure

Reusable technical server infrastructure exists under:

```text
src/core/server/
```

Core server responsibilities include reusable technical behavior such as:

* server normalization
* server validation
* technical server checks
* server-environment detection
* reusable backend information parsing
* technical server types

Higher-level server behavior remains outside Core.

The ownership boundary is:

```text
Core
├── technical server capabilities
└── reusable backend/server logic

Template
├── server-selection UI
├── server orchestration
└── reusable server-related state

Application
└── product-specific server configuration where required
```

---

# 7. Core Update Infrastructure

Reusable technical update capabilities exist under:

```text
src/core/update/
```

Core update functionality is limited to reusable technical helpers and infrastructure.

Higher-level reusable update behavior belongs to Template, including where applicable:

* update state
* update hooks
* update watchers
* update dialogs
* update notifications
* update orchestration

Concrete product-specific update behavior belongs to Application only when it is actually product-specific.

---

# 8. Current Template Responsibilities

Template provides the reusable Base Template platform.

Its responsibilities include:

```text
Template application bootstrap
React application shell
Application integration contract
navigation infrastructure
Template navigation definitions
Template screen registry
feature definitions
authentication/session orchestration
server selection
settings
update orchestration
Redux infrastructure
Agent.Workbench standard screens
Agent.Workbench state
design system
notifications
reusable components
reusable hooks
common screens
localization infrastructure
```

Agent.Workbench is intentionally represented here.

It is not treated as transitional product code.

Standard Agent.Workbench functionality belongs to the Base Template because it is part of the reusable platform delivered by `web.template`.

---

# 9. Agent.Workbench Ownership

The current architecture explicitly defines Agent.Workbench standard functionality as Template-owned.

This includes reusable Agent.Workbench functionality such as:

```text
Program Start
Data Analyzing
Database configuration
Server configuration
Live Console
Settings
Update infrastructure
Agent.Workbench state
```

The exact internal organization can evolve, but the ownership boundary is established:

```text
Agent.Workbench standard functionality
    --> Template
```

Agent.Workbench functionality must therefore not be documented as:

```text
transitional Application code
future Agent.Workbench Application code
code waiting to be moved into an Agent.Workbench repository
```

A separate Agent.Workbench Application repository is not part of the current architecture.

---

# 10. Template Application Contract

The reusable Application integration layer exists under:

```text
src/template/application/
```

Known files include:

```text
ApplicationConfig.ts
ApplicationConfigContext.tsx
createTemplateApp.tsx
TemplateApp.tsx
```

These files implement the integration boundary between a concrete Application and the Base Template.

Conceptually:

```text
Concrete Application
        |
        v
Application configuration
        |
        v
createTemplateApp(...)
        |
        v
TemplateApp
```

The Application supplies concrete composition.

Template supplies the reusable application platform.

---

# 11. Application Configuration Model

Developer-facing Application configuration must not require developers to edit TypeScript, TSX, JavaScript or JSON configuration files.

The current configuration source is:

```text
src/application/config/
├── application.properties
├── features.properties
└── navigation.properties
```

The responsibilities are:

```text
application.properties
    Application identity and metadata

features.properties
    semantic activation or deactivation
    of reusable Template features

navigation.properties
    Application-owned navigation extensions
```

The old configuration names are no longer part of the current architecture:

```text
menu.properties
tabs.properties
featureFlags.properties
```

Documentation must not present these old files as active configuration.

Generated TypeScript may exist as runtime or build output, but it is not the developer-facing configuration format.

---

# 12. Semantic Feature Configuration

Concrete Applications enable or disable reusable Template capabilities semantically.

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

Applications select capabilities.

Applications do not reproduce the internal navigation implementation of those capabilities.

Template remains responsible for:

* internal menu IDs
* internal parent IDs
* Template screen registry keys
* authentication visibility
* runtime visibility rules
* Agent.Workbench navigation definitions
* Template navigation structure

This keeps the Application configuration stable even when Template internals change.

---

# 13. Application-Owned Navigation

Application-specific navigation is configured through:

```text
src/application/config/navigation.properties
```

An Application navigation extension can conceptually look like:

```properties
menu.example.enabled=true
menu.example.caption=exampleApplication
menu.example.parent=settings
menu.example.position=99
menu.example.screen=example-screen
```

Application navigation configuration describes the Application-owned extension semantically.

Internal numeric IDs are generated or managed internally.

Applications must not need to maintain Template internal menu IDs.

The `position` of a custom Application menu remains optional.

---

# 14. Template Navigation Ownership

Reusable Template navigation definitions remain inside Template.

Applications do not duplicate standard Agent.Workbench menu definitions.

The relationship is:

```text
Template navigation
    +
Application navigation extensions
    |
    v
runtime navigation
```

Template owns reusable navigation structure.

Application only adds or selects product-specific composition.

---

# 15. Template Menu Ordering

Template menu ordering is derived automatically from the order of sibling entries in the Template menu catalog.

Normal Template menu items therefore do not require manually maintained numeric positions.

Application custom menu positions remain optional.

The MenuHub fallback for items without an explicit position is:

```ts
Number.MAX_SAFE_INTEGER
```

The relevant sorting behavior is:

```ts
function sortByPosition(
  a: StaticMenuItem,
  b: StaticMenuItem,
) {
  return (
    (
      a.position ??
      Number.MAX_SAFE_INTEGER
    ) -
    (
      b.position ??
      Number.MAX_SAFE_INTEGER
    )
  );
}
```

This keeps Drawer ordering and MenuHub ordering consistent.

The relevant screen is:

```text
src/template/screens/menu/MenuHubScreen.tsx
```

---

# 16. Automatic Application Screen Discovery

Application-owned screens are discovered automatically.

The discovery implementation exists at:

```text
src/template/config/build/applicationScreenDiscovery.mjs
```

Screen file names are converted into runtime screen keys.

Examples:

```text
ExampleScreen.tsx
    --> example-screen

ExampleScreen2.tsx
    --> example-screen2

HemsOverviewScreen.tsx
    --> hems-overview-screen
```

The generated registry is:

```text
src/application/generated/applicationScreenRegistry.generated.ts
```

Concrete Applications therefore do not need to manually import and register every Application screen.

The current Agent.Workbench Application composition contains:

```text
src/application/screens/ExampleScreen.tsx
```

---

# 17. Current Application Structure

The current Agent.Workbench Application composition contains the concrete composition layer of this repository.

Relevant areas include:

```text
src/application/
├── index.ts
├── config/
│   ├── application.properties
│   ├── features.properties
│   └── navigation.properties
├── generated/
│   ├── applicationConfig.generated.ts
│   └── applicationScreenRegistry.generated.ts
├── screens/
│   └── ExampleScreen.tsx
└── state/
    └── applicationReducers.ts
```

The current Agent.Workbench Application composition validates that the Base Template can be consumed through the intended Application contract.

It is not Agent.Workbench.

It is not intended to contain reusable Template functionality.

---

# 18. Generated Application Configuration

Developer-facing `.properties` files are transformed into generated runtime configuration.

Conceptually:

```text
Application .properties
        |
        v
configuration generation
        |
        v
generated TypeScript/runtime configuration
        |
        v
Application composition
        |
        v
createTemplateApp(...)
```

Generated TypeScript is an implementation detail.

Developers configuring a concrete Application should work with the supported `.properties` configuration sources rather than editing generated TypeScript.

---

# 19. Application Composition Root

Application is the composition root.

The current runtime composition follows the principle:

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

Template does not select between concrete products.

Instead, each concrete Application composes itself with the Base Template.

This is an important dependency rule:

```text
Template does not select Application.

Application selects and configures Template.
```

---

# 20. No Runtime Multi-Application Resolver

The architecture does not require Template to contain a runtime resolver that chooses between HEMS, Agent.Workbench or other products.

A concrete Application has its own composition and build.

Conceptually:

```text
HEMS Application Repository
        |
        v
Base Template
```

Agent.Workbench is not shown as a separate Application repository because its standard functionality is part of the Base Template itself.

Future Applications can follow the same consumer model as HEMS.

---

# 21. Current Redux Ownership

Template owns the reusable Redux infrastructure.

Reusable Redux infrastructure exists under:

```text
src/template/state/
```

Store infrastructure is located under:

```text
src/template/state/store/
```

Agent.Workbench-specific reusable state is intentionally Template-owned.

The dedicated area is:

```text
src/template/state/agent-workbench/
```

This ownership is deliberate and is not transitional.

The architecture is:

```text
Template-owned reducers
        +
optional Application-owned reducers
        |
        v
runtime Redux store
```

Template must not import concrete Application reducers directly.

Application reducers are supplied through the Application integration layer.

---

# 22. Application-Specific Redux State

Concrete Applications may provide their own Redux reducers when required.

The Application extension point is:

```text
src/application/state/applicationReducers.ts
```

The current Agent.Workbench Application composition does not require meaningful Application-specific Redux state.

Therefore this registry is currently essentially empty.

This is expected and valid.

It exists as an extension point for future concrete Applications.

The absence of Application reducers does not mean Redux separation is incomplete.

---

# 23. Agent.Workbench Redux State

Agent.Workbench state belongs to Template.

Documentation must not describe Agent.Workbench reducers as candidates for extraction into a concrete Application.

The current ownership rule is:

```text
reusable Agent.Workbench state
    --> Template

concrete product-only state
    --> Application
```

Moving Agent.Workbench state out of Template would contradict the currently selected architecture unless that architecture is explicitly changed in the future.

---

# 24. Redux Boundary Protection

Application-specific reducers must not silently replace Template-owned reducers.

The Template/Application state integration must preserve reducer ownership boundaries.

Conceptually:

```text
Template reducers
        +
Application reducers
        |
        v
validated reducer composition
```

Reducer keys owned by Template remain Template-owned.

Concrete Applications extend the store instead of overriding the Base Template state contract.

---

# 25. Current Design System

Reusable UI infrastructure belongs to Template.

The shared design system exists under:

```text
src/template/components/design-system/
```

Known groups include:

```text
icons/
stylistic/
themed/
ui-elements/
```

The design system is reusable application-platform UI and therefore belongs to Template rather than Core.

Core remains focused on reusable technical capabilities.

---

# 26. Current Component Structure

Reusable Template components include areas such as:

```text
src/template/components/design-system/
src/template/components/developer-tools/
src/template/components/dynamic-content/
src/template/components/layout/
src/template/components/localization/
src/template/components/notifications/
src/template/components/rich-text-editor/
```

Reusable React components belong to Template unless they are specific to one concrete Application.

Concrete Application-only components should remain Application-owned.

---

# 27. Developer Console

The reusable Developer Console belongs to Template.

The current implementation includes a visible close action in:

```text
src/template/components/developer-tools/developer-console/DeveloperConsole.tsx
```

The close action uses the Unicode multiplication sign through an explicit Unicode escape:

```tsx
{"\u00D7"}
```

This avoids source-encoding corruption such as:

```text
Ã—
```

The close behavior itself remains driven by the existing Developer Console state logic.

---

# 28. Authentication Separation

Authentication follows the general dependency model.

```text
Core
├── technical authentication capabilities
├── JWT helpers
├── interceptor logic
└── logout guards

Template
├── authentication UI
├── session orchestration
└── reusable login behavior

Application
└── product composition
```

This separation is consistent with:

```text
Application --> Template --> Core
```

---

# 29. Server Separation

Server functionality is split by responsibility.

```text
Core
├── technical server capability
├── normalization
├── validation
├── backend parsing
└── environment detection

Template
├── server selection
├── server-related reusable state
├── orchestration
└── presentation

Application
└── product-specific server configuration where required
```

This allows technical server behavior to remain reusable without placing application UI into Core.

---

# 30. Update Separation

Update functionality is also split by responsibility.

```text
Core
└── reusable technical update capabilities

Template
├── update state
├── hooks
├── watchers
├── notifications
├── dialogs
└── reusable orchestration

Application
└── product-specific update behavior only when necessary
```

Reusable update presentation and orchestration remain Template responsibilities.

---

# 31. File Configuration Functionality

Reusable file-configuration functionality currently belongs to the Template platform where it is shared application behavior.

Relevant Template areas include:

```text
src/template/screens/settings/
src/template/hooks/
src/template/state/settings/
src/template/components/design-system/
```

Concrete product-specific file behavior should only move into Application when it is genuinely specific to that product.

The architecture must not move functionality solely to make directory ownership appear more separated.

Ownership is based on responsibility and reuse.

---

# 32. Configuration Generation Lifecycle

Application configuration generation is part of the normal development lifecycle.

The explicit generation command is:

```text
npm run config:generate
```

Normal validation should ensure generated Application artifacts match the developer-facing `.properties` configuration.

Configuration generation also includes automatic Application screen discovery.

Generated files are implementation artifacts and should not replace the `.properties` files as the developer-facing configuration interface.

---

# 33. Build and Consumer Responsibility

`web.template` provides the reusable Base Template and the in-repository Agent.Workbench Application composition used to validate the integration model.

A future concrete consumer repository such as HEMS is expected to own its product-specific concerns, including where applicable:

* product configuration
* product screens
* product translations
* product navigation extensions
* product-specific state
* product build and deployment configuration

The Base Template should remain reusable across concrete products.

This does not imply that Agent.Workbench must be extracted.

Agent.Workbench standard functionality remains Base Template functionality.

---

# 34. Future HEMS Consumer

HEMS represents a concrete Application.

The expected conceptual structure is:

```text
HEMS Application
        |
        v
Base Template
        |
        v
Core
```

HEMS may provide:

```text
HEMS .properties configuration
HEMS-specific screens
HEMS translations
HEMS navigation extensions
optional HEMS-specific Redux state
HEMS product composition
```

The Base Template continues to provide reusable platform and Agent.Workbench functionality.

A separate HEMS/consumer integration test can validate this contract independently from the architecture definition itself.

---

# 35. Repository Model

The current architectural repository model is:

```text
web.template
|
+-- Core
|
+-- Base Template
|   |
|   +-- Agent.Workbench standard functionality
|   +-- reusable navigation
|   +-- reusable state infrastructure
|   +-- authentication/session
|   +-- server selection
|   +-- settings
|   +-- update
|   +-- design system
|   +-- notifications
|   +-- Template screen registry
|
+-- Agent.Workbench Application composition
```

Future concrete product repositories consume the Base Template.

Conceptually:

```text
             Base Template
                  ^
                  |
          +-------+-------+
          |               |
        HEMS        future Applications
```

There is no required separate Agent.Workbench Application repository.

---

# 36. Current Logical Architecture

The current logical architecture is:

```text
+--------------------------------------------------+
| Concrete Application / Application composition example       |
|                                                  |
| application.properties                           |
| features.properties                              |
| navigation.properties                            |
| Application screens                              |
| Application translations                         |
| optional Application state                       |
| generated Application configuration              |
| generated Application screen registry            |
+-------------------------+------------------------+
                          |
                          v
+--------------------------------------------------+
| Base Template                                    |
|                                                  |
| TemplateApp                                      |
| createTemplateApp                                |
| ApplicationConfig contract                       |
| React application shell                          |
| navigation infrastructure                        |
| Template menu catalog                            |
| Template screen registry                         |
| feature definitions                              |
| authentication/session orchestration             |
| server selection                                 |
| settings                                         |
| notifications                                    |
| update orchestration                             |
| Redux infrastructure                             |
| Agent.Workbench standard functionality           |
| Agent.Workbench state                            |
| design system                                    |
| reusable components/screens/hooks                |
+-------------------------+------------------------+
                          |
                          v
+--------------------------------------------------+
| Core                                             |
|                                                  |
| authentication                                   |
| runtime                                          |
| server                                           |
| update                                           |
| reusable technical capabilities                  |
+--------------------------------------------------+
```

This diagram represents the implemented architectural responsibility model.

---

# 37. Architecture Invariants

The following rules must remain true:

```text
Application --> Template --> Core
```

Core must not import Template.

Core must not import Application.

Template must not import a concrete Application.

Applications should consume supported public integration surfaces rather than reaching into Template internals.

Template owns standard Agent.Workbench functionality.

Applications own concrete product composition.

Developer-facing Application configuration uses `.properties`.

Applications must not reproduce Template internal navigation IDs or visibility rules.

Application screens are automatically discovered.

Application-specific Redux state remains optional.

---

# 38. Dependency Validation

Useful architecture checks include:

```text
git grep -n "@/application/" -- src/template
```

Template must not import concrete Application implementation.

Internal Template imports from Application should therefore remain absent.

Application code should consume supported public integration APIs instead of Template internal paths.

A useful check is:

```text
git grep -n "@/template/" -- src/application
```

Unexpected direct Template-internal imports should be reviewed and replaced by supported public APIs where appropriate.

---

# 39. Current Validation Expectations

Before architecture documentation or implementation changes are committed, the current validation sequence should include:

```text
npm run config:generate
npx tsc --noEmit
npm test -- --runInBand
git diff --check
git status --short
```

Architecture dependency checks should also be performed where relevant.

Changes should remain small and reviewable.

Large automated rewrites across unrelated files should be avoided.

---

# 40. Current Stability Status

The current refactoring and known presentation bugfixes have been completed before this documentation update.

The latest known validation state includes a successful:

```text
npx tsc --noEmit
```

Known resolved presentation issues include:

```text
Drawer/MenuHub ordering consistency
Developer Console close-button encoding
```

The current priority is documentation consistency before starting additional feature work.

---

# 41. Documentation Rules

Architecture documentation must describe the current selected architecture consistently.

The following statements are incorrect and must not be reintroduced:

```text
"Agent.Workbench is a concrete Application."

"Agent.Workbench is only temporarily located in Template."

"Agent.Workbench state must later be extracted from Template."

"Agent.Workbench screens are Application candidates."

"A separate Agent.Workbench Application repository is required."

"The repository is still migrating toward making Agent.Workbench an Application."

"menu.properties is the current menu configuration."

"tabs.properties is the current tab configuration."

"featureFlags.properties is the current feature configuration."
```

The correct model is:

```text
Agent.Workbench standard functionality
    --> Base Template

HEMS
    --> concrete Application
```

The current Application configuration files are:

```text
application.properties
features.properties
navigation.properties
```

---

# 42. Current Architecture Summary

The current architecture is established as:

```text
Application --> Template --> Core
```

Core owns reusable technical capabilities.

Template owns the reusable application platform.

Agent.Workbench standard functionality is intentionally part of Template.

Application owns concrete product composition.

The current Agent.Workbench Application composition currently validates the integration contract inside the repository.

Developer-facing Application configuration is properties-based.

Template owns internal feature and navigation implementation details.

Applications select reusable Template capabilities semantically.

Application screens are discovered automatically.

Template owns reusable Redux infrastructure and Agent.Workbench state.

Application-specific Redux state is optional.

HEMS is a future concrete consumer Application.

There is no planned separate Agent.Workbench Application repository under the current architecture.

The next architectural work should build on these ownership boundaries rather than reopening the already decided Base Template versus Agent.Workbench separation.
