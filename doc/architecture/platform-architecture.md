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

HEMS is an example of a concrete Application.

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
| Application-specific screens                     |
| Application translations                         |
| optional Application-specific Redux state        |
| product-specific behavior                        |
| product-specific branding                        |
| product build/deployment                         |
+------------------------+-------------------------+
                         |
                         v
+--------------------------------------------------+
| Template                                         |
|                                                  |
| reusable application shell                       |
| TemplateApp / createTemplateApp                  |
| ApplicationConfig contract                       |
| navigation infrastructure                        |
| Template navigation definitions                  |
| Template screen registry                         |
| Redux infrastructure                             |
| Agent.Workbench standard functionality           |
| Agent.Workbench state                            |
| authentication/session orchestration             |
| server selection                                 |
| settings                                         |
| design system                                    |
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
Template    --> Core
```

Forbidden:

```text
Core        --> Template
Core        --> Application
Template    --> concrete Application
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

HEMS-specific domain state
    -> HEMS Application
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
navigation infrastructure
Template navigation definitions
Template screen registry
Redux infrastructure
authentication/session orchestration
server selection
settings
design system
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
Application-specific screens
Application translations
optional Application-specific Redux state
product business logic
product-specific API integration
product assets
product branding
product build configuration
product release configuration
product deployment configuration
```

Application may consume supported Template and Core integration surfaces.

Application must not require Template to import concrete product implementation.

---

# 8. HEMS

HEMS is a concrete Application.

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

HEMS can provide:

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

The Base Template must not contain HEMS-specific product implementation.

---

# 9. Current Repository Model

The current repository contains:

```text
src/
├── application/
├── template/
└── core/
```

The responsibilities are:

```text
src/application/
    Agent.Workbench Application composition

src/template/
    reusable Base Template platform
    including Agent.Workbench standard functionality

src/core/
    reusable technical capabilities
```

The current Agent.Workbench Application composition validates the Application integration contract.

It is not Agent.Workbench.

---

# 10. Consumer Repository Model

Future concrete Applications may consume the Base Template from separate repositories.

Conceptually:

```text
                 Base Template
                      ^
                      |
              +-------+-------+
              |               |
            HEMS        future Applications
```

Agent.Workbench is not represented as a separate consumer because its standard functionality is already part of the Base Template.

A concrete consumer repository may own:

```text
Application configuration
Application screens
Application translations
Application-specific navigation
optional Application state
product business logic
product branding
product build/deployment
```

---

# 11. No Runtime Multi-Application Resolver

Template does not select between concrete products at runtime.

The following model is intentionally avoided:

```text
Template
|
+-- if HEMS ...
+-- if Product A ...
+-- if Product B ...
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

Agent.Workbench does not participate in product resolution because it is already part of the Base Template.

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

features.properties
    semantic activation or deactivation
    of reusable Template features

navigation.properties
    Application-specific navigation extensions
```

Developers should not need to edit TypeScript, TSX, JavaScript or JSON configuration files for normal Application configuration.

Generated TypeScript may exist as build/runtime output.

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

# 15. Configuration Generation

Developer-facing `.properties` files are transformed into runtime artifacts.

Conceptually:

```text
Application .properties
        |
        v
configuration generator
        |
        v
generated runtime configuration
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

A central generator is:

```text
generateApplicationConfig.mjs
```

Generated Application artifacts exist under:

```text
src/application/generated/
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
```

Application owns:

```text
Application-specific navigation extensions
Application-specific screen references
optional custom ordering
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

---

# 18. Application Navigation

Application-specific navigation is configured through:

```text
navigation.properties
```

Example:

```properties
menu.example.enabled=true
menu.example.caption=exampleApplication
menu.example.parent=settings
menu.example.position=99
menu.example.screen=example-screen
```

Application custom IDs are generated or resolved internally.

Applications do not manually maintain Template internal numeric IDs.

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

# 20. Automatic Application Screen Discovery

Application screens are discovered automatically.

Implementation:

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

Generated registry:

```text
src/application/generated/applicationScreenRegistry.generated.ts
```

Template must not manually import concrete Application screens.

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

# 28. Design System

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

# 31. Build and Deployment

Concrete consumer Applications should own product-specific build and deployment concerns.

These may include:

```text
Application identity
product release artifacts
release destinations
product release workflow
deployment configuration
Helm configuration
```

The Base Template may provide reusable tooling.

It should not permanently own concrete consumer deployment configuration.

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
createTemplateApp
documented configuration
automatic screen discovery
documented navigation extensions
documented Redux extension points
supported Template exports
```

Avoid arbitrary deep imports into Template implementation details.

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

The current repository already contains:

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

automatic Application screen discovery
    -> implemented

Agent.Workbench state in Template
    -> intentional

optional Application Redux extension
    -> available

HEMS consumer integration
    -> future validation work
```

The presence of Agent.Workbench functionality in Template is not incomplete extraction.

---

# 35. Current Logical Architecture

The current logical model is:

```text
+--------------------------------------------------+
| Concrete Application / Application composition example       |
|                                                  |
| application.properties                           |
| features.properties                              |
| navigation.properties                            |
| Application-specific screens                     |
| Application translations                         |
| optional Application-specific Redux state        |
+-------------------------+------------------------+
                          |
                          v
+--------------------------------------------------+
| Base Template                                    |
|                                                  |
| TemplateApp                                      |
| createTemplateApp                                |
| ApplicationConfig                                |
| navigation infrastructure                        |
| Template navigation                              |
| Template screen registry                         |
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

# 36. Future Consumer Architecture

A future physical consumer model may look like:

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
              |                                     |
+-----------------------------+       +-----------------------------+
| HEMS Repository             |       | Future Application Repo     |
|                             |       |                             |
| Application                 |       | Application                 |
| configuration               |       | configuration               |
| screens                     |       | screens                     |
| state                       |       | state                       |
| branding                    |       | branding                    |
| business logic              |       | business logic              |
| build/deployment            |       | build/deployment            |
+-----------------------------+       +-----------------------------+
```

There is no separate Agent.Workbench consumer repository in this model.

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

move code only to make directory boundaries look cleaner
```

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
```

The correct model is:

```text
Agent.Workbench standard functionality
    -> Base Template

HEMS
    -> concrete Application
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
7. HEMS owns HEMS-specific functionality.
8. Concrete Applications configure Template through supported contracts.
9. Applications select reusable Template features semantically.
10. Applications can provide product-specific navigation extensions.
11. Applications can provide their own screens without Template imports.
12. Application screens are discovered automatically.
13. Optional Application Redux state can be integrated without reversing dependencies.
14. Application developers use simple `.properties` configuration.
15. Concrete Applications can own their own build and deployment.
16. The Base Template can support future consumer Applications without changing its fundamental ownership model.

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

The current `src/application/` directory is the in-repository Agent.Workbench Application composition.

HEMS is a concrete consumer Application.

Developer-facing Application configuration uses:

```text
application.properties
features.properties
navigation.properties
```

Applications select reusable Template capabilities semantically.

Template owns reusable navigation internals, Template screen registration, Agent.Workbench navigation and standard Agent.Workbench state.

Application-specific navigation extends Template navigation.

Application-specific Redux state is optional.

A separate Agent.Workbench Application repository is not part of the current architecture.

Future consumer validation should focus on HEMS or another real concrete Application rather than extracting Agent.Workbench from the Base Template.
