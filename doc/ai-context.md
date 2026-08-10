# AI Context for EnFlexIT/web.template

> **Purpose**
>
> This document is the primary project context for AI assistants working on
> the `EnFlexIT/web.template` repository.
>
> It describes the current architecture, migration rules, development
> workflow, important modules, transitional areas, and open decisions.

## 1. Project Overview

`web.template` is an Expo, React Native Web, and TypeScript foundation for
EnFlex.IT applications.

The repository is currently being refactored into a reusable Base Template
that can be consumed by separate application repositories such as:

- Agent.Workbench
- HEMS
- Future EnFlex.IT applications

The Base Template provides reusable technical and application-shell
infrastructure.

Concrete applications provide their own configuration, product-specific
screens, state, branding, build configuration, and deployment configuration.

---

## 2. Architecture

The required dependency direction is:

```text
Application --> Template --> Core
```

The following directions are not allowed:

```text
Template --> Application
Core --> Template
Core --> Application
```

### Core

`src/core` contains reusable technical capabilities and shared technical
types.

Core may contain:

- Authentication transport logic
- Session-related technical mechanisms
- Server validation
- Networking helpers
- Storage-related technical capabilities
- Reusable update logic
- Shared technical types
- Technical utilities

Core must not import from Template or Application.

Core should not contain product-specific UI, product composition, or
application-specific business behavior.

### Template

`src/template` contains the reusable application shell, reusable UI,
navigation mechanisms, Template-owned state, and reusable feature
infrastructure.

Template may contain:

- Design system
- Header and footer
- Navigation engine
- Reusable screens
- Authentication UI
- Session guards
- Notifications
- Localization
- Theme handling
- Server-selection UI and state
- Redux infrastructure
- Update infrastructure
- Reusable hooks
- Configuration contracts

Template may import from Core.

Template must not directly import a concrete application.

### Application

`src/application` represents the concrete product composition.

Application may contain:

- Application identity
- Application configuration
- Product-specific screens
- Product-specific Redux state
- Product-specific navigation definitions
- Product-specific feature rules
- Branding
- Product-specific extensions
- Build configuration
- Deployment configuration

Application may use Template and Core.

---

## 3. Repository Model

The target repository model is:

```text
Agent.Workbench ----\
                     +--> Base Template --> Core
HEMS ----------------/
```

There is no central runtime resolver that switches between
Agent.Workbench and HEMS.

Each application repository consumes the Base Template directly.

The Base Template must therefore be reusable without knowing which
concrete application uses it.

---

## 4. Current Source Structure

The important architectural structure is:

```text
src/
+-- api/
|
+-- application/
|   +-- config/
|   +-- generated/
|   +-- state/
|   +-- screens/
|   +-- branding/
|   +-- index.ts
|
+-- core/
|
+-- template/
    +-- application/
    +-- authentication/
    +-- components/
    +-- config/
    +-- hooks/
    +-- navigation/
    +-- screens/
    +-- state/
    +-- styles/
    +-- update/
    +-- index.ts
```

The repository is still transitional.

Some Agent.Workbench-specific code remains physically inside the current
repository until the separate Agent.Workbench repository is created.

---

## 5. Current Architecture Status

### Implemented

The following foundations are already implemented:

- `core`, `template`, and `application` architecture direction
- Design system under `src/template/components/design-system`
- Public design-system alias `@design-system`
- Reusable Template hooks under `src/template/hooks`
- Navigation infrastructure under `src/template/navigation`
- Template Redux state under `src/template/state`
- Store infrastructure under `src/template/state/store`
- `ApplicationConfig`
- `createTemplateApp`
- `ApplicationConfigContext`
- `ApplicationConfigProvider`
- `useApplicationConfig`
- Property-based application identity
- Application configuration generator
- Generated typed application configuration
- Automatic configuration generation through npm lifecycle scripts
- Removal of direct Template UI access to
  `EXPO_PUBLIC_APPLICATION_TITLE`
- `ApplicationReducers` extension contract
- `templateReducers`
- `createTemplateStore`
- Reducer-key collision protection
- Store factory tests
- Application-side reducer registry
- Update watchers under the Template update infrastructure
- Jest tests under `test/`

### Transitional

The following areas are intentionally transitional:

- `TemplateApp` still uses the existing active Redux store.
- The new `createTemplateStore` factory is not yet the active runtime store.
- Application reducers are not yet passed through `createTemplateApp`.
- Agent.Workbench-specific reducers are still physically located inside the
  current repository.
- Agent.Workbench-specific screens remain inside the current repository.
- Some navigation definitions are still product-specific but located inside
  the Template repository.
- `apiSlice.tsx` still combines several responsibilities.
- Final ownership of some developer tools and settings features remains open.
- Concrete API-client ownership between Template and Application is not yet
  finalized.

### Planned

Planned architecture work includes:

- Menu configuration through properties
- Menu feature flags through properties
- Tab configuration through properties
- Tab feature flags through properties
- Layout configuration
- Cookie configuration
- Additional branding and legal metadata
- Final extensible Redux integration
- Final combined Template/Application state typing
- Stable public Base Template package API
- Agent.Workbench repository extraction
- HEMS integration
- Independent application builds and deployments
- Independent Base Template release workflow

---

## 6. Application Configuration

Application developers configure application identity through:

```text
src/application/config/application.properties
```

Example:

```properties
ApplicationId=agent-workbench
ApplicationTitle=Agent.Workbench
ApplicationLogo=../assets/bild.png
ApplicationContact=admin@xxx
ApplicationOwner=EnFlex.IT

LegalImprintCompanyHomepage=
LegalImprintCompanyName=
LegalImprintEmail=admin@xxx
```

The developer-facing configuration should remain simple.

Standard application metadata should not require developers to edit JSON,
JavaScript, or TypeScript configuration files.

Currently, the generator maps at least:

```text
ApplicationId    --> ApplicationConfig.id
ApplicationTitle --> ApplicationConfig.displayName
```

Additional properties will be added incrementally when their typed contracts
and consumers are implemented.

---

## 7. Configuration Generation

The current configuration flow is:

```text
application.properties
        |
        v
generateApplicationConfig.mjs
        |
        v
applicationConfig.generated.ts
        |
        v
createTemplateApp(applicationConfig)
        |
        v
ApplicationConfigProvider
        |
        v
Base Template
```

The generator currently lives at:

```text
src/template/config/build/generateApplicationConfig.mjs
```

The generated configuration is written to:

```text
src/application/generated/applicationConfig.generated.ts
```

Application developers should edit the `.properties` source file.

The generated TypeScript configuration should not be edited manually.

A dedicated root-level `scripts/` directory is not part of the intended
architecture.

---

## 8. Planned Configuration Files

The application configuration area is planned to grow incrementally.

Target structure:

```text
src/application/config/
+-- application.properties
+-- menu.properties
+-- menuFeatureFlags.properties
+-- tabs.properties
+-- tabFeatureFlags.properties
+-- cookies.properties
+-- layout.properties
```

Current status:

```text
application.properties          implemented
menu.properties                 planned
menuFeatureFlags.properties     planned
tabs.properties                 planned
tabFeatureFlags.properties      planned
cookies.properties              planned
layout.properties               planned
```

Do not invent the formats of the planned property files before their
contracts are agreed and implemented.

---

## 9. Application Startup

The root entry point creates the Template application from the concrete
application configuration.

Conceptually:

```ts
import {
  applicationConfig,
} from "./src/application";

import {
  createTemplateApp,
} from "./src/template/application/createTemplateApp";

const App = createTemplateApp(applicationConfig);
```

There is no multi-application resolver inside the Template.

The concrete application provides its configuration directly.

---

## 10. Development Start Commands

Application configuration is generated automatically when using the normal
npm entry points:

```bash
npm start
npm run web
npm run android
npm run ios
```

The npm lifecycle hook runs:

```bash
npm run config:generate
```

before Expo starts.

The configuration can also be generated manually:

```bash
npm run config:generate
```

Do not use this as the normal start command when configuration may have
changed:

```bash
npx expo start
```

Running Expo directly bypasses the npm lifecycle hooks and therefore does not
automatically regenerate the application configuration.

For a cleared Expo cache while preserving the npm lifecycle hooks, use:

```bash
npm start -- --clear
```

---

## 11. Design System

Reusable UI lives under:

```text
src/template/components/design-system/
```

Important groups include:

```text
icons/
stylistic/
themed/
ui-elements/
```

Preferred public import:

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

Avoid introducing duplicate components with overlapping responsibilities.

---

## 12. Navigation

The Template owns the navigation mechanism.

Important areas include:

```text
src/template/navigation/menu/
src/template/navigation/tabs/
```

Template navigation responsibilities include:

- Menu tree construction
- Routing
- Menu rendering
- Path calculation
- Tab rendering
- Feature-rule evaluation
- Dynamic and static navigation composition

The concrete Application should eventually provide:

- Concrete menu definitions
- Concrete tab definitions
- Concrete screens
- Menu feature rules
- Tab feature rules

The planned developer-facing configuration includes:

```text
menu.properties
menuFeatureFlags.properties
tabs.properties
tabFeatureFlags.properties
```

These files are planned and are not yet the active navigation source.

---

## 13. Redux

Redux is a state-management technology and not an architecture layer.

State must be located according to responsibility.

General rule:

```text
Reusable technical capability --> Core
Reusable application state     --> Template
Concrete product state         --> Application
```

The previous generic `src/redux` structure is no longer the target
architecture.

The important store infrastructure now lives under:

```text
src/template/state/store/
```

Important files include:

```text
createTemplateStore.ts
rootReducer.ts
store.ts
templateReducers.ts
types.ts
useAppDispatch.ts
useAppSelector.ts
```

---

## 14. Current Redux Runtime

The existing active runtime still uses:

```text
src/template/state/store/store.ts
src/template/state/store/rootReducer.ts
```

`TemplateApp` still provides this current store to React Redux.

The new store factory exists in parallel and must not replace the active store
until its remaining integration and typing issues are resolved.

Do not reconnect the store through a broad rewrite.

---

## 15. Extensible Redux Store

The reusable factory is:

```text
src/template/state/store/createTemplateStore.ts
```

The Base Template reducer registry is:

```text
src/template/state/store/templateReducers.ts
```

The extension contract is:

```text
ApplicationReducers
```

The concrete application reducer registry is currently:

```text
src/application/state/applicationReducers.ts
```

Conceptually:

```text
templateReducers
        +
applicationReducers
        |
        v
createTemplateStore
        |
        v
Redux store
```

The store factory prevents application reducers from overriding
Template-owned reducer keys.

---

## 16. Agent.Workbench Transitional State

Known Agent.Workbench-specific state still physically located inside the
current repository includes:

```text
src/template/state/agent-workbench/
```

Examples include:

```text
execSettingsSlice.tsx
dataAnalysisSlice.ts
dataAnalyzingConstants.ts
```

Known Agent.Workbench-specific screens include:

```text
src/template/screens/AgentWorkbenchOptions/
```

Related functionality includes:

- Program Start
- Data Analyzing
- Exec Settings
- Data Analysis state
- Menu ID 3023
- Agent.Workbench-specific tabs
- `SERVER_MASTER` visibility rules

These areas should eventually move together into the Agent.Workbench
application repository.

Do not move individual files without reviewing their navigation, state, API,
and screen dependencies.

---

## 17. Redux Typing

Typed Redux hooks currently live under:

```text
src/template/state/store/
```

Important files include:

```text
useAppDispatch.ts
useAppSelector.ts
```

Use type-only imports for Redux state types when they are required only by
TypeScript.

Preferred form:

```ts
import type {
  RootState,
} from "@/template/state/store/store";
```

The final extensible state model must support:

```text
Template state
+
Application-specific state
```

without requiring the Base Template to import concrete application reducers.

---

## 18. Authentication

Authentication is split according to responsibility.

Conceptually:

```text
Core
+-- technical authentication capability
+-- transport
+-- shared technical types
+-- reusable technical session logic

Template
+-- authentication UI
+-- session guards
+-- reusable authentication state
+-- application shell integration

Application
+-- product-specific authentication configuration
```

Do not move authentication as one monolithic feature.

A module belongs to a layer according to its actual responsibility and
dependencies.

Some authentication and API-related typing remains transitional and should be
reviewed before further movement.

---

## 19. Server Management

Reusable technical server logic belongs in Core where it has no Template
dependency.

Reusable server state and UI integration belong in Template.

Conceptually:

```text
Technical server capability --> Core
Reusable server UI/state    --> Template
Product server definition   --> Application
```

Important Template state areas include:

```text
src/template/state/server/
src/template/state/connectivity/
```

Connectivity checks should determine backend reachability.

They must not implicitly perform unrelated logout behavior.

---

## 20. Update Infrastructure

Reusable update infrastructure belongs to the Template unless the logic is
purely technical and independent of Template UI.

Runtime update watchers currently live under:

```text
src/template/update/watchers/
```

Examples include:

```text
PostLoginUpdateWatcher.tsx
UpdateNotificationWatcher.tsx
```

Update-related Template Redux state lives under:

```text
src/template/state/update/
```

Pure technical reload/update utilities may belong to Core when they have no
Template dependencies.

Do not document the historical
`src/application/bootstrap/watchers` path as the current location.

---

## 21. API

The existing API area remains:

```text
src/api/
+-- definition/
+-- implementation/
+-- ...
```

Generated API clients live under:

```text
src/api/implementation/
```

Known generated clients include:

```text
AWB-RestAPI/
Dynamic-Content-Api/
```

Do not manually refactor or reformat generated API code as part of general
architecture cleanup.

The final ownership of concrete API clients between Template and Application
is still under review.

---

## 22. Localization

Translations live under:

```text
assets/locales/
```

German and English are currently supported.

Prefer existing translation infrastructure and existing feature namespaces.

Do not hard-code user-visible text when the surrounding feature already uses
i18next.

---

## 23. Public APIs and Aliases

Important aliases include:

```text
@core
@template
@application
@design-system
@
```

The root alias maps:

```text
@/* --> src/*
```

Long-term, separate application repositories should consume the Base Template
through an explicit public API instead of arbitrary internal Template paths.

Target usage is approximately:

```ts
import {
  createTemplateApp,
  type ApplicationConfig,
  type ApplicationReducers,
} from "@enflex/web-template";
```

Only supported contracts, functions, components, types, and extension
interfaces should be exported publicly.

---

## 24. Working Method

Architecture work must be done in small, verifiable batches.

For each change:

1. Search all usages before moving or deleting anything.

   ```bash
   git grep -n "<name-or-path>" -- .
   ```

2. Inspect the owning responsibility and current imports.

3. Move or modify only one coherent group.

4. Update imports explicitly.

5. Search again for stale paths.

6. Run TypeScript validation.

   ```bash
   npx tsc --noEmit
   ```

7. Run targeted Jest tests.

   ```bash
   npx jest --runTestsByPath <test-file>
   ```

8. Validate the patch.

   ```bash
   git diff --check
   ```

9. Start the application when runtime behavior is affected.

   ```bash
   npm start
   ```

10. Review the working tree.

   ```bash
   git status --short
   ```

11. Commit the completed batch.

Do not wait for Metro to reveal stale imports one at a time.

---

## 25. Refactoring Safety Rules

AI assistants must:

- Inspect existing implementations before changing them.
- Respect `Application --> Template --> Core`.
- Preserve runtime behavior during architecture moves.
- Search all references before moving files.
- Prefer small coherent batches.
- Use stable aliases where appropriate.
- Reuse existing components, hooks, selectors, services, and utilities.
- Keep generated API code untouched unless explicitly required.
- Update tests and documentation when architecture changes.
- Clearly distinguish implemented, transitional, and planned architecture.
- Verify store changes with tests before connecting them to runtime.
- Review product-specific screens, state, navigation, and APIs together when
  extracting a feature.

Avoid:

- Broad file-rewrite scripts.
- Broad formatting across unrelated source files.
- Duplicate utilities.
- Duplicate URL-normalization implementations.
- Upward imports.
- Moving mixed-responsibility modules only to make folders look cleaner.
- Introducing a Template-to-Application dependency.
- Reintroducing a central application resolver.
- Creating a root-level `scripts/` architecture.
- Replacing the active Redux store before the parallel store factory is ready.
- Editing generated API clients during unrelated architecture work.

---

## 26. Documentation Strategy

`README.md` should remain a concise entry point.

Detailed documentation belongs in `doc/`.

Important documentation includes:

```text
application-separation.md
project-structure.md
redux-state-management.md
authentication.md
server-check-and-switching.md
update-system.md
components.md
release-workflow.md
architecture/
```

Documentation must always distinguish:

```text
Implemented
Transitional
Planned
Open
```

Do not document planned architecture as if it were already active.

Documentation paths must be updated when code moves.

---

## 27. Commit Convention

Examples:

```text
feat(login): add OpenID redirect
fix(update): prevent duplicate update check
docs: update layered architecture
refactor(state): move notification state into template
refactor: load application identity from properties config
```

Keep architecture batches focused.

Do not mix unrelated formatting or generated-code changes into architecture
commits.

---

## 28. Current Roadmap

### Immediate

1. Keep architecture documentation synchronized with the current code.
2. Complete documentation cleanup and remove obsolete paths.
3. Extend property-based configuration incrementally.
4. Define menu and tab configuration contracts.
5. Continue the Redux integration only in safe, tested steps.
6. Finalize combined Template/Application Redux typing.
7. Review Agent.Workbench-specific screen and state ownership.
8. Review concrete API-client ownership.

### Next Architecture Phase

1. Connect application reducers to application creation.
2. Make the extensible store factory the active runtime store.
3. Finalize the public Base Template API.
4. Add or maintain automated dependency-boundary checks.
5. Prepare the physical Agent.Workbench repository extraction.
6. Validate the Base Template independently.

### Future Platform Capabilities

Possible future capabilities include:

- Property-based application configuration
- Property-based navigation configuration
- Dynamic branding
- Additional application metadata
- Independent application builds
- Independent deployment configuration
- Central Base Template releases

Do not assume an application registry or multi-application runtime resolver
unless that architecture is explicitly changed in the future.

---

## 29. Open Ownership Decisions

The final ownership of some features still requires architectural review.

Examples include:

```text
Live Console
Developer Console
Database Connections
Server Settings
Dynamic Content
Backend Update
Settings File Upload
Concrete API Clients
General Settings
User Profile
```

Do not move these areas solely based on their current physical folder.

Ownership must be determined from responsibility and reusability.

---

## 30. Prompt for a New AI Conversation

```text
I am working on the EnFlexIT/web.template repository.

Use doc/ai-context.md as the primary project context.

Respect this dependency direction:

Application --> Template --> Core

Important current architecture rules:

- The Base Template must not import a concrete application.
- Core must not import Template or Application.
- Applications use property-based developer-facing configuration.
- There is no central multi-application resolver.
- Redux state belongs to its owning architectural responsibility.
- createTemplateStore exists but is not yet the active runtime store.
- Agent.Workbench-specific state and screens are still transitional.
- Generated API clients must not be modified during unrelated refactoring.
- Use npm start instead of direct npx expo start when configuration may have
  changed.

Before changing code:

1. Search all references.
2. Inspect current ownership and dependencies.
3. Make one small coherent change.
4. Update imports explicitly.
5. Search for stale paths.
6. Run TypeScript validation.
7. Run targeted tests.
8. Run git diff --check.
9. Start the application when runtime behavior changes.
10. Update documentation when paths or responsibilities change.

Current task:

[INSERT CURRENT TASK HERE]
```