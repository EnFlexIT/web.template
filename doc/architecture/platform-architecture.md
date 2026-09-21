# Platform Architecture

## Purpose

This document provides the high-level architecture overview for the reusable EnFlexIT web platform.

The implemented architecture is:

```text

Application --> Template --> Core

```

The platform separates:

* reusable technical capabilities

* reusable application-platform functionality

* concrete product composition

Standard Agent.Workbench functionality is intentionally part of the Base Template.

Plant Assist is the first separate concrete consumer currently used to validate the Base Template integration contract.

HEMS remains an example of a future concrete Application that can follow the same consumer model.

The architecture described here is the current selected architecture and must not be documented as an unfinished migration toward a separate Agent.Workbench Application.

---

# 1. Architecture Overview

The platform consists of three responsibility layers:

```text
+--------------------------------------------------+
| Application                                      |
|                                                  |
| Application identity and metadata                |
| Template feature selection                       |
| Application navigation extensions                |
| optional navigation presentation                 |
| Application-specific screens                     |
| Application translations                         |
| Application assets and branding                  |
| Application theme overrides                      |
| optional Application-specific Redux state        |
| product-specific behavior                        |
| product-specific API integration                 |
| product version / build / release                 |
| product deployment                               |
+------------------------+-------------------------+
                         |
                         v
+--------------------------------------------------+
| Template                                         |
|                                                  |
| reusable application shell                       |
| TemplateApp / createTemplateApp                   |
| ApplicationConfig contract                       |
| configuration / discovery generation             |
| navigation infrastructure                        |
| optional navigation icon rendering               |
| Template navigation definitions                  |
| Template screen registry                         |
| Redux infrastructure                             |
| Agent.Workbench standard functionality           |
| Agent.Workbench state                            |
| authentication/session orchestration             |
| server selection                                 |
| settings                                         |
| design system                                    |
| theme infrastructure                             |
| notifications                                    |
| update orchestration                             |
| reusable screens/components/hooks                |
+------------------------+-------------------------+
                         |
                         v
+--------------------------------------------------+
| Core                                             |
|                                                  |
| reusable technical capabilities                  |
| technical authentication helpers                 |
| runtime helpers                                  |
| server infrastructure                            |
| technical update helpers                         |
| technical types and utilities                    |
+--------------------------------------------------+
```

Each layer has a distinct responsibility.

The separate `web.plantAssist` repository currently validates that a concrete Application can consume this architecture independently from `web.template`.

---

# 2. Dependency Direction

The fundamental dependency rule is:

```text

Application --> Template --> Core

```

Allowed:

```text

Application --> Template

Application --> Core

Template    --> Core

```

Forbidden:

```text

Core        --> Template

Core        --> Application

Template    --> concrete Application

```

Dependencies must remain acyclic.

---

# 3. Ownership Principle

Code ownership is determined by responsibility.

Reusability alone does not determine whether code belongs to Core or Template.

The central question is:

```text
Who owns this responsibility?
```

Examples:

```text
server normalization
    -> Core

server-selection UI
    -> Template

product-specific server configuration
    -> Application
```

Another example:

```text
technical authentication helper
    -> Core

session orchestration
    -> Template

product-specific authentication behavior
    -> Application
```

Another example:

```text
Agent.Workbench Data Analyzing state
    -> Template

Plant Assist dashboard/domain state
    -> Plant Assist Application

HEMS-specific domain state
    -> HEMS Application
```

Another example:

```text
reusable theme infrastructure
    -> Template

Plant Assist theme override values
    -> Plant Assist Application
```

Physical location alone must not determine architectural ownership.

---

# 4. Core

Core contains focused reusable technical capabilities.

Current high-level areas include:

```text

src/core/

├── authentication/

├── runtime/

├── server/

└── update/

```

Typical Core responsibilities include:

```text

technical authentication helpers

technical authentication types

server normalization

server validation

technical server checks

server-environment detection

runtime utilities

technical update helpers

framework-independent technical behavior

```

Core must not depend on:

```text

Template

Application

```

React application-shell functionality and Redux application orchestration generally do not belong in Core.

---

# 5. Template

Template contains the reusable application platform.

It includes reusable behavior that depends on React, Redux, navigation, presentation or application orchestration.

Typical responsibilities include:

```text
TemplateApp
createTemplateApp
ApplicationConfig
ApplicationConfigContext
React application shell
configuration / discovery generation
navigation infrastructure
Template navigation definitions
optional navigation icon rendering
Template screen registry
Redux infrastructure
authentication/session orchestration
server selection
settings
design system
theme infrastructure
notifications
update orchestration
reusable screens
reusable components
reusable hooks
localization infrastructure
Agent.Workbench standard functionality
Agent.Workbench state
```

Template may depend on Core.

Template must remain independent from concrete Applications.

Template provides the supported integration surfaces through which Applications can contribute configuration, screens, assets, branding, theme overrides, translations, optional state and navigation extensions.

---

# 6. Agent.Workbench

Agent.Workbench standard functionality belongs to Template.

The ownership decision is:

```text

Agent.Workbench standard functionality

    -> Base Template

```

This includes reusable standard functionality such as:

```text

Program Start

Data Analyzing

Database configuration

Server configuration

Live Console

Settings

Agent.Workbench navigation

Agent.Workbench state

Agent.Workbench API integration where reusable

```

Agent.Workbench is the current in-repository Application identity/composition, but it is not modeled as a separate consumer Application repository

Therefore the architecture does not require:

```text

a separate Agent.Workbench Application

a separate Agent.Workbench Application repository

Agent.Workbench screen extraction from Template

Agent.Workbench state extraction from Template

Agent.Workbench navigation extraction into Application

```

These areas are not transitional solely because they contain Agent.Workbench functionality.

---

# 7. Application

Application represents concrete product composition.

Typical Application responsibilities include:

```text
Application identity
Application metadata
Template feature selection
Application-specific navigation
Application navigation presentation options
Application-specific screens
Application translations
Application assets
Application branding
Application theme overrides
optional Application-specific Redux state
product business logic
product-specific API integration
product version
product build configuration
product release configuration
product deployment configuration
```

Application may consume supported Template and Core integration surfaces.

Application must not require Template to import concrete product implementation.

A concrete Application should use supported `.properties` configuration and Application-owned files rather than modifying generated runtime artifacts or reusable Template source files.

---

# 8. Concrete Consumer Applications

Plant Assist is the first separate concrete Application currently used to validate the consumer model.

Conceptually:

```text
Plant Assist Application
        |
        v
Base Template
        |
        v
Core
```

Plant Assist currently demonstrates:

```text
Application configuration
Application feature selection
Application navigation extensions
optional navigation icons
Application screens
Application translations
Application assets and branding
Application theme overrides
independent Application versioning
independent build and release
deployment configuration
```

Plant Assist is currently an MVP used to validate architecture and integration. It is not intended to represent final product functionality or final UI design.

HEMS remains a future concrete Application and may follow the same model:

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
HEMS configuration
HEMS feature selection
HEMS navigation extensions
HEMS screens
HEMS translations
optional HEMS Redux state
HEMS business behavior
HEMS branding
HEMS build/deployment
```

The Base Template must not contain Plant Assist- or HEMS-specific product implementation.

---

# 9. Current Repository Model

The `web.template` repository contains:

```text
src/
├── application/
├── template/
└── core/
```

The responsibilities are:

```text
src/application/
    in-repository Agent.Workbench Application composition

src/template/
    reusable Base Template platform
    including Agent.Workbench standard functionality

src/core/
    reusable technical capabilities
```

The current Agent.Workbench Application composition validates the Application integration contract from inside `web.template`.

It is not Agent.Workbench itself.

The architecture is additionally validated by the separate consumer repository:

```text
web.plantAssist
```

`web.plantAssist` owns its concrete Application configuration, branding, screens, translations, theme overrides, version, build, release and deployment concerns while consuming the Base Template architecture.

---

# 10. Consumer Repository Model

Concrete Applications may consume the Base Template from separate repositories.

The current model is:

```text
                     Base Template
                          ^
                          |
             +------------+------------+
             |            |            |
        Plant Assist     HEMS      future Applications
          current       future
          consumer      consumer
```

Agent.Workbench is not represented as a separate consumer because its standard functionality is already part of the Base Template.

A concrete consumer repository may own:

```text
Application configuration
Application screens
Application translations
Application-specific navigation
navigation presentation options
Application assets
Application branding
Application theme overrides
optional Application state
product business logic
product version
product build
product release workflow
deployment configuration
```

Plant Assist is the first current proof that this repository model works outside `web.template`.

---

# 11. No Runtime Multi-Application Resolver

Template does not select between concrete products at runtime.

The following model is intentionally avoided:

```text
Template
|
+-- if Plant Assist ...
+-- if HEMS ...
+-- if Product A ...
+-- select concrete Application
```

Instead, each concrete Application composes itself with Template.

Conceptually:

```text
Application configuration
        |
        v
createTemplateApp(...)
        |
        v
TemplateApp
```

Plant Assist uses this consumer model.

HEMS and future Applications may follow the same pattern.

Agent.Workbench does not participate in product resolution because its standard functionality is already part of the Base Template.

---

# 12. Application Contract

Template defines explicit Application integration contracts.

The central integration area is:

```text

src/template/application/

├── ApplicationConfig.ts

├── ApplicationConfigContext.tsx

├── createTemplateApp.tsx

└── TemplateApp.tsx

```

Conceptually:

```text

Concrete Application

        |

        v

ApplicationConfig

        |

        v

createTemplateApp(...)

        |

        v

TemplateApp

```

The Application provides concrete composition.

Template provides the reusable application platform.

---

# 13. Developer-Facing Configuration

Developer-facing Application configuration must remain simple.

The current configuration is:

```text
src/application/config/
├── application.properties
├── features.properties
└── navigation.properties
```

Responsibilities:

```text
application.properties
    Application identity and metadata
    Application branding
    Application theme overrides

features.properties
    semantic activation or deactivation
    of reusable Template features

navigation.properties
    Application-specific navigation extensions
    Application navigation presentation options
```

Examples include:

```properties
ApplicationId=plant-assist
ApplicationTitle=Plant Assist
ApplicationLogo=flexaqua

ThemeLightPrimary=#009FB2
ThemeLightBackground=#F4FBFC

ThemeDarkPrimary=#35C4D2
ThemeDarkBackground=#0E1C22
```

and:

```properties
NavigationMenuIconsEnabled=true

menu.plantAssist.enabled=true
menu.plantAssist.caption=plantAssist
menu.plantAssist.parent=settings
menu.plantAssist.position=99
menu.plantAssist.screen=plant-assist-screen
menu.plantAssist.icon=appstore
```

Developers should not need to edit TypeScript, TSX, JavaScript or JSON configuration files for normal Application configuration.

Generated TypeScript may exist as build/runtime output but is not the normal developer-facing configuration surface.

---

# 14. Legacy Configuration Names

The following older configuration names are not part of the current architecture:

```text

menu.properties

tabs.properties

featureFlags.properties

menuFeatureFlags.properties

tabFeatureFlags.properties

```

They must not be described as active or planned configuration.

The active model is:

```text

application.properties

features.properties

navigation.properties

```

---

# 15. Configuration and Discovery Generation

Developer-facing `.properties` files and Application-owned resources are transformed into runtime artifacts.

Conceptually:

```text
Application .properties
Application screens
Application assets
        |
        v
configuration / discovery generation
        |
        +--> applicationConfig.generated.ts
        |
        +--> applicationScreenRegistry.generated.ts
        |
        +--> applicationAssets.generated.ts
        |
        +--> applicationTheme.generated.ts
        |
        v
Application composition
        |
        v
Template
```

Configuration tooling exists under:

```text
src/template/config/build/
```

Relevant tooling includes:

```text
generateApplicationConfig.mjs
applicationScreenDiscovery.mjs
applicationAssetDiscovery.mjs
```

Generated Application artifacts exist under:

```text
src/application/generated/
```

Current generated artifacts include:

```text
applicationConfig.generated.ts
applicationScreenRegistry.generated.ts
applicationAssets.generated.ts
applicationTheme.generated.ts
```

The explicit generation command is:

```text
npm run config:generate
```

Generated files are implementation artifacts and should not become the normal developer configuration surface.

---

# 16. Semantic Feature Selection

Applications select reusable Template functionality semantically through:

```text

features.properties

```

Examples:

```properties

feature.notifications.enabled=true

feature.appearance.enabled=true

feature.serverSettings.enabled=true

feature.liveConsole.enabled=true

feature.programStart.enabled=true

feature.dataAnalyzing.enabled=true

feature.database.general.enabled=true

```

Application selects capabilities.

Template owns implementation.

Applications therefore do not need to configure Template internals such as:

```text

numeric menu IDs

internal parent IDs

Template screen registry keys

authentication visibility

runtime visibility

Agent.Workbench navigation definitions

```

---

# 17. Navigation Ownership

Navigation is separated by responsibility.

Template owns:

```text
routing infrastructure
menu rendering
menu tree construction
path calculation
Template navigation definitions
Template screen registry
visibility integration
Agent.Workbench navigation
Template menu ordering
optional icon rendering
```

Application owns:

```text
Application-specific navigation extensions
Application-specific screen references
optional custom ordering
optional navigation icon selection
whether optional navigation icons are enabled
```

Conceptually:

```text
Template navigation
        +
Application navigation extensions
        |
        v
runtime navigation
```

Applications do not provide the complete Base Template navigation definition.

Optional Application-controlled presentation does not transfer navigation ownership away from Template.

---

# 18. Application Navigation

Application-specific navigation is configured through:

```text
navigation.properties
```

Example:

```properties
NavigationMenuIconsEnabled=true

menu.plantAssist.enabled=true
menu.plantAssist.caption=plantAssist
menu.plantAssist.parent=settings
menu.plantAssist.position=99
menu.plantAssist.screen=plant-assist-screen
menu.plantAssist.icon=appstore
```

Application custom IDs are generated or resolved internally.

Applications do not manually maintain Template internal numeric IDs.

Menu icons are optional.

When `NavigationMenuIconsEnabled` is omitted or `false`, the classic text-oriented navigation remains supported.

This allows the in-repository Agent.Workbench composition to retain the existing navigation appearance while a separate Application such as Plant Assist may enable icons explicitly.

---

# 19. Template Menu Ordering

Template menu ordering is derived automatically from sibling order in the Template menu catalog.

Normal Template menu entries therefore do not require explicit numeric positions.

Application custom `position` remains optional.

For missing positions, MenuHub uses:

```ts

Number.MAX_SAFE_INTEGER

```

Relevant implementation:

```text

src/template/screens/menu/MenuHubScreen.tsx

```

This keeps Drawer and MenuHub ordering consistent.

---

# 20. Automatic Application Screen and Asset Discovery

Application screens are discovered automatically.

Screen discovery implementation:

```text
src/template/config/build/applicationScreenDiscovery.mjs
```

Examples:

```text
ExampleScreen.tsx
    -> example-screen

ExampleScreen2.tsx
    -> example-screen2

PlantAssistScreen.tsx
    -> plant-assist-screen
```

Generated screen registry:

```text
src/application/generated/applicationScreenRegistry.generated.ts
```

Application assets are also discovered automatically.

Asset discovery implementation:

```text
src/template/config/build/applicationAssetDiscovery.mjs
```

Application assets are placed under:

```text
src/application/assets/
```

Generated asset registry:

```text
src/application/generated/applicationAssets.generated.ts
```

Application branding can reference discovered assets semantically, for example:

```properties
ApplicationLogo=flexaqua
```

Template must not manually import concrete Application screens or Application branding assets.

---

# 21. Redux

Redux is an implementation technology, not an architectural layer.

State ownership follows responsibility.

```text

Template

|

+-- reusable Template state

+-- Agent.Workbench state

+-- reusable Redux infrastructure

Application

|

+-- optional concrete product-specific state

```

Core must not depend on the application Redux store.

---

# 22. Agent.Workbench State

Agent.Workbench state is intentionally Template-owned.

Known area:

```text

src/template/state/agent-workbench/

```

The ownership rule is:

```text

Agent.Workbench standard state

    -> Template

```

This state must not be classified as transitional Application state.

It is not waiting for extraction into a separate Agent.Workbench repository.

---

# 23. Application Redux Extension

Concrete Applications may optionally provide their own reducers.

The current extension point is:

```text

src/application/state/applicationReducers.ts

```

The current Agent.Workbench Application composition does not require meaningful Application-specific Redux state.

That is valid.

Conceptually:

```text

Template reducers

        +

optional Application reducers

        |

        v

Redux store

```

Template must not import concrete Application reducer implementations.

---

# 24. Redux Infrastructure

Reusable Redux infrastructure belongs to Template.

Known store infrastructure includes:

```text

src/template/state/store/

├── createTemplateStore.ts

├── rootReducer.ts

├── store.ts

├── templateReducers.ts

├── types.ts

├── useAppDispatch.ts

└── useAppSelector.ts

```

Application reducers must not silently override Template-owned reducer keys.

Reducer ownership follows architectural responsibility.

---

# 25. Authentication

Authentication is split by responsibility.

```text

Core

|

+-- technical authentication helpers

+-- technical auth types

+-- token/time helpers

+-- technical logout protection

Template

|

+-- login experience

+-- session orchestration

+-- reusable authentication state

+-- logout orchestration

Application

|

+-- product-specific authentication behavior where required

```

Authentication is not one monolithic Core or Template feature.

---

# 26. Server Handling

Server functionality is split by responsibility.

```text

Core

|

+-- server normalization

+-- validation

+-- technical checks

+-- environment detection

Template

|

+-- server-selection state

+-- connectivity state

+-- server-selection UI

+-- orchestration

Application

|

+-- product-specific server configuration where required

```

---

# 27. Update System

Update functionality follows the same ownership model.

```text

Core

|

+-- technical update helpers

Template

|

+-- update state

+-- hooks

+-- watchers

+-- notifications

+-- dialogs

+-- reusable orchestration

Application

|

+-- product-specific update behavior where genuinely required

```

Reusable update UI and orchestration remain outside Core.

---

# 28. Design System and Theme Overrides

Reusable React presentation belongs to Template.

The shared design system lives under:

```text
src/template/components/design-system/
```

Known areas include:

```text
icons
stylistic
themed
ui-elements
```

Reusable theme infrastructure also belongs to Template.

Concrete Application theme values remain Application-owned.

Supported Application theme overrides are configured through `application.properties`.

Examples:

```properties
ThemeLightPrimary=#009FB2
ThemeLightBackground=#F4FBFC
ThemeLightCard=#FFFFFF
ThemeLightText=#12313D

ThemeDarkPrimary=#35C4D2
ThemeDarkBackground=#0E1C22
ThemeDarkCard=#132A31
ThemeDarkText=#E8F7F9
```

Theme overrides are generated into:

```text
src/application/generated/applicationTheme.generated.ts
```

When a concrete Application does not provide an override, the Base Template default remains active.

Product-specific visual behavior belongs to Application.

Core does not own React presentation components merely because they are reusable.

---

# 29. Optional Features

Optionality does not determine ownership.

A feature may be optional while still belonging to Template or Application.

For example:

```text

Live Console

    -> Template feature

HEMS-specific diagnostics

    -> HEMS Application feature

technical diagnostic helper

    -> Core where appropriate

```

Applications may enable or disable reusable Template features without owning their implementation.

---

# 30. API Ownership

API ownership follows responsibility.

```text

generic technical communication

    -> Core where appropriate

reusable Base Template / Agent.Workbench API integration

    -> Template where appropriate

concrete product business API

    -> Application

```

Agent.Workbench-named API code is not automatically Application-owned.

Its actual responsibility must be inspected.

---

# 31. Build, Version, Release and Deployment

Concrete consumer Applications own product-specific build, version, release and deployment concerns.

These may include:

```text
Application identity
Application version
product release artifacts
release destinations
product release workflow
deployment configuration
Helm configuration
```

Plant Assist currently validates this ownership through its separate consumer repository and independent release process.

The Base Template may provide reusable tooling.

It should not permanently own concrete consumer deployment configuration.

Application versioning and Template versioning are separate concerns.

A product release represents the concrete Application as a unit. The Template version used by the Application is supporting build information rather than a separate end-user update channel by default.

Planned follow-up work includes explicit BuildInfo, Application information UI and release-note metadata. These are not yet part of the implemented platform contract.

---

# 32. Public APIs

Architecture boundaries should be exposed through supported integration surfaces.

Conceptually:

```text
Application
        |
        v
Template public API
        |
        v
Core public API
```

Applications should prefer:

```text
ApplicationConfig
ApplicationConfigContext
createTemplateApp
documented .properties configuration
automatic screen discovery
automatic asset discovery
documented navigation extensions
optional navigation presentation
documented Redux extension points
supported Template exports
```

Avoid arbitrary deep imports into Template implementation details.

Concrete product branding and theme customization should use supported Application configuration rather than editing Template source files.

---

# 33. Configuration Does Not Define Ownership

Configuration can enable or disable behavior.

It does not determine architectural ownership.

Example:

```text

feature.liveConsole.enabled=false

```

does not make Live Console Application-owned.

Likewise, a feature used by multiple products does not automatically belong to Core.

Ownership is determined by responsibility.

---

# 34. Current Physical Architecture

The current `web.template` repository already contains:

```text
src/application/
src/template/
src/core/
```

This is the implemented responsibility model.

Current status includes:

```text
Application contract
    -> implemented

Template/Core boundaries
    -> implemented architectural model

properties-based configuration
    -> implemented

semantic feature selection
    -> implemented

Application navigation extensions
    -> implemented

optional Application navigation icons
    -> implemented

automatic Application screen discovery
    -> implemented

automatic Application asset discovery
    -> implemented

Application branding
    -> implemented

Application theme overrides
    -> implemented

Agent.Workbench state in Template
    -> intentional

optional Application Redux extension
    -> available

separate Plant Assist consumer
    -> implemented validation

Plant Assist independent build/release
    -> implemented validation

HEMS consumer integration
    -> future
```

The presence of Agent.Workbench functionality in Template is not incomplete extraction.

The Plant Assist consumer proves that a separate product can use the Base Template without reopening the Agent.Workbench ownership decision.

---

# 35. Current Logical Architecture

The current logical model is:

```text
+--------------------------------------------------+
| Concrete Application / Application composition   |
|                                                  |
| application.properties                           |
| features.properties                              |
| navigation.properties                            |
| Application assets                               |
| Application branding                             |
| Application theme overrides                      |
| Application-specific screens                     |
| Application translations                         |
| optional Application-specific Redux state        |
| product version / build / release                 |
+-------------------------+------------------------+
                          |
                          v
+--------------------------------------------------+
| Base Template                                    |
|                                                  |
| TemplateApp                                      |
| createTemplateApp                                |
| ApplicationConfig                                |
| ApplicationConfigContext                         |
| configuration / discovery generation             |
| navigation infrastructure                        |
| optional navigation icon rendering               |
| Template navigation                              |
| Template screen registry                         |
| reusable theme infrastructure                    |
| Agent.Workbench standard functionality           |
| Agent.Workbench state                            |
| Redux infrastructure                             |
| authentication/session                           |
| server selection                                 |
| settings                                         |
| notifications                                    |
| update orchestration                             |
| design system                                    |
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

---

# 36. Consumer Architecture

The current and future physical consumer model is:

```text
                    +--------------------------+
                    | web.template             |
                    | Base Template            |
                    |                          |
                    | Template                 |
                    |    |                     |
                    |    v                     |
                    | Core                     |
                    +------------+-------------+
                                 ^
                                 |
              +------------------+------------------+
              |                  |                  |
+-----------------------------+  |  +-----------------------------+
| web.plantAssist             |  |  | Future HEMS Repository      |
| current consumer            |  |  |                             |
|                             |  |  | Application                 |
| Application                 |  |  | configuration               |
| configuration               |  |  | screens                     |
| screens                     |  |  | translations                |
| translations                |  |  | assets/branding             |
| assets/branding             |  |  | state                       |
| theme overrides             |  |  | business logic              |
| optional state              |  |  | build/deployment            |
| business logic              |  |  +-----------------------------+
| version/build/release       |  |
| deployment                  |  |  +-----------------------------+
+-----------------------------+  |  | Future Application Repo     |
                                 |  |                             |
                                 +--| Application composition     |
                                    +-----------------------------+
```

There is no separate Agent.Workbench consumer repository in this model.

Plant Assist is the current external validation of the model.

HEMS and future concrete Applications may follow the same consumer architecture.

---

# 37. Development Strategy

Future architecture work should build on the selected ownership model.

Recommended sequence for changes:

```text
1. Verify responsibility.
2. Inspect actual dependencies.
3. Make the smallest coherent change.
4. Regenerate configuration when relevant.
5. Run TypeScript validation.
6. Run affected tests.
7. Run dependency checks.
8. Run git diff --check.
9. Review git status.
10. Validate runtime behavior where required.
```

Directory appearance is not more important than correct ownership and runtime stability.

Current planned follow-up topics include:

```text
BuildInfo
Application information screen
Application-versus-Template version presentation
release-note metadata
further automation of consumer Application creation
```

These topics should build on the existing consumer contract rather than reopening the decided Base Template versus Agent.Workbench separation.

---

# 38. Architecture Validation

Relevant validation commands include:

```text
npm run config:generate
npx tsc --noEmit
npm test -- --runInBand
git diff --check
git status --short
```

Dependency checks include:

```text
git grep -n "@/application/" -- src/template
git grep -n "@/template/" -- src/application
```

Template must not import concrete Application implementation.

Application imports should use supported Template integration surfaces.

Configuration-related changes should regenerate screen discovery, asset discovery and generated runtime configuration before TypeScript validation.

Generated artifacts should be reviewed to ensure they reflect only intended Application changes.

---

# 39. Non-Goals

The architecture does not aim to:

```text
put all reusable functionality into Core
turn Core into a React or Redux framework
make Template aware of concrete Applications
create a separate Agent.Workbench Application repository
extract standard Agent.Workbench state from Template
extract standard Agent.Workbench screens from Template
introduce a runtime product resolver
duplicate Template navigation inside Applications
expose Template internal navigation IDs to Applications
require developers to edit TypeScript configuration
require Applications to modify Template theme source files
require manual screen or asset registration in Template
move code only to make directory boundaries look cleaner
```

The architecture also does not treat the current Plant Assist MVP as final product behavior or final product design.

---

# 40. Architecture Documents

Detailed architecture information is split across focused documents:

```text

00-vision.md

    architectural direction

01-core-platform.md

    Core responsibility and boundaries

05-current-state.md

    current implementation state

application-contract.md

    Application/Template integration contract

platform-architecture.md

    high-level platform model

```

Supporting documentation under `doc/` describes individual systems and workflows.

Architecture documents must not contradict the current Agent.Workbench ownership decision.

---

# 41. Incorrect Legacy Statements

The following statements are no longer correct:

```text
"Agent.Workbench is a concrete Application."

"Agent.Workbench needs its own Application repository."

"The Base Template must be independent from Agent.Workbench."

"Agent.Workbench functionality inside Template is transitional."

"Agent.Workbench extraction is incomplete."

"Agent.Workbench screens must move into Application."

"Agent.Workbench state must move into Application."

"Agent.Workbench and HEMS are equivalent consumer repositories."

"Application owns the complete menu and tab definitions."

"menu.properties is the Application navigation model."

"tabs.properties is the Application tab model."

"featureFlags.properties is the Application feature model."

"The Redux architecture is incomplete because Agent.Workbench state remains in Template."

"HEMS is the first separate consumer validation."

"Application branding requires editing Template source files."

"Application theme customization requires editing Template theme defaults."
```

The correct model is:

```text
Agent.Workbench standard functionality
    -> Base Template

Plant Assist
    -> current separate concrete Application consumer

HEMS
    -> future concrete Application consumer
```

---

# 42. Success Criteria

The platform architecture is successful when:

1. Core contains focused reusable technical capabilities.
2. Core does not depend on Template or Application.
3. Template provides the reusable application platform.
4. Template does not import concrete Application implementation.
5. Agent.Workbench standard functionality remains Template-owned.
6. Agent.Workbench state remains Template-owned.
7. Plant Assist owns Plant Assist-specific functionality.
8. HEMS can own HEMS-specific functionality in a future consumer repository.
9. Concrete Applications configure Template through supported contracts.
10. Applications select reusable Template features semantically.
11. Applications can provide product-specific navigation extensions.
12. Applications can optionally enable navigation icons without taking ownership of Template navigation rendering.
13. Applications can provide their own screens without Template imports.
14. Application screens are discovered automatically.
15. Application assets are discovered automatically.
16. Applications can provide product branding without modifying Template source files.
17. Applications can provide supported theme overrides without modifying Template theme defaults.
18. Optional Application Redux state can be integrated without reversing dependencies.
19. Application developers use simple `.properties` configuration.
20. Concrete Applications can own their own version, build, release and deployment.
21. Plant Assist can validate the consumer model independently from `web.template`.
22. The Base Template can support future consumer Applications without changing its fundamental ownership model.

---

# 43. Summary

The platform architecture is:

```text
Application
    |
    v
Template
    |
    v
Core
```

Core provides focused reusable technical capabilities.

Template provides the reusable Base Template platform.

Standard Agent.Workbench functionality belongs to Template.

Application provides concrete product composition.

The current `src/application/` directory inside `web.template` is the in-repository Agent.Workbench Application composition.

Plant Assist is the first separate concrete consumer currently used to validate the Application contract.

HEMS remains a future concrete consumer Application.

Developer-facing Application configuration uses:

```text
application.properties
features.properties
navigation.properties
```

Applications select reusable Template capabilities semantically.

Template owns reusable navigation internals, Template screen registration, Agent.Workbench navigation and standard Agent.Workbench state.

Application-specific navigation extends Template navigation.

Navigation icons are optional and may be enabled by a concrete Application.

Application screens are discovered automatically.

Application assets are discovered automatically.

Applications may provide product branding and supported theme overrides without changing reusable Template source files.

Application-specific Redux state is optional.

Concrete consumers own their own product version, build, release and deployment configuration.

Plant Assist has already validated independent consumer build and release ownership.

A separate Agent.Workbench Application repository is not part of the current architecture.

BuildInfo, Application information UI, Application-versus-Template version presentation and release-note metadata are planned follow-up topics rather than currently implemented platform features.

Future consumer work should build on the proven Plant Assist model rather than extracting Agent.Workbench from the Base Template.
