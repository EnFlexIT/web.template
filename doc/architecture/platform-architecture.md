# Platform Architecture

## Purpose

This document provides the high-level architecture overview for the reusable
EnFlexIT web platform.

The architecture separates:

```text
Application
Template
Core
```

The dependency direction is:

```text
Application --> Template --> Core
```

The long-term repository model uses one reusable Base Template repository and
separate repositories for concrete Applications.

This document describes the overall model.

Detailed implementation and migration information is documented separately.

---

# 1. Architecture Overview

The platform consists of three responsibility layers:

```text
+--------------------------------------------------+
| Application                                      |
|                                                  |
| concrete product configuration                   |
| product navigation                               |
| product screens                                  |
| product Redux state                              |
| branding                                         |
| business logic                                   |
| product backend integration                      |
| build and deployment                             |
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
| Redux infrastructure                             |
| authentication/session orchestration             |
| server-selection behavior                        |
| design system                                    |
| notifications                                    |
| update orchestration                             |
| reusable screens and components                  |
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
| pure update helpers                              |
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

# 3. Responsibility Is More Important Than Reusability

Code does not belong in Core simply because it is reusable.

The ownership question is:

```text
Who owns this responsibility?
```

For example:

```text
server normalization        --> Core
server-selection UI         --> Template
product server settings     --> Application
```

Another example:

```text
technical auth helper       --> Core
session orchestration       --> Template
product auth configuration  --> Application
```

This prevents Core from becoming a generic shared-code directory.

---

# 4. Application

Application represents one concrete product.

Examples include:

```text
Agent.Workbench
HEMS
future EnFlexIT applications
```

Each Application owns its product-specific behavior.

Typical responsibilities are:

```text
Application identity
Application properties
menus
tabs
feature configuration
product-specific screens
product-specific Redux state
branding
business logic
product-specific API integration
product assets
product-specific translations
build configuration
release configuration
deployment configuration
Helm configuration where applicable
```

Application may reuse Template and Core.

---

# 5. Template

Template is the reusable application shell.

It contains reusable behavior that depends on React, Redux, navigation,
presentation or application orchestration.

Typical responsibilities include:

```text
TemplateApp
createTemplateApp
ApplicationConfig contract
ApplicationConfigContext
navigation engine
routing infrastructure
Redux infrastructure
authentication orchestration
session orchestration
server-selection behavior
design system
shared layout
notifications
update orchestration
common screens
reusable settings UI
localization UI
reusable React hooks
reusable feature components
```

Template may depend on Core.

Template must remain independent from concrete Applications.

---

# 6. Core

Core contains focused reusable technical capabilities.

Current high-level technical areas include:

```text
authentication
runtime
server
update
```

Typical Core responsibilities include:

```text
technical authentication helpers
authentication-related technical types
server normalization
server validation
technical server detection
runtime utilities
pure update helpers
framework-independent technical behavior
```

Core must not depend on:

```text
Template
Application
```

React UI and Redux application orchestration generally do not belong in Core.

---

# 7. Base Template Repository

The Base Template repository contains the reusable platform.

Conceptually:

```text
Base Template Repository
|
+-- Template
|   |
|   +-- reusable application shell
|   +-- reusable React functionality
|   +-- Redux infrastructure
|   +-- navigation infrastructure
|   +-- design system
|   +-- reusable orchestration
|
+-- Core
    |
    +-- reusable technical capabilities
```

The Base Template repository is not Agent.Workbench.

It must not permanently contain product-specific Agent.Workbench behavior.

---

# 8. Application Repositories

Concrete products should live in separate repositories.

The target repository structure is conceptually:

```text
Base Template Repository
        ^
        |
        +--------------------------+
        |                          |
Agent.Workbench Repository    HEMS Repository
        |                          |
        +-- Application            +-- Application
        +-- product config         +-- product config
        +-- product screens        +-- product screens
        +-- product state          +-- product state
        +-- branding               +-- branding
        +-- build/deployment       +-- build/deployment
```

Future Applications should follow the same model.

---

# 9. Repository Dependency Model

Each Application consumes the Base Template.

Conceptually:

```text
Agent.Workbench
      |
      v
Base Template
      |
      +-- Template
      |      |
      |      v
      +-- Core
```

and independently:

```text
HEMS
  |
  v
Base Template
  |
  +-- Template
  |      |
  |      v
  +-- Core
```

There is no requirement for one Application to know another Application.

---

# 10. No Runtime Multi-Application Resolver

The Base Template does not select between products at runtime.

The following model is intentionally avoided:

```text
Template
|
+-- if Agent.Workbench ...
+-- if HEMS ...
+-- select concrete Application
```

Instead, every concrete Application composes itself with Template.

Conceptually:

```text
applicationConfig
        |
        v
createTemplateApp(...)
        |
        v
TemplateApp
```

The concrete Application entry point selects the Application.

---

# 11. Application Contract

Template defines an explicit integration contract.

The current central contract is:

```text
ApplicationConfig
```

The relevant Template-side integration files are:

```text
src/template/application/ApplicationConfig.ts
src/template/application/ApplicationConfigContext.tsx
src/template/application/createTemplateApp.tsx
src/template/application/TemplateApp.tsx
```

The contract allows Application configuration to flow downward into Template.

Template does not import concrete product configuration.

---

# 12. Current Application Composition

The current repository already contains the beginning of the Application side:

```text
src/application/
|
+-- index.ts
+-- config/
+-- generated/
+-- state/
```

The active configuration path is conceptually:

```text
application.properties
        |
        v
configuration generator
        |
        v
generated ApplicationConfig
        |
        v
createTemplateApp(...)
        |
        v
TemplateApp
```

This is already implemented inside the current transitional repository.

---

# 13. Developer-Facing Configuration

Developer-facing Application configuration should remain simple.

The current source is:

```text
src/application/config/application.properties
```

Typical values include:

```properties
ApplicationId=agent-workbench
ApplicationTitle=Agent.Workbench
```

The properties file is transformed into the TypeScript runtime contract.

Product developers should not need to modify Template internals for basic
Application configuration.

---

# 14. Configuration Generator

The current generator is:

```text
src/template/config/build/generateApplicationConfig.mjs
```

It currently generates:

```text
src/application/generated/applicationConfig.generated.ts
```

This is suitable for the current migration stage.

When Application repositories are separated physically, the generator
interface should be reviewed so reusable Template tooling does not permanently
depend on one concrete repository layout.

---

# 15. Navigation

Navigation is separated by ownership.

Application owns:

```text
menu definitions
tab definitions
product visibility rules
product navigation configuration
```

Template owns:

```text
routing infrastructure
menu rendering
tab rendering
navigation state integration
navigation presentation
```

Conceptually:

```text
Application navigation
        |
        v
Template navigation engine
```

Core does not own menus or React Navigation.

---

# 16. Redux

Redux is an implementation technology, not an architecture layer.

State ownership follows responsibility.

```text
Template
|
+-- reusable Template reducers
+-- store infrastructure
+-- reusable Redux integration

Application
|
+-- product-specific reducers
+-- product-specific state
```

Core should not depend on the application Redux store.

---

# 17. Current Redux Migration

The current runtime still uses the existing store and root reducer.

The active store remains based on:

```text
src/template/state/store/store.ts
src/template/state/store/rootReducer.ts
```

A future extensible composition has already been prepared through:

```text
src/template/state/store/createTemplateStore.ts
src/template/state/store/templateReducers.ts
src/template/state/store/types.ts
src/application/state/applicationReducers.ts
```

This new composition is not yet active.

It must not be connected until state typing and runtime compatibility are
safe.

---

# 18. Authentication

Authentication is split by responsibility.

```text
Core
|
+-- technical authentication helpers
+-- technical auth types
+-- reusable token/time helpers
+-- technical logout protection

Template
|
+-- login experience
+-- session orchestration
+-- JWT/OIDC orchestration
+-- reusable auth Redux state
+-- logout orchestration

Application
|
+-- product-specific authentication configuration where required
```

Authentication is therefore not a single Core module.

---

# 19. Server Handling

Server functionality is also split.

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
+-- reconnect behavior
+-- server-selection UI

Application
|
+-- product-specific server configuration
```

---

# 20. Update System

Update functionality follows the same ownership model.

```text
Core
|
+-- pure technical update helpers

Template
|
+-- Redux update state
+-- hooks
+-- watchers
+-- notifications
+-- dialogs
+-- update orchestration

Application
|
+-- product-specific update behavior only where required
```

Reusable UI and orchestration remain outside Core.

---

# 21. Design System

Reusable React presentation belongs to Template.

The shared design system currently lives under:

```text
src/template/components/design-system/
```

It includes reusable areas such as:

```text
icons
stylistic components
themed components
UI elements
```

Product-specific visual behavior remains Application-owned.

Core does not own React presentation components.

---

# 22. Optional Features

Optionality is not a separate architecture layer.

A feature may be optional while still belonging to:

```text
Application
Template
or
Core
```

For example:

```text
reusable developer tool       --> possible Template responsibility
product-specific diagnostics  --> Application responsibility
technical diagnostic helper   --> possible Core responsibility
```

Whether a feature is enabled is separate from who owns it.

The architecture therefore does not define an `Optional Modules` dependency
layer.

---

# 23. Agent.Workbench Functionality

The Base Template must not be defined by Agent.Workbench functionality.

Examples such as:

```text
Program Start
Data Analysis
Agent.Workbench execution settings
Agent.Workbench-specific administration
```

must be evaluated as product responsibilities.

Some of this code still physically exists under Template during migration.

That is transitional.

Physical location does not determine final ownership.

---

# 24. HEMS

HEMS is a concrete Application.

It should consume the same Base Template contract without requiring
HEMS-specific code inside Template.

Conceptually:

```text
HEMS Application
        |
        v
ApplicationConfig
        |
        v
Base Template
```

The separate HEMS repository is part of the target repository architecture and
is not yet represented as a completed extraction in the current repository.

---

# 25. Build and Deployment

Concrete Applications ultimately own their own build and deployment process.

Typical Application-owned concerns include:

```text
Application identity
release artifacts
release destinations
product release workflow
deployment configuration
Helm configuration
```

The Base Template may provide reusable tooling.

It should not permanently own concrete product deployment configuration.

---

# 26. Current Release Integration Gap

The current test-release workflow directly executes:

```text
npx expo export -p web
```

The workflow currently does not explicitly guarantee:

```text
npm run config:generate
```

immediately before the export.

This remains a known transitional build integration issue.

The final Application build process should deterministically generate its
configuration.

---

# 27. Public APIs

Architecture boundaries should eventually be exposed through stable public
interfaces.

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

Current path aliases support architectural imports such as:

```text
@application
@template
@core
```

Stable contracts should be preferred over arbitrary deep imports.

Public APIs should evolve incrementally and should not be expanded without a
clear requirement.

---

# 28. Configuration Is Not Architecture Ownership

Configuration can enable or disable behavior.

It does not change ownership.

For example:

```text
feature disabled by Application configuration
```

does not automatically make the feature Application-owned.

Likewise:

```text
feature enabled for multiple products
```

does not automatically make it Core.

Ownership is determined by responsibility.

---

# 29. Current Physical State

The current repository already contains:

```text
src/application/
src/template/
src/core/
```

This establishes the logical architecture inside one repository.

However, the final physical repository separation is not complete.

Currently:

```text
Application contract             --> implemented
Template/Core boundaries         --> partially implemented
properties configuration         --> implemented
generated ApplicationConfig      --> implemented
new Redux composition            --> prepared, not active
Agent.Workbench extraction       --> not complete
HEMS repository integration      --> not complete
final repository distribution    --> not complete
```

---

# 30. Target Physical Architecture

The target physical model is:

```text
                    +--------------------------+
                    | Base Template Repository |
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
| Agent.Workbench Repository  |       | HEMS Repository             |
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

Future Applications can be added without changing the fundamental model.

---

# 31. Migration Strategy

The migration is incremental.

The sequence is conceptually:

```text
1. Define architecture responsibilities.
2. Classify current code.
3. Introduce dependency boundaries.
4. Introduce Application contracts.
5. Move reusable technical capabilities into Core where appropriate.
6. Move reusable application-shell behavior into Template.
7. Identify concrete product behavior.
8. Prepare safe extension points.
9. Validate runtime behavior.
10. Extract concrete Application repositories.
```

Repository appearance is not more important than runtime stability.

---

# 32. Migration Safety

Large structural changes should not be connected prematurely.

In particular:

```text
new Redux composition
Application reducer extraction
Agent.Workbench screen extraction
repository separation
```

must be validated incrementally.

Before major migration steps:

```text
npm run config:generate
npx tsc --noEmit
affected tests
npm-based runtime validation
git diff --check
```

should be used where applicable.

---

# 33. Non-Goals

The architecture does not aim to:

```text
put all reusable functionality into Core
turn Core into a React framework
turn Core into a Redux framework
create a separate Optional Modules architecture layer
make Base Template synonymous with Agent.Workbench
keep multiple concrete products permanently in one Template repository
introduce a runtime product resolver
move all source code at once
activate unfinished Redux composition prematurely
```

---

# 34. Architecture Documents

Detailed architecture information is split across focused documents.

```text
00-vision.md
  overall architectural direction

01-core-platform.md
  Core responsibility and boundaries

05-current-state.md
  current implementation checkpoint

application-contract.md
  Application/Template integration contract

platform-architecture.md
  high-level platform and repository model
```

Supporting documentation under `doc/` describes individual systems and
migration details.

---

# 35. Success Criteria

The architecture is successful when:

1. Core contains focused reusable technical capabilities.
2. Core does not depend on Template or Application.
3. Template provides the reusable application shell.
4. Template does not import concrete Application implementation.
5. Agent.Workbench owns its product-specific functionality.
6. HEMS owns its product-specific functionality.
7. Concrete Applications can configure Template through stable contracts.
8. Product-specific Redux state can be composed without Template importing
   product reducers.
9. Application developers can use simple product configuration.
10. Each Application can own its build and deployment.
11. The same Base Template can be reused by multiple independent Applications.
12. Runtime behavior remains stable throughout migration.

---

# 36. Summary

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

The repository architecture is:

```text
Application Repository
        |
        v
Base Template Repository
        |
        +-- Template
        |      |
        |      v
        +-- Core
```

Agent.Workbench, HEMS and future Applications should each remain independent
products that consume the reusable Base Template.

The Base Template provides reusable application behavior.

Core provides focused technical capabilities.

Application provides concrete product functionality.