# Current Architecture

## Purpose

This document describes the current implementation state of the
`web.template` architecture.

It intentionally distinguishes between:

```text
IMPLEMENTED AND ACTIVE
PREPARED BUT NOT YET ACTIVE
TRANSITIONAL
PLANNED
```

The target dependency direction is:

```text
Application --> Template --> Core
```

This document describes what currently exists in the repository and must not
be interpreted as if the final repository separation were already complete.

---

# 1. Current Repository State

The repository is currently in an incremental architecture migration.

The three architectural responsibility areas already exist physically:

```text
src/
|
+-- application/
+-- template/
+-- core/
```

However, physical separation is not yet complete.

Some product-specific Agent.Workbench functionality still exists inside
Template.

The separate Agent.Workbench and HEMS Application repositories have not yet
been extracted from this repository.

---

# 2. Current Dependency Model

The target and increasingly implemented dependency direction is:

```text
Application
    |
    v
Template
    |
    v
Core
```

Responsibilities are currently being moved toward this model incrementally.

The architecture rules are:

```text
Core
  must not depend on Template or Application

Template
  may depend on Core
  must not depend on concrete Application implementation

Application
  may depend on Template and Core
```

---

# 3. Current Core Structure

The currently verified top-level Core directories are:

```text
src/core/
|
+-- authentication/
+-- runtime/
+-- server/
+-- update/
```

Core contains reusable technical functionality.

It is not the complete reusable application platform.

React application-shell functionality remains in Template.

---

# 4. Core Authentication

The currently verified Core authentication files are:

```text
src/core/authentication/
|
+-- types.ts
|
+-- http/
|   +-- attachAuthInterceptors.tsx
|
+-- jwt/
|   +-- jwtTime.ts
|
+-- logout/
    +-- logoutFlowGuard.ts
```

These files represent reusable technical authentication capabilities.

Session orchestration and reusable authentication UI remain Template
responsibilities.

---

# 5. Core Runtime

A dedicated Core runtime area currently exists at:

```text
src/core/runtime/
```

Its presence is part of the current Core structure.

Detailed runtime ownership should continue to follow the same rule:

```text
technical runtime capability --> Core
React/application orchestration --> Template
product runtime behavior --> Application
```

This document does not assume additional runtime responsibilities without
explicit source verification.

---

# 6. Core Server Infrastructure

Reusable technical server infrastructure currently exists under:

```text
src/core/server/
```

Known current responsibilities include:

- Server normalization
- Server validation
- Technical server checks
- Server-environment detection
- Parsing reusable backend information
- Technical server types

This infrastructure is consumed by higher-level Template behavior.

Server-selection UI and Redux orchestration remain Template responsibilities.

---

# 7. Core Update Infrastructure

Reusable technical update functionality currently exists under:

```text
src/core/update/
```

Core update functionality is limited to technical helpers.

Reusable update state, hooks, watchers, dialogs and notifications belong to
Template.

---

# 8. Current Template Application Contract

The reusable Template application integration layer currently exists at:

```text
src/template/application/
```

Verified files are:

```text
ApplicationConfig.ts
ApplicationConfigContext.tsx
createTemplateApp.tsx
TemplateApp.tsx
```

These files are central to the current Application/Template separation.

---

# 9. ApplicationConfig

`ApplicationConfig.ts` defines the contract through which a concrete
Application supplies configuration to Template.

The current contract includes Application identity and navigation
configuration.

Conceptually:

```text
Concrete Application
        |
        v
ApplicationConfig
        |
        v
Template
```

This allows Template to receive product configuration instead of importing a
concrete product implementation.

---

# 10. Application Configuration Context

`ApplicationConfigContext.tsx` provides reusable runtime access to selected
Application configuration values.

Template UI can therefore consume Application identity through the
configuration context.

This replaces direct Template dependencies on product-specific environment
variables such as the former application-title configuration.

---

# 11. createTemplateApp

`createTemplateApp.tsx` provides the current reusable integration point between
Application and Template.

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

The Application supplies configuration.

Template supplies the reusable application runtime.

---

# 12. Current Entry Point

The current project entry point composes Application and Template.

Conceptually:

```text
Application configuration
        |
        v
createTemplateApp(...)
        |
        v
registerRootComponent(...)
```

This is an important implemented dependency inversion:

```text
Template does not select a concrete Application.
Application provides itself to Template.
```

There is no intended runtime multi-application resolver inside Template.

---

# 13. Current Application Structure

The currently verified Application files are:

```text
src/application/
|
+-- index.ts
|
+-- config/
|   +-- application.properties
|
+-- generated/
|   +-- applicationConfig.generated.ts
|
+-- state/
    +-- applicationReducers.ts
```

This represents the beginning of the concrete Application side of the
architecture.

The current Application area is still transitional and is not yet a complete
standalone product repository.

---

# 14. Application Properties

Developer-facing Application configuration currently begins at:

```text
src/application/config/application.properties
```

This is intentionally a simple properties-based configuration source.

The concrete Application owns these values.

Template should not require product developers to modify Template internals in
order to configure basic Application identity.

---

# 15. Generated Application Configuration

The properties configuration is transformed into:

```text
src/application/generated/applicationConfig.generated.ts
```

The generated TypeScript configuration satisfies the runtime
`ApplicationConfig` contract.

Conceptually:

```text
application.properties
        |
        v
configuration generator
        |
        v
applicationConfig.generated.ts
        |
        v
src/application/index.ts
        |
        v
createTemplateApp(...)
```

---

# 16. Configuration Generator

The current configuration generator exists at:

```text
src/template/config/build/generateApplicationConfig.mjs
```

The generator is currently Template-side build tooling.

It reads Application properties and creates the generated TypeScript
configuration.

This implementation is currently valid for the migration stage.

Its final interface must be reviewed when Application and Base Template are
physically moved into separate repositories.

---

# 17. Configuration Lifecycle

The project currently provides:

```text
npm run config:generate
```

Normal npm startup scripts trigger configuration generation through npm
lifecycle hooks.

The intended normal startup path is therefore through npm scripts such as:

```text
npm start
npm run web
npm run android
npm run ios
```

Direct Expo commands may bypass the configuration-generation lifecycle.

---

# 18. Current Template State Infrastructure

Reusable Redux infrastructure currently exists under:

```text
src/template/state/store/
```

Verified files are:

```text
createTemplateStore.ts
rootReducer.ts
store.ts
templateReducers.ts
types.ts
useAppDispatch.ts
useAppSelector.ts
```

This directory currently contains both:

```text
the active existing store implementation
and
the prepared extensible store infrastructure
```

These must not be confused.

---

# 19. Active Redux Store

The existing store remains the active runtime store.

Current active infrastructure includes:

```text
src/template/state/store/store.ts
src/template/state/store/rootReducer.ts
```

The application still depends on this existing runtime composition.

This was intentionally preserved to avoid destabilizing the running
application during the architecture migration.

---

# 20. Active Root Reducer Is Transitional

The current active root reducer still contains responsibilities that will not
all belong to Template in the final architecture.

In particular, Agent.Workbench-specific state remains part of the active store
during the migration.

This means:

```text
current physical Redux ownership
!=
final architectural Redux ownership
```

The active store must continue working until the replacement composition is
safe.

---

# 21. Prepared Store Factory

A reusable store factory has already been prepared at:

```text
src/template/state/store/createTemplateStore.ts
```

Its purpose is to allow Template-owned reducers and Application-owned reducers
to be composed without Template importing concrete product reducers directly.

Conceptually:

```text
Template reducers
        +
Application reducers
        |
        v
createTemplateStore(...)
        |
        v
Redux store
```

This is prepared infrastructure.

It is not yet the active production store composition.

---

# 22. Template Reducer Registry

A reusable Template reducer registry exists at:

```text
src/template/state/store/templateReducers.ts
```

Its purpose is to describe reusable Template-owned Redux state separately from
Application-owned state.

This is part of the prepared architecture.

It must not be interpreted as proof that all current reducers have already
been completely separated.

---

# 23. ApplicationReducers Type

The reusable Application reducer contract exists at:

```text
src/template/state/store/types.ts
```

It provides the type used for Application reducer registration.

Conceptually:

```text
ApplicationReducers
|
+-- reducer key
+-- reducer implementation
```

The store factory can merge those reducers with Template reducers.

---

# 24. Application Reducer Registry

The current Application-side reducer registry is:

```text
src/application/state/applicationReducers.ts
```

This registry is transitional.

It currently provides a composition point for product-specific reducers while
the actual Agent.Workbench reducer files are still being migrated.

The existence of this registry does not mean the full Application Redux
extraction is complete.

---

# 25. Store Factory Safety

The prepared store composition protects against reducer-key collisions.

A concrete Application must not silently override an existing Template reducer
with the same key.

This protects the Template/Application contract.

The new store factory has been developed and tested separately from the active
runtime store.

---

# 26. Why the New Store Is Not Active Yet

The new Redux composition was intentionally not connected to `TemplateApp`
yet.

The migration still requires careful validation of:

- State typing
- Typed hooks
- Existing reducer consumers
- Runtime initialization
- Agent.Workbench-specific reducer ownership
- Compatibility with existing screens and hooks

The stable existing store remains active until these concerns are resolved.

---

# 27. Typed Redux Hooks

Typed Redux hooks currently exist under:

```text
src/template/state/store/useAppDispatch.ts
src/template/state/store/useAppSelector.ts
```

Their final typing must remain compatible with the future extensible
Template/Application store.

This is one of the reasons the new store composition should not be connected
prematurely.

---

# 28. Agent.Workbench-Specific State

Some Agent.Workbench-specific Redux state still physically exists inside the
current Template source tree.

Known examples include functionality related to:

```text
execSettings
dataAnalysis
data analyzing
```

These responsibilities are Application candidates.

They are not intended to become permanent Base Template product behavior.

---

# 29. Agent.Workbench-Specific Screens

Some Agent.Workbench-specific screens also still physically exist in Template.

Known current candidates include the Agent.Workbench options area and related
Program Start / Data Analyzing functionality.

These are not yet extracted because the separate Agent.Workbench Application
repository is not ready.

They should not be moved simply to make the source tree look architecturally
complete.

---

# 30. Current Template Ownership

Template currently owns reusable application-shell responsibilities such as:

```text
Template application bootstrap
Application configuration contract
Navigation infrastructure
Redux infrastructure
Authentication/session orchestration
Server-selection behavior
Design system
Reusable components
Notifications
Update orchestration
Common screens
Localization UI
Reusable hooks
```

Template may depend on Core.

Template must not become permanently dependent on Agent.Workbench.

---

# 31. Current Design System

The shared design system has already been moved under:

```text
src/template/components/design-system/
```

Verified groups include:

```text
icons/
stylistic/
themed/
ui-elements/
```

This is reusable Template UI and does not belong in Core.

---

# 32. Current Component Structure

Reusable components currently include areas such as:

```text
src/template/components/design-system/
src/template/components/developer-tools/
src/template/components/dynamic-content/
src/template/components/layout/
src/template/components/localization/
src/template/components/notifications/
src/template/components/rich-text-editor/
```

Some feature ownership decisions, such as developer tools and dynamic content,
may still require review.

Their current physical location is Template.

---

# 33. Current Navigation Ownership

Reusable navigation infrastructure belongs to Template.

Concrete menu and tab definitions are moving toward Application ownership.

The current Application contract already accepts navigation configuration.

Conceptually:

```text
Application
|
+-- menu definitions
+-- tab definitions
+-- visibility rules
        |
        v
Template navigation infrastructure
```

The final extraction is still in progress.

---

# 34. Current Authentication Separation

Authentication is already split between technical Core capabilities and
Template orchestration.

Current Core examples include:

```text
src/core/authentication/http/attachAuthInterceptors.tsx
src/core/authentication/jwt/jwtTime.ts
src/core/authentication/logout/logoutFlowGuard.ts
src/core/authentication/types.ts
```

Template retains reusable session/authentication orchestration and UI.

This is consistent with:

```text
Application --> Template --> Core
```

---

# 35. Current Server Separation

Technical server behavior is located under:

```text
src/core/server/
```

Reusable Template state and presentation remain outside Core.

This establishes the intended separation:

```text
Core
|
+-- technical server capability

Template
|
+-- Redux state
+-- orchestration
+-- UI

Application
|
+-- product-specific server configuration
```

---

# 36. Current Update Separation

Technical update helpers exist under:

```text
src/core/update/
```

Reusable update orchestration remains under Template.

Current Template update architecture includes areas for:

```text
update state
update hooks
update watchers
update UI
update notifications
```

The update system is therefore intentionally split by responsibility.

---

# 37. Release-Type Separation

Current backend release-type parsing is performed by reusable server
infrastructure.

Reusable frontend release state remains under Template.

The current relevant paths include:

```text
src/core/server/serverCheck.ts
src/template/state/release/appReleaseSlice.tsx
src/template/components/layout/Footer.tsx
```

This separation keeps backend parsing out of presentation components.

---

# 38. File Configuration

The file-configuration feature currently lives primarily in Template.

Current central files include:

```text
src/template/screens/settings/AppSettingsFileUploadScreen.tsx
src/template/hooks/useFileDropWeb.ts
src/template/state/settings/appSettingsFileUploadSlice.ts
src/template/components/design-system/ui-elements/UpdateProgressDialog.tsx
```

Its final product/reuse ownership should still be reviewed before repository
separation.

---

# 39. Current Build Configuration

The current repository still contains concrete build and release workflows.

During the migration this is expected.

Long term, concrete Applications should own their own product build and
deployment configuration.

The Base Template should provide reusable build capability without permanently
owning a concrete Application deployment target.

---

# 40. Test Release Configuration Gap

The current test-release workflow still calls:

```text
npx expo export -p web
```

directly.

It does not explicitly execute:

```text
npm run config:generate
```

before export.

Therefore the current release workflow depends on the generated Application
configuration already being current.

This remains an identified build-integration issue.

---

# 41. Separate Application Repositories

The final repository split is not yet implemented.

The target is:

```text
Base Template Repository
        |
        +-- consumed by Agent.Workbench Repository
        |
        +-- consumed by HEMS Repository
        |
        +-- consumed by future Application repositories
```

At the current checkpoint:

```text
Base Template repository separation --> designed
Application contract                --> implemented in current repository
Agent.Workbench repository          --> not yet extracted
HEMS repository                     --> not yet extracted
```

---

# 42. No Multi-Application Resolver

The architecture does not use a runtime resolver inside Template to select one
of several concrete applications.

Instead, each concrete Application composes itself with the Base Template.

Conceptually:

```text
Agent.Workbench repository
        |
        v
Base Template

HEMS repository
        |
        v
Base Template
```

Each Application has its own build.

---

# 43. Current Migration Classification

The current architecture can be summarized as follows.

## Implemented and active

```text
src/core responsibility area
src/template responsibility area
src/application responsibility area

ApplicationConfig contract
ApplicationConfigContext
createTemplateApp
TemplateApp

properties-based Application configuration
generated Application configuration

existing Redux runtime store
existing root reducer

Template design system
Core authentication/server/update separation
```

## Implemented but prepared for later activation

```text
createTemplateStore
templateReducers
ApplicationReducers type
applicationReducers registry
extensible reducer composition
reducer-key collision protection
```

## Transitional

```text
Agent.Workbench-specific reducers inside Template
Agent.Workbench-specific screens inside Template
existing rootReducer ownership
Application reducer registry referencing transitional product state
concrete release workflows in web.template
configuration generator coupled to current repository paths
file-configuration ownership
```

## Not yet implemented

```text
separate Agent.Workbench repository
separate HEMS repository
final Base Template distribution/consumption model
final Application branding contract
final Application build/deployment ownership
final Redux runtime composition
full product-specific code extraction
```

---

# 44. What Must Not Be Claimed Yet

The following statements are currently incorrect:

```text
"Agent.Workbench has already been extracted."

"HEMS already consumes the Base Template repository."

"The new createTemplateStore implementation is the active runtime store."

"All Application reducers have already been moved out of Template."

"All Template code is application-independent."

"The final repository split is complete."

"The release pipeline always regenerates Application configuration."
```

Documentation must continue to distinguish target architecture from current
implementation.

---

# 45. Current Architecture Diagram

The current logical architecture is:

```text
+--------------------------------------------------+
| Current concrete Application                    |
|                                                  |
| application.properties                          |
| generated ApplicationConfig                     |
| applicationReducers (transitional)              |
+------------------------+-------------------------+
                         |
                         v
+--------------------------------------------------+
| Template                                         |
|                                                  |
| TemplateApp                                      |
| createTemplateApp                                |
| ApplicationConfig contract                      |
| React application shell                         |
| navigation                                       |
| Redux runtime + prepared store factory           |
| design system                                    |
| authentication/session orchestration             |
| notifications                                    |
| update orchestration                             |
| common screens/features                          |
| transitional Agent.Workbench functionality       |
+------------------------+-------------------------+
                         |
                         v
+--------------------------------------------------+
| Core                                             |
|                                                  |
| authentication                                   |
| runtime                                          |
| server                                           |
| update                                            |
| reusable technical capabilities                  |
+--------------------------------------------------+
```

This is the current logical state.

It is not yet the final physical repository architecture.

---

# 46. Target Repository Diagram

The target physical repository model is:

```text
                 Base Template Repository
              +----------------------------+
              | Template                   |
              |            |               |
              |            v               |
              | Core                       |
              +-------------+--------------+
                            ^
                            |
             +--------------+--------------+
             |                             |
+--------------------------+   +--------------------------+
| Agent.Workbench          |   | HEMS                     |
| Application Repository   |   | Application Repository   |
+--------------------------+   +--------------------------+
```

Future Applications should use the same model.

---

# 47. Migration Safety

The current migration must continue incrementally.

Before activating or moving major architecture components:

```text
1. Verify ownership.
2. Verify actual source dependencies.
3. Make the smallest coherent change.
4. Run TypeScript validation.
5. Run affected tests.
6. Run configuration generation.
7. Validate application startup.
8. Review Git diff.
9. Avoid broad automated rewrites.
```

Runtime stability has priority over making the directory structure appear
finished.

---

# 48. Current Validation Expectations

Before the current architecture checkpoint is merged, validation should
include:

```text
npm run config:generate
npx tsc --noEmit
affected automated tests
npm-based application startup
git diff --check
```

Normal runtime validation should use npm lifecycle commands so Application
configuration generation is not accidentally bypassed.

---

# 49. Current Documentation Status

The documentation is being aligned around one consistent architecture:

```text
Application --> Template --> Core
```

Detailed documents describe:

```text
Application separation
Core responsibilities
Template responsibilities
Redux migration
Authentication
Server checks
Update system
Components/design system
File configuration
Release handling
Current architecture status
```

Architecture documents should continue to distinguish:

```text
current implementation
from
target architecture
```

---

# 50. Current Checkpoint Summary

At the current checkpoint, the architecture separation is established but not
finished.

Already established:

```text
Core / Template / Application responsibility model
ApplicationConfig integration contract
properties-based Application identity/configuration
generated runtime configuration
Template application composition
initial Core technical extraction
Template design-system ownership
parallel extensible Redux infrastructure
```

Still intentionally incomplete:

```text
new Redux store activation
Agent.Workbench code extraction
HEMS integration
separate Application repositories
final generator integration across repositories
final product build/deployment separation
remaining feature ownership decisions
```

The current priority is to preserve the working application while completing
the architecture incrementally.