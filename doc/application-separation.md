# Separation of the Base Template and Applications

## 1. Status

**Status:** Implemented architecture with future consumer integration work

**Project:** `web.template`

The fundamental architecture is:

```text
Application --> Template --> Core
```

The current ownership model is:

* Core contains reusable technical capabilities.
* Template contains the reusable application platform.
* Standard Agent.Workbench functionality belongs to Template.
* Application contains concrete product composition and extensions.
* HEMS is an example of a concrete Application.
* The current `src/application/` directory is the in-repository Agent.Workbench Application composition.
* Template must not import a concrete Application.
* Core must remain independent from both Template and Application.

Agent.Workbench is the current in-repository Application identity/composition, but it is not modeled as a separate consumer Application repository

A separate Agent.Workbench Application repository is therefore not required.

---

## 2. Architecture

The implemented dependency direction is:

```text
Concrete Application
        |
        v
Base Template
        |
        v
Core
```

In short:

```text
Application --> Template --> Core
```

The following dependency directions are not allowed:

```text
Template --> concrete Application
Core --> Template
Core --> Application
```

Template may depend on Core.

Application may consume supported Template and Core integration surfaces.

The dependency direction must not be reversed.

---

## 3. Base Template Responsibility

The Base Template provides the reusable application platform.

It includes responsibilities such as:

```text
Base Template
|
+-- TemplateApp
+-- createTemplateApp
+-- ApplicationConfig
+-- ApplicationConfigContext
+-- configuration infrastructure
+-- navigation infrastructure
+-- Template navigation definitions
+-- Template screen registry
+-- Redux infrastructure
+-- Agent.Workbench standard functionality
+-- Agent.Workbench state
+-- authentication and session orchestration
+-- server selection
+-- settings
+-- design system
+-- notifications
+-- update orchestration
+-- reusable screens
+-- reusable hooks
+-- reusable components
+-- layout
+-- Core integration
```

Standard Agent.Workbench functionality is intentionally part of this reusable platform.

Examples include:

```text
Program Start
Data Analyzing
Database configuration
Server configuration
Live Console
Settings
Agent.Workbench state
Agent.Workbench navigation
Agent.Workbench API integration where reusable
```

These responsibilities are not considered transitional Application code.

---

## 4. Concrete Application Responsibility

A concrete Application provides product-specific composition on top of the Base Template.

Examples of Application-owned responsibilities include:

```text
Application
|
+-- Application identity
+-- Application metadata
+-- Template feature selection
+-- Application-specific navigation
+-- Application-specific screens
+-- Application translations
+-- optional Application-specific Redux state
+-- product-specific behavior
+-- product-specific branding
+-- product-specific build configuration
+-- product-specific deployment configuration
```

HEMS is an example of a concrete Application.

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

The current repository uses the in-repository Agent.Workbench Application composition to validate this contract before a separate consumer such as HEMS is integrated.

---

## 5. Current Repository Model

The current `web.template` repository contains:

```text
web.template
|
+-- src/core/
|
+-- src/template/
|
+-- src/application/
```

The responsibility mapping is:

```text
src/core/
    reusable technical capabilities

src/template/
    reusable Base Template platform
    including Agent.Workbench standard functionality

src/application/
    Agent.Workbench Application composition
    used to validate the Application integration contract
```

`src/application/` is not Agent.Workbench.

---

## 6. Future Consumer Repositories

Concrete products may consume the Base Template from their own repositories.

The expected model is:

```text
                 web.template
               Base Template
                     ^
                     |
            +--------+--------+
            |                 |
          HEMS         future Applications
```

A future HEMS repository may own:

```text
HEMS configuration
HEMS navigation extensions
HEMS screens
HEMS translations
optional HEMS-specific Redux state
HEMS business logic
HEMS branding
HEMS build configuration
HEMS deployment configuration
```

There is no equivalent required Agent.Workbench Application repository because Agent.Workbench standard functionality is part of the Base Template.

---

## 7. Application Configuration

Developer-facing Application configuration must remain simple.

Developers should not need to edit TypeScript, TSX, JavaScript or JSON files for normal Application configuration.

The current configuration structure is:

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

Generated TypeScript may exist as build/runtime output.

It is not the developer-facing configuration format.

---

## 8. Legacy Configuration Names

The following old configuration names are not part of the current architecture:

```text
menu.properties
tabs.properties
featureFlags.properties
menuFeatureFlags.properties
tabFeatureFlags.properties
```

They must not be documented as current or planned configuration.

The active model is:

```text
application.properties
features.properties
navigation.properties
```

---

## 9. Application Properties

Application identity and metadata are defined through:

```text
src/application/config/application.properties
```

Application identity belongs to the concrete Application.

Typical runtime identity values include:

```text
id
displayName
```

Template may consume the values it requires through the formal Application contract.

Template must not rely on hardcoded product-specific identity values.

Additional metadata should only be mapped into `ApplicationConfig` when Template actually requires it.

---

## 10. Semantic Feature Selection

Reusable Template functionality is enabled or disabled through:

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

This means the Application does not need to configure internal Template details such as:

```text
numeric menu IDs
internal parent IDs
Template screen registry keys
authentication visibility rules
runtime visibility rules
Agent.Workbench internal navigation definitions
```

---

## 11. Application Navigation

Application-specific navigation extensions are configured through:

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

The Application describes its own navigation extension semantically.

Template remains responsible for reusable navigation infrastructure and reusable Template navigation definitions.

Custom Application IDs are generated or resolved internally.

Application developers do not manually maintain Template internal numeric IDs.

---

## 12. Navigation Ownership

Navigation is separated by responsibility.

### Template owns

```text
menu rendering
menu tree construction
routing
path calculation
Template navigation definitions
Template screen registry
Template visibility integration
Agent.Workbench navigation
Template menu ordering
```

### Application owns

```text
Application-specific navigation extensions
Application-specific screen references
optional custom menu ordering
```

The composition is:

```text
Template navigation
        +
Application navigation extensions
        |
        v
runtime navigation
```

Applications do not provide or duplicate the complete Base Template navigation structure.

---

## 13. Template Menu Ordering

Normal Template menu ordering is derived automatically from sibling order in the Template menu catalog.

Template menu definitions therefore do not require manually maintained numeric positions in normal cases.

Application custom `position` remains optional.

For items without an explicit position, MenuHub uses:

```ts
Number.MAX_SAFE_INTEGER
```

The relevant implementation is:

```text
src/template/screens/menu/MenuHubScreen.tsx
```

This keeps Drawer and MenuHub ordering consistent.

---

## 14. Configuration Generation

Developer-facing `.properties` files are transformed into runtime configuration.

Conceptually:

```text
Application .properties
        |
        v
Template configuration tooling
        |
        v
generated runtime artifacts
        |
        v
Application composition
        |
        v
Base Template
```

The configuration tooling exists under:

```text
src/template/config/build/
```

A central generator is:

```text
generateApplicationConfig.mjs
```

Generated Application artifacts are written under:

```text
src/application/generated/
```

The explicit generation command is:

```bash
npm run config:generate
```

Generated TypeScript should not be manually used as the normal developer configuration surface.

---

## 15. Automatic Application Screen Discovery

Application-owned screens are discovered automatically.

The discovery implementation exists at:

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

Applications therefore do not need to manually register concrete screens inside Template.

Template must not import concrete Application screen implementations.

---

## 16. Template Application Contract

The reusable Template integration layer exists under:

```text
src/template/application/
├── ApplicationConfig.ts
├── ApplicationConfigContext.tsx
├── createTemplateApp.tsx
└── TemplateApp.tsx
```

### ApplicationConfig.ts

Defines the typed runtime contract between a concrete Application and Template.

Template owns the contract.

Application supplies concrete values.

### ApplicationConfigContext.tsx

Provides selected Application configuration values to reusable Template UI.

This avoids direct imports from concrete Application implementation.

### createTemplateApp.tsx

Provides the reusable composition point.

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

### TemplateApp.tsx

Provides the reusable React application shell.

It may integrate reusable responsibilities such as:

```text
providers
navigation
session handling
application layout
dialogs
notifications
update watchers
developer tooling
state integration
```

---

## 17. Application Composition

Application is the composition root.

The direction is:

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

Template does not select which concrete Application is running.

The architecture intentionally avoids:

```text
Template
|
+-- if HEMS ...
+-- if Product A ...
+-- if Product B ...
```

Each concrete consumer composes itself with the Base Template.

---

## 18. No Agent.Workbench Application Resolver

Agent.Workbench must not be treated as a concrete Application for runtime selection.

Incorrect:

```text
Template
|
+-- detect Agent.Workbench
+-- detect HEMS
+-- choose product
```

Correct:

```text
Base Template
|
+-- Agent.Workbench standard functionality

HEMS Application
        |
        v
Base Template
```

Agent.Workbench does not require a separate Application resolver or Application repository under the current architecture.

---

## 19. Redux Ownership

Redux is a state-management technology, not an architectural layer.

State belongs to the layer that owns the corresponding responsibility.

The ownership rule is:

```text
Reusable Template state
    -> Template

Agent.Workbench standard state
    -> Template

Concrete product-only state
    -> Application
```

Template provides reusable Redux infrastructure.

Applications may optionally provide their own reducers.

---

## 20. Agent.Workbench State

Agent.Workbench state is intentionally Template-owned.

A dedicated area exists at:

```text
src/template/state/agent-workbench/
```

This state is not transitional Application state.

It must not be documented as waiting to move into a separate Agent.Workbench repository.

Standard Agent.Workbench reducers belong to the same architectural layer as the standard Agent.Workbench functionality they support.

---

## 21. Application-Specific Redux State

Concrete Applications may provide their own Redux state when required.

The current extension point is:

```text
src/application/state/applicationReducers.ts
```

The current Agent.Workbench Application composition does not require meaningful Application-specific Redux state.

Therefore this file is currently essentially empty.

This is valid.

It represents an optional extension point rather than unfinished extraction work.

---

## 22. Redux Infrastructure

Reusable store infrastructure exists under:

```text
src/template/state/store/
```

Known infrastructure includes:

```text
createTemplateStore.ts
rootReducer.ts
store.ts
templateReducers.ts
types.ts
useAppDispatch.ts
useAppSelector.ts
```

The conceptual composition is:

```text
Template reducers
        +
optional Application reducers
        |
        v
runtime Redux store
```

Template must not directly import concrete Application reducer implementations.

Application reducers must not silently replace Template-owned reducer keys.

---

## 23. Core Responsibility

Core contains reusable technical capabilities.

Known areas include:

```text
src/core/
├── authentication/
├── runtime/
├── server/
└── update/
```

Core must not own:

```text
React application-shell composition
Template navigation
Template UI
Agent.Workbench composition
Application configuration
concrete product behavior
```

The dependency constraints are:

```text
Core -X-> Template
Core -X-> Application
```

---

## 24. Authentication Separation

Authentication is separated by responsibility.

```text
Core
├── technical authentication capabilities
├── JWT helpers
├── transport/interceptor logic
└── technical logout guards

Template
├── authentication UI
├── session orchestration
└── reusable login/session behavior

Application
└── concrete product configuration where required
```

This follows:

```text
Application --> Template --> Core
```

---

## 25. Server Separation

Server functionality is also separated by responsibility.

```text
Core
├── normalization
├── validation
├── technical server checks
├── environment detection
└── reusable backend parsing

Template
├── server selection
├── reusable server state
├── orchestration
└── UI

Application
└── product-specific server configuration where required
```

---

## 26. Update Separation

Update functionality follows the same architectural boundary.

```text
Core
└── reusable technical update capabilities

Template
├── update state
├── hooks
├── watchers
├── dialogs
├── notifications
└── reusable orchestration

Application
└── product-specific update behavior only when genuinely product-specific
```

---

## 27. Design System and Reusable UI

Reusable application UI belongs to Template.

The design system exists under:

```text
src/template/components/design-system/
```

Reusable Template components also include areas such as:

```text
developer-tools/
dynamic-content/
layout/
localization/
notifications/
rich-text-editor/
```

A component belongs to Application only when it is genuinely specific to that concrete product.

---

## 28. API Ownership

API ownership follows responsibility rather than names alone.

```text
Reusable technical communication
    -> Core where appropriate

Reusable Base Template / Agent.Workbench API integration
    -> Template where appropriate

Concrete product business API
    -> Application
```

Agent.Workbench API code is not automatically Application-owned merely because it contains Agent.Workbench-specific terminology.

If it supports standard Base Template Agent.Workbench functionality, Template ownership can be correct.

---

## 29. Branding

Concrete product branding belongs to Application when it is genuinely product-specific.

Examples include:

```text
Application logo
product-specific assets
product identity
```

Reusable theme and design-system infrastructure belongs to Template.

Branding values should only be added to `ApplicationConfig` when Template actually needs them.

---

## 30. Build and Deployment

Concrete consumer repositories should own their product-specific build and deployment configuration.

For example, a future HEMS repository may own:

```text
HEMS identity
HEMS configuration
HEMS release configuration
deployment targets
product-specific infrastructure configuration
```

The Base Template provides reusable platform capability and integration contracts.

The Agent.Workbench Application composition inside `web.template` exists primarily to validate those contracts.

---

## 31. Public Template API

Concrete consumer repositories should use explicit supported Template integration surfaces.

Preferred:

```text
ApplicationConfig
createTemplateApp
properties-based configuration
automatic screen discovery
documented navigation extensions
documented Redux extension points
supported Template exports
```

Avoid:

```text
deep imports into arbitrary Template implementation files
product-specific patches inside Template
Template imports from concrete Application folders
manual registration of Application screens inside Template
duplication of Template navigation definitions
```

The exact package-level public API may continue to evolve.

---

## 32. HEMS Integration

A future HEMS consumer should validate that the Base Template contract works outside the current in-repository Agent.Workbench Application composition.

HEMS may provide:

```text
application.properties
features.properties
navigation.properties
HEMS screens
HEMS translations
optional HEMS-specific reducers
HEMS business logic
HEMS branding
HEMS build/deployment configuration
```

The Base Template continues to provide the reusable application platform and standard Agent.Workbench functionality.

This consumer integration extends the architecture.

It does not require changing Agent.Workbench ownership.

---

## 33. Current Implementation Status

### Implemented

The current architecture includes:

```text
Application --> Template --> Core

ApplicationConfig
ApplicationConfigContext
createTemplateApp
TemplateApp

application.properties
features.properties
navigation.properties

configuration generation
automatic Application screen discovery
generated Application screen registry

Agent.Workbench Application composition
Application-specific navigation extensions

Template-owned navigation internals
Template menu ordering

reusable Redux infrastructure
Agent.Workbench state in Template
optional Application reducer extension point

Core authentication/runtime/server/update areas
Template design system
standard Agent.Workbench functionality in Template
```

### Current Agent.Workbench Application Composition

The current Agent.Workbench Application composition contains only the concrete composition required to validate the integration model.

It is not Agent.Workbench.

Its current responsibilities include:

```text
Application configuration
ExampleScreen.tsx
generated runtime artifacts
optional Application Redux extension point
```

### Future Work

Future work may include:

```text
HEMS consumer repository integration
Base Template consumption validation from a separate repository
public package/API refinement
consumer build and deployment setup
additional Application contract extensions when genuinely required
```

---

## 34. No Agent.Workbench Extraction Phase

The previous architecture included a planned Agent.Workbench extraction phase.

That phase is no longer part of the selected architecture.

The following work is not planned under the current model:

```text
move AgentWorkbenchOptions into an Application repository
move Agent.Workbench state into an Application repository
move Agent.Workbench menus and tabs into an Application repository
create a separate Agent.Workbench Application repository
remove standard Agent.Workbench functionality from Template
```

These actions would contradict the current ownership decision.

Agent.Workbench standard functionality remains Template-owned unless the architecture is explicitly changed in the future.

---

## 35. Incorrect Legacy Assumptions

The following statements are no longer correct:

```text
"The Base Template must remain independent from Agent.Workbench."

"Agent.Workbench must have its own Application repository."

"Agent.Workbench and HEMS are equivalent concrete Applications."

"Agent.Workbench state inside Template is transitional."

"Agent.Workbench screens inside Template are extraction candidates."

"Agent.Workbench reducers must move into Application."

"menu.properties will become the Application menu configuration."

"tabs.properties will become the Application tab configuration."

"menuFeatureFlags.properties will define menu features."

"tabFeatureFlags.properties will define tab features."

"Concrete Applications own the complete navigation definition."

"Template must not contain standard Agent.Workbench behavior."
```

The correct model is:

```text
Agent.Workbench standard functionality
    -> Base Template

HEMS
    -> concrete Application
```

---

## 36. Dependency Validation

Useful dependency checks include:

```bash
git grep -n "@/application/" -- src/template
```

This should remain empty because Template must not import concrete Application implementation.

Application code should use supported Template APIs instead of arbitrary Template internals.

A useful review command is:

```bash
git grep -n "@/template/" -- src/application
```

Unexpected direct Template imports should be reviewed against the supported integration API.

---

## 37. Validation

Architecture-related changes should normally be validated with:

```bash
npm run config:generate
npx tsc --noEmit
npm test -- --runInBand
git diff --check
git status --short
```

Configuration generation should run before TypeScript validation when relevant developer-facing configuration has changed.

---

## 38. Development Workflow

Architecture changes should remain small and reviewable.

Recommended workflow:

1. Verify current ownership.
2. Verify actual source dependencies.
3. Make the smallest coherent change.
4. Regenerate Application configuration where required.
5. Run TypeScript validation.
6. Run affected tests.
7. Run architecture dependency checks.
8. Run `git diff --check`.
9. Review `git status --short`.
10. Commit a coherent completed state.

Broad automatic rewrites across unrelated files should be avoided.

---

## 39. Success Criteria

The Application separation is successful when:

1. Template does not import concrete Application implementation.
2. Core imports neither Template nor Application code.
3. Agent.Workbench standard functionality remains correctly owned by Template.
4. A concrete Application can configure itself without modifying Template internals.
5. A concrete Application can enable reusable Template features semantically.
6. Applications do not need to know Template internal menu IDs.
7. Applications can provide Application-specific navigation extensions.
8. Applications can provide their own screens without Template imports.
9. Application screens are automatically discovered.
10. Applications can optionally provide their own Redux state.
11. Agent.Workbench state remains Template-owned.
12. Concrete product state does not replace Template-owned reducer keys.
13. Developer-facing configuration remains properties-based.
14. HEMS can consume the same Base Template through the supported contract.
15. A future concrete Application can be created without changing internal Base Template implementation.
16. Repository dependency boundaries remain enforceable and testable.

---

## 40. Current Separation Summary

The current architecture is:

```text
Application --> Template --> Core
```

Core provides reusable technical capabilities.

Template provides the reusable application platform.

Standard Agent.Workbench functionality belongs to Template.

The current `src/application/` directory is the in-repository Agent.Workbench Application composition.

HEMS is a concrete Application.

Developer-facing Application configuration uses:

```text
application.properties
features.properties
navigation.properties
```

Template owns reusable navigation implementation, internal navigation IDs, visibility rules and Agent.Workbench navigation.

Application navigation extends Template navigation instead of replacing it.

Application screens are automatically discovered.

Template owns reusable Redux infrastructure and Agent.Workbench state.

Application-specific Redux state is optional.

A separate Agent.Workbench Application repository is not part of the current architecture.

Future consumer work should validate the existing Base Template contract rather than reopen the Agent.Workbench ownership decision.
