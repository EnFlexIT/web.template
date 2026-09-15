# AI Context for EnFlexIT/web.template

> **Purpose**
>
> This document is the primary project context for AI assistants working on
> the `EnFlexIT/web.template` repository.
>
> It describes the current architecture, ownership rules, configuration model,
> development workflow and important implementation boundaries.
>
> The architecture described here is implemented and selected.
> Do not reopen already-decided architecture questions unless explicitly asked.

---

## 1. Project Overview

`web.template` is an Expo, React Native Web and TypeScript foundation for
EnFlex.IT applications.

The repository provides:

* reusable technical capabilities through Core
* a reusable Base Template
* standard Agent.Workbench functionality as part of the Base Template
* the in-repository Agent.Workbench Application composition that validates the Application integration
  contract

The architecture is:

```text
Application --> Template --> Core
```

Agent.Workbench is **not** a separate concrete Application in the current
architecture.

Standard Agent.Workbench functionality belongs to the Base Template.

HEMS is an example of a concrete Application that can consume the Base
Template.

---

## 2. Architectural Dependency Rules

The allowed dependency direction is:

```text
Application
    |
    v
Template
    |
    v
Core
```

The following dependency directions are not allowed:

```text
Template --> concrete Application
Core --> Template
Core --> Application
```

### Core

`src/core/` contains reusable technical capabilities.

Core may contain:

* technical authentication logic
* technical session mechanisms
* server validation
* networking helpers
* reusable runtime capabilities
* technical update logic
* reusable technical types
* technical utilities

Core must not import Template or Application.

Core should not contain:

* React application-shell composition
* Template navigation
* Template UI
* Agent.Workbench composition
* concrete product behavior

### Template

`src/template/` contains the reusable application platform.

Template may contain:

* reusable React application shell
* standard Agent.Workbench functionality
* Agent.Workbench state
* reusable Agent.Workbench API integration where appropriate
* Application integration contracts
* navigation infrastructure
* Template navigation definitions
* Template screen registry
* authentication/session orchestration
* server selection
* settings
* notifications
* update orchestration
* design system
* reusable screens
* reusable components
* reusable hooks
* localization infrastructure
* Redux infrastructure

Template may import Core.

Template must not import a concrete Application.

### Application

`src/application/` represents concrete product composition.

The current repository uses this area as the in-repository Agent.Workbench Application composition.

Application may contain:

* Application identity and metadata
* Template feature selection
* Application-specific navigation
* Application-specific screens
* Application translations
* optional Application-specific Redux state
* product-specific behavior
* product-specific branding

Application may consume supported Template and Core integration surfaces.

---

## 3. Agent.Workbench Ownership

This is a final architecture decision unless explicitly changed later.

```text
Agent.Workbench standard functionality
    --> Base Template
```

Agent.Workbench is not treated as:

```text
a concrete Application
a transitional Application
a future separate Application repository
```

Standard Agent.Workbench functionality includes, where applicable:

```text
Program Start
Data Analyzing
Database configuration
Server configuration
Live Console
Settings
Agent.Workbench state
Agent.Workbench navigation
Agent.Workbench API integration
```

Do not propose moving these areas into a separate Agent.Workbench repository
only because they contain Agent.Workbench-specific naming.

Ownership is based on the selected platform architecture and responsibility.

---

## 4. Concrete Applications

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

A concrete consumer Application may provide:

```text
Application configuration
Template feature selection
Application navigation extensions
Application-specific screens
Application translations
optional Application-specific Redux state
product-specific business behavior
product-specific branding
product-specific build/deployment configuration
```

Future Applications should follow the same general model.

There is no required separate Agent.Workbench Application repository.

---

## 5. Current Source Structure

The important architectural structure is:

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

The architectural boundary is based on responsibility, not only on physical
file location.

---

## 6. Current Agent.Workbench Application Composition

`src/application/` is currently the in-repository Agent.Workbench Application composition.

It is not Agent.Workbench.

Important areas include:

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

The current Agent.Workbench Application composition exists to validate that a concrete product can
configure and extend the Base Template through supported integration
mechanisms.

---

## 7. Developer-Facing Application Configuration

Application developers should not need to edit TypeScript, TSX, JavaScript or
JSON configuration files for normal Application configuration.

The active developer-facing configuration files are:

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

Generated TypeScript is allowed as build/runtime output.

Generated TypeScript is not the developer-facing configuration format.

---

## 8. Legacy Configuration Names

The following old configuration names are not part of the current
architecture:

```text
menu.properties
tabs.properties
featureFlags.properties
menuFeatureFlags.properties
tabFeatureFlags.properties
```

Do not reintroduce these files as planned configuration.

The active model is:

```text
application.properties
features.properties
navigation.properties
```

---

## 9. Application Identity

Application identity is Application-owned.

Template receives required identity values through the formal Application
integration contract.

Typical runtime values include:

```text
id
displayName
```

Do not introduce new direct product-specific environment dependencies inside
Template UI when the value belongs to Application configuration.

Before extending `ApplicationConfig`, ask:

```text
Does Template actually need this value?
```

If not, keep the value Application-owned.

---

## 10. Semantic Feature Selection

Reusable Template functionality is selected through:

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

Application selects capabilities.

Template owns their implementation.

Applications must not need to know internal Template details such as:

```text
numeric menu IDs
internal parent IDs
Template screen registry keys
authentication visibility rules
runtime visibility rules
Agent.Workbench navigation internals
```

---

## 11. Navigation

Template owns reusable navigation infrastructure and reusable Template
navigation definitions.

Application owns only concrete Application navigation extensions.

Conceptually:

```text
Template navigation
        +
Application navigation extensions
        |
        v
runtime navigation
```

Template responsibilities include:

* menu tree construction
* routing
* path calculation
* menu rendering
* Template feature navigation
* Template screen registry
* Agent.Workbench navigation
* visibility integration
* Template menu ordering

Application-specific navigation is configured through:

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

Applications do not maintain internal Template numeric IDs.

Custom IDs are generated or resolved internally.

---

## 12. Template Menu Ordering

Normal Template menu positions are derived automatically from sibling order in
the Template menu catalog.

Do not introduce manually maintained numeric positions for normal Template
menu entries unless there is a concrete need.

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

## 13. Automatic Application Screen Discovery

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

Do not require concrete Applications to manually register every screen inside
Template.

Template must not import concrete Application screen implementations.

---

## 14. Application Integration Contract

The reusable Template integration layer exists under:

```text
src/template/application/
```

Important files include:

```text
ApplicationConfig.ts
ApplicationConfigContext.tsx
createTemplateApp.tsx
TemplateApp.tsx
```

Conceptually:

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

The Application supplies concrete composition.

Template supplies the reusable application platform.

---

## 15. No Runtime Application Resolver

Do not introduce a central runtime resolver inside Template.

Incorrect:

```text
Template
|
+-- detect Agent.Workbench
+-- detect HEMS
+-- select product
```

Correct:

```text
Concrete Application
        |
        v
Base Template
```

Agent.Workbench does not participate in such product selection because its
standard functionality is already part of the Base Template.

---

## 16. Configuration Generation

Developer-facing `.properties` files are transformed into runtime artifacts.

Conceptually:

```text
Application .properties
        |
        v
configuration tooling
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

Configuration tooling exists under:

```text
src/template/config/build/
```

A central generator is:

```text
generateApplicationConfig.mjs
```

The explicit generation command is:

```bash
npm run config:generate
```

Generated files should not be edited manually as normal Application
configuration.

---

## 17. Application Startup

Use the normal npm entry points:

```bash
npm start
npm run web
npm run android
npm run ios
```

Configuration can be generated manually with:

```bash
npm run config:generate
```

When Application configuration may have changed, prefer npm lifecycle commands
rather than invoking Expo directly.

For a cleared Expo cache while preserving the npm lifecycle path:

```bash
npm start -- --clear
```

---

## 18. Redux Architecture

Redux is not an architecture layer.

State belongs to the architectural area that owns the responsibility.

The ownership rule is:

```text
Reusable Template state
    -> Template

Agent.Workbench standard state
    -> Template

Concrete product-specific state
    -> Application
```

Reusable Redux infrastructure exists under:

```text
src/template/state/
src/template/state/store/
```

Known store infrastructure includes:

```text
createTemplateStore.ts
rootReducer.ts
store.ts
templateReducers.ts
types.ts
useAppDispatch.ts
useAppSelector.ts
```

Do not infer architectural ownership from Redux technology alone.

---

## 19. Agent.Workbench Redux State

Agent.Workbench state is intentionally Template-owned.

Known area:

```text
src/template/state/agent-workbench/
```

Examples include functionality associated with:

```text
execSettings
dataAnalysis
Program Start
Data Analyzing
```

This state is not transitional Application state.

Do not propose:

```text
moving Agent.Workbench reducers into src/application
registering Agent.Workbench reducers as Application reducers
creating a separate Agent.Workbench state repository
```

unless the architecture decision itself is explicitly changed.

---

## 20. Application Redux Extension

Concrete Applications may optionally provide their own Redux state.

The Application extension point is:

```text
src/application/state/applicationReducers.ts
```

The current Agent.Workbench Application composition does not require meaningful
Application-specific Redux state.

An essentially empty `applicationReducers.ts` is therefore valid.

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

Application reducers must not silently override Template-owned reducer keys.

---

## 21. Redux Typing

Typed Redux hooks belong to Template store infrastructure.

Known files include:

```text
src/template/state/store/useAppDispatch.ts
src/template/state/store/useAppSelector.ts
```

Use type-only imports when a state type is needed only by TypeScript.

Example:

```ts
import type {
  RootState,
} from "@/template/state/store/store";
```

Template typing must remain independent from concrete consumer Applications.

---

## 22. Design System

Reusable UI belongs to Template.

The design system exists under:

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

Preferred public import where supported:

```ts
import {
  ActionButton,
  Card,
  ConfirmDialog,
  ThemedText,
} from "@design-system";
```

Before creating a new reusable UI component, search the existing design
system first.

Avoid duplicate components with overlapping responsibilities.

---

## 23. Authentication

Authentication is split by responsibility.

```text
Core
+-- technical authentication capabilities
+-- transport
+-- technical types
+-- technical session helpers

Template
+-- authentication UI
+-- session guards
+-- reusable authentication state
+-- application-shell integration

Application
+-- concrete product-specific behavior where required
```

Do not move authentication as one monolithic feature.

Inspect actual dependencies before changing ownership.

---

## 24. Server Management

Reusable technical server logic belongs to Core where it has no Template
dependency.

Reusable server state and UI belong to Template.

Conceptually:

```text
Technical server capability
    -> Core

Reusable server UI/state
    -> Template

Product-specific server configuration
    -> Application
```

Known Template state areas include:

```text
src/template/state/server/
src/template/state/connectivity/
```

Do not mix connectivity checks with unrelated logout behavior unless explicitly
required by the existing design.

---

## 25. Update Infrastructure

Reusable update infrastructure is split by responsibility.

```text
Core
    technical update capabilities

Template
    reusable update state
    hooks
    watchers
    dialogs
    notifications
    orchestration

Application
    product-specific behavior only when genuinely required
```

Known Template watcher area:

```text
src/template/update/watchers/
```

Do not restore obsolete historical paths without checking the current source.

---

## 26. Developer Tools and Settings

Under the current architecture, reusable developer tools and standard
Agent.Workbench settings belong to Template when they are part of the Base
Template platform.

Examples include:

```text
Developer Console
Live Console
Server Settings
Database-related standard functionality
General reusable settings
```

Do not treat these features as automatically Application-owned simply because
they are useful to Agent.Workbench.

If ownership is uncertain for a specific module, inspect its current
responsibility and usages before moving it.

Do not guess.

---

## 27. API Ownership

The repository contains API definitions and implementations under:

```text
src/api/
```

Generated API clients must not be manually reformatted or rewritten during
unrelated architecture work.

API ownership follows responsibility:

```text
generic technical communication
    -> Core where appropriate

reusable Base Template / Agent.Workbench API integration
    -> Template where appropriate

concrete product business API
    -> Application
```

Do not assume that every API containing an Agent.Workbench name is
Application-owned.

Inspect how the API is used before changing ownership.

---

## 28. Localization

Translations live under:

```text
assets/locales/
```

Use existing i18next infrastructure.

Do not hard-code user-visible text when the surrounding feature already uses
translations.

Concrete Application translations belong to Application composition.

Reusable Template translations remain Template-owned.

---

## 29. Public APIs and Aliases

Known aliases include:

```text
@core
@template
@application
@design-system
@
```

The root alias maps source paths according to the project TypeScript
configuration.

Concrete Applications should prefer supported Template integration surfaces
instead of arbitrary deep imports into Template implementation.

Before introducing or changing a public API, inspect existing exports.

Do not invent package exports that do not exist.

---

## 30. Dependency Validation

Useful architecture checks include:

```bash
git grep -n "@/application/" -- src/template
```

This should remain empty because Template must not import concrete Application
implementation.

Application-side imports can be reviewed with:

```bash
git grep -n "@/template/" -- src/application
```

Unexpected deep Template imports should be reviewed against supported public
integration surfaces.

Do not automatically conclude that every matching import is wrong.
Inspect the actual public API and current code.

---

## 31. Working Method

Architecture work must be performed in small, verifiable batches.

For each change:

1. Search all usages before moving, renaming or deleting anything.

   ```bash
   git grep -n "<name-or-path>" -- .
   ```

2. Inspect the current implementation.

3. Determine architectural ownership from responsibility.

4. Make the smallest coherent change.

5. Update imports explicitly.

6. Search again for stale paths.

7. Generate configuration when relevant.

   ```bash
   npm run config:generate
   ```

8. Run TypeScript validation.

   ```bash
   npx tsc --noEmit
   ```

9. Run affected tests.

10. Validate the patch.

```bash
git diff --check
```

11. Review the working tree.

```bash
git status --short
```

12. Start the application when runtime behavior is affected.

Do not wait for runtime tooling to reveal stale imports one at a time.

---

## 32. Refactoring Safety Rules

AI assistants must:

* inspect existing implementations before changing them
* respect `Application --> Template --> Core`
* preserve runtime behavior
* search all references before moving files
* prefer small coherent batches
* reuse existing components, hooks, selectors, services and utilities
* keep generated API code untouched unless explicitly required
* update documentation when architecture changes
* verify uncertain implementation details with `git grep`, `Get-Content` or
  `Get-ChildItem`
* distinguish known current behavior from assumptions
* keep Agent.Workbench standard functionality Template-owned
* keep concrete product functionality Application-owned

Avoid:

* broad automatic file-rewrite scripts
* unrelated formatting changes
* duplicate utilities
* duplicate URL-normalization implementations
* upward dependencies
* Template-to-Application imports
* central runtime Application resolvers
* unnecessary new configuration files
* reintroducing legacy configuration names
* moving Agent.Workbench functionality solely because of its name
* editing generated API clients during unrelated work
* claiming a runtime integration state without verifying the code

---

## 33. PowerShell Rules

Development is performed on Windows with PowerShell and VS Code.

When providing PowerShell commands:

* do not include the `PS C:\...>` prompt
* provide only the command itself
* prefer simple individual commands
* use `-Encoding UTF8` with `Get-Content`
* avoid large automated rewrite scripts
* prefer small safe changes
* verify after major changes

Example:

```powershell
Get-Content ".\doc\architecture\05-current-state.md" -Encoding UTF8
```

---

## 34. Documentation Rules

Documentation is written in English.

Explanations to the developer may be written in German.

The current architecture must be described consistently as:

```text
Application --> Template --> Core
```

Do not reintroduce these obsolete statements:

```text
Agent.Workbench is a concrete Application.

Agent.Workbench is transitional inside Template.

Agent.Workbench requires a separate Application repository.

Agent.Workbench state must move out of Template.

Agent.Workbench screens are Application extraction candidates.

menu.properties is planned configuration.

tabs.properties is planned configuration.

featureFlags.properties is planned configuration.

menuFeatureFlags.properties is planned configuration.

tabFeatureFlags.properties is planned configuration.
```

The correct model is:

```text
Agent.Workbench standard functionality
    -> Base Template

HEMS
    -> concrete Application
```

---

## 35. Documentation Set

Important documentation includes:

```text
doc/ai-context.md
doc/application-separation.md
doc/project-structure.md
doc/redux-state-management.md

doc/architecture/00-vision.md
doc/architecture/01-core-platform.md
doc/architecture/05-current-state.md
doc/architecture/application-contract.md
doc/architecture/platform-architecture.md
doc/architecture/decisions/
```

When one architecture document changes, related documents should be checked for
contradictory ownership statements.

Do not create new architecture documentation when an existing document already
covers the topic unless a new document is explicitly justified.

---

## 36. Current Documentation Phase

The current refactoring and known presentation bugfixes have been completed.

The current priority is documentation consistency before new feature work.

The documentation cleanup is aligning all architecture documents around:

```text
Application --> Template --> Core
```

with:

```text
Agent.Workbench standard functionality
    -> Template

HEMS
    -> concrete Application
```

After documentation is consistent, further extension ideas and a separate
HEMS/consumer validation can be addressed.

---

## 37. Validation Commands

Typical validation commands are:

```bash
npm run config:generate
npx tsc --noEmit
npm test -- --runInBand
git diff --check
git status --short
```

Architecture checks include:

```bash
git grep -n "@/application/" -- src/template
git grep -n "@/template/" -- src/application
```

Interpret architecture-check results in context.

Do not modify code merely to make a grep result disappear without confirming
the intended public integration boundary.

---

## 38. Commit Convention

Examples:

```text
feat(login): add OpenID redirect
fix(update): prevent duplicate update check
docs: align architecture documentation
refactor(state): reorganize reusable state
refactor: load application identity from properties config
```

Keep commits focused.

Do not mix unrelated formatting or generated-code changes into architecture
commits.

---

## 39. Current Next Steps

Current priority:

```text
1. Finish architecture documentation cleanup.
2. Remove obsolete Agent.Workbench extraction statements.
3. Remove obsolete configuration references.
4. Ensure Redux documentation reflects Template-owned Agent.Workbench state.
5. Ensure Application documentation reflects semantic feature selection.
6. Review remaining architecture documents and ADRs for contradictions.
7. Validate documentation changes.
```

After documentation cleanup:

```text
1. Discuss next extension ideas.
2. Review remaining implementation improvements.
3. Validate the Base Template with a separate HEMS/consumer scenario.
4. Refine public consumption APIs where required by real consumer usage.
```

Do not start a new Agent.Workbench extraction project.

---

## 40. If Implementation Details Are Unclear

Do not guess.

Use source inspection.

Useful commands include:

```powershell
git grep -n "<search-term>" -- src
```

```powershell
Get-Content ".\path\to\file" -Encoding UTF8
```

```powershell
Get-ChildItem ".\src\some-area" -Recurse
```

For architecture decisions, treat current code plus the current architecture
documentation as the source of truth.

If documentation and implementation conflict, identify the conflict before
changing code.

---

## 41. Prompt for a New AI Conversation

```text
I am working on the EnFlexIT/web.template repository.

Use doc/ai-context.md as the primary project context.

The current architecture is already decided and implemented:

Application --> Template --> Core

Important rules:

- Core contains reusable technical capabilities.
- Core must not import Template or Application.
- Template contains the reusable application platform.
- Template may import Core.
- Template must not import a concrete Application.
- Agent.Workbench standard functionality belongs to Template.
- Agent.Workbench state belongs to Template.
- Agent.Workbench is the current in-repository Application identity/composition, but it is not modeled as a separate consumer Application repository.
- Do not plan a separate Agent.Workbench Application repository.
- HEMS is a concrete Application.
- src/application currently contains the in-repository Agent.Workbench Application composition.
- Developer-facing Application configuration uses:
  application.properties
  features.properties
  navigation.properties
- Do not reintroduce menu.properties, tabs.properties,
  featureFlags.properties, menuFeatureFlags.properties or
  tabFeatureFlags.properties.
- Applications select reusable Template features semantically.
- Template owns internal navigation IDs and visibility rules.
- Application-specific navigation only extends Template navigation.
- Application screens are discovered automatically.
- Application-specific Redux state is optional.
- Do not classify Agent.Workbench state as transitional Application state.
- Generated API clients must not be modified during unrelated refactoring.
- There is no central runtime multi-Application resolver.
- If an implementation detail is unclear, inspect the source instead of
  guessing.

Working method:

1. Search all references.
2. Inspect current ownership and dependencies.
3. Make one small coherent change.
4. Update imports explicitly.
5. Search for stale paths.
6. Run npm run config:generate when relevant.
7. Run npx tsc --noEmit.
8. Run affected tests.
9. Run git diff --check.
10. Review git status --short.
11. Update documentation when ownership or paths change.

Current task:

[INSERT CURRENT TASK HERE]
```
