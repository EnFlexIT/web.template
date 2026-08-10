# Project Structure

This document describes the current structure, architectural boundaries,
and migration status of the `web.template` repository.

`web.template` is an Expo, React Native Web, and TypeScript foundation
for EnFlex.IT applications.

The repository is currently being refactored into a reusable Base
Template that can be consumed by separate application repositories such
as Agent.Workbench and HEMS.

---

## 1. Architecture Model

The target dependency direction is:

```text
Application --> Template --> Core
```

The dependency rules are:

- `application` may use `template` and `core`.
- `template` may use `core`.
- `template` must not depend on concrete application code.
- `core` must not import from `template` or `application`.
- Product-specific composition belongs to `application`.
- Reusable shell UI and reusable feature infrastructure belong to
  `template`.
- Reusable technical capabilities and shared technical types belong to
  `core`.

Redux is a state-management technology and not an architectural layer.

State belongs to the architectural area that owns the corresponding
responsibility.

The migration is incremental. Some Agent.Workbench-specific modules are
still physically located inside the current repository until the
separate application repository is created.

---

## 2. Repository Model

The target repository model consists of one reusable Base Template
repository and separate product application repositories.

```text
Agent.Workbench ----\
                     +--> Base Template --> Core
HEMS ----------------/
```

The Base Template must remain reusable and must not require knowledge of
a concrete product application.

Each application repository is responsible for its own configuration,
composition, screens, state, branding, build, and deployment.

---

## 3. Root Level

Important root-level files and directories include:

```text
.
+-- .github/
+-- assets/
+-- doc/
+-- src/
+-- test/
+-- app.json
+-- i18n.ts
+-- index.ts
+-- jest.config.js
+-- package.json
+-- package-lock.json
+-- tsconfig.json
+-- unistyles.ts
```

| Path | Purpose |
|---|---|
| `.github/` | Repository automation and workflows. |
| `assets/` | Static assets and translation resources. |
| `doc/` | Architecture, feature, workflow, and migration documentation. |
| `src/` | Application, Template, Core, and API source code. |
| `test/` | Jest tests and test setup. |
| `index.ts` | Expo application entry point. |
| `i18n.ts` | Internationalization configuration. |
| `unistyles.ts` | Theme and responsive layout configuration. |
| `jest.config.js` | Jest configuration. |
| `package.json` | Project scripts and dependencies. |
| `tsconfig.json` | TypeScript configuration and aliases. |

A dedicated root-level `scripts/` directory is not part of the intended
architecture.

Build-related configuration tooling currently lives inside the Template
configuration infrastructure.

---

## 4. Current Source Structure

The following tree shows the important architectural structure.

It is intentionally not an exhaustive list of every file.

```text
src/
+-- api/
|
+-- application/
|   +-- config/
|   |   +-- application.properties
|   |
|   +-- generated/
|   |   +-- applicationConfig.generated.ts
|   |
|   +-- state/
|   |   +-- applicationReducers.ts
|   |
|   +-- screens/
|   +-- branding/
|   +-- index.ts
|
+-- core/
|
+-- template/
|   +-- application/
|   +-- authentication/
|   +-- components/
|   +-- config/
|   +-- hooks/
|   +-- navigation/
|   +-- screens/
|   +-- state/
|   +-- styles/
|   +-- update/
|   +-- index.ts
|
+-- ...
```

The repository is still transitional.

Some files outside these main areas may remain until their ownership has
been reviewed and they can be moved safely.

---

## 5. Application Layer

`src/application` represents the concrete product composition.

The application layer owns configuration and product-specific
extensions that must not be hard-coded into the Base Template.

Current important structure:

```text
src/application/
+-- config/
|   +-- application.properties
|
+-- generated/
|   +-- applicationConfig.generated.ts
|
+-- state/
|   +-- applicationReducers.ts
|
+-- screens/
+-- branding/
+-- index.ts
```

### Application responsibilities

The application layer is responsible for:

- Application identity
- Product-specific configuration
- Product-specific branding
- Product-specific screens
- Product-specific Redux state
- Product-specific navigation definitions
- Product-specific feature rules
- Product composition
- Product build configuration
- Product deployment configuration

Not all target responsibilities have already been moved into this layer.

---

## 6. Application Properties

Application developers configure common application identity through:

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

The developer-facing application configuration must remain simple.

Application developers should not need to edit JSON, JavaScript, or
TypeScript files for standard application metadata.

Currently implemented properties include the application ID and display
name.

Additional metadata is present in the property file but is not yet fully
mapped into the typed Template configuration.

---

## 7. Configuration Generation

The developer-facing property file is transformed into a typed
configuration before the application starts.

Current flow:

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

The generated TypeScript file should not be edited manually.

The source of truth for application identity is:

```text
src/application/config/application.properties
```

---

## 8. Planned Application Configuration

Additional developer-facing property files are planned.

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

| Configuration | Status |
|---|---|
| `application.properties` | Implemented |
| `menu.properties` | Planned |
| `menuFeatureFlags.properties` | Planned |
| `tabs.properties` | Planned |
| `tabFeatureFlags.properties` | Planned |
| `cookies.properties` | Planned |
| `layout.properties` | Planned |

The remaining property formats must be introduced incrementally after
their contracts are clearly defined.

---

## 9. Template Layer

`src/template` contains the reusable application shell, reusable UI,
navigation mechanisms, shared feature infrastructure, and Template-owned
state.

Important areas include:

```text
src/template/
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

The Template must provide reusable mechanisms without knowing which
concrete application consumes them.

---

## 10. Template Application Shell

The Template application infrastructure is located under:

```text
src/template/application/
+-- ApplicationConfig.ts
+-- ApplicationConfigContext.tsx
+-- TemplateApp.tsx
+-- createTemplateApp.tsx
```

### ApplicationConfig.ts

Defines the typed contract between an application and the Base Template.

The Template owns the contract.

The application provides the concrete configuration values.

### ApplicationConfigContext.tsx

Provides application identity to reusable Template components.

Template components can access values such as:

```text
id
displayName
```

through:

```ts
useApplicationConfig();
```

This removes the need for Template components to access product-specific
environment variables directly.

### createTemplateApp.tsx

Connects application configuration with the reusable Template shell.

Current usage:

```ts
const App = createTemplateApp(applicationConfig);
```

### TemplateApp.tsx

Provides the reusable runtime application shell.

Responsibilities include:

- Redux provider integration
- Navigation container
- Session protection
- Header and footer
- Global overlays and dialogs
- Notifications
- Update watchers
- Developer console integration
- Reusable application layout

---

## 11. Application Entry Point

The root application entry point is:

```text
index.ts
```

The application is currently started approximately as follows:

```ts
import "./unistyles";
import "./i18n";
import "@expo/metro-runtime";

import { registerRootComponent } from "expo";

import { applicationConfig } from "./src/application";
import { createTemplateApp } from "./src/template/application/createTemplateApp";

const App = createTemplateApp(applicationConfig);

registerRootComponent(App);
```

There is no central runtime application resolver.

A concrete application provides its configuration directly to the Base
Template.

---

## 12. Core Layer

`src/core` contains reusable technical logic and shared technical types.

Core must remain independent of Template UI and concrete application
composition.

Typical Core responsibilities include:

- Authentication transport
- Session-related technical logic
- Server validation
- Server environment detection
- Shared technical types
- Networking helpers
- Technical utilities
- Reusable update logic
- Storage-related technical capabilities

General rule:

```text
Core --> no Template imports
Core --> no Application imports
```

Core should not contain product-specific UI or business composition.

---

## 13. Design System

The reusable design system belongs to the Template.

Important structure:

```text
src/template/components/design-system/
+-- icons/
+-- stylistic/
+-- themed/
+-- ui-elements/
+-- index.ts
```

The public alias is:

```ts
import {
  ActionButton,
  Card,
} from "@design-system";
```

Reusable UI should prefer supported public exports instead of deep
internal imports.

---

## 14. Template Navigation

Navigation mechanisms belong to the Template.

Important areas include:

```text
src/template/navigation/
+-- menu/
+-- tabs/
+-- ...
```

The Template owns mechanisms such as:

- Menu tree construction
- Menu rendering
- Routing
- Path generation
- Tab rendering
- Feature rule evaluation
- Dynamic and static navigation composition

Concrete application navigation belongs to the Application layer.

This includes:

- Concrete menu definitions
- Concrete tabs
- Concrete application screens
- Menu feature rules
- Tab feature rules

The current repository still contains transitional static
Agent.Workbench navigation definitions.

These will later move to the Agent.Workbench application repository.

---

## 15. Template State

Reusable Redux state is organized by responsibility under:

```text
src/template/state/
```

Important areas include state for:

- API and authentication
- Connectivity
- Developer tools
- Localization
- Navigation
- Notifications
- Organizations
- Privacy and permissions
- Release information
- Server handling
- Settings
- Theme
- Updates
- User profile
- Session handling

State should be located according to architectural ownership rather than
being grouped into a generic Redux architecture layer.

---

## 16. Redux Store Structure

The active Redux store currently remains part of the Template runtime.

Important store files include:

```text
src/template/state/store/
+-- createTemplateStore.ts
+-- rootReducer.ts
+-- store.ts
+-- templateReducers.ts
+-- types.ts
+-- useAppDispatch.ts
+-- useAppSelector.ts
```

The project is currently transitioning from a fixed Redux store to an
extensible Template store.

---

## 17. Extensible Redux Store

The Base Template now defines an application reducer extension contract.

Important concepts include:

```text
ApplicationReducers
templateReducers
createTemplateStore
```

`ApplicationReducers` defines reducers supplied by a concrete
application.

`templateReducers` defines reducers owned by the Base Template.

`createTemplateStore` combines both groups safely.

Conceptually:

```ts
createTemplateStore({
  applicationReducers: {
    execSettings: execSettingsReducer,
    dataAnalysis: dataAnalysisReducer,
  },
});
```

The store factory prevents application reducers from overriding
Template-owned reducer keys.

This behavior is covered by dedicated tests.

### Current Redux migration status

Implemented:

- Application reducer extension contract
- Template reducer registry
- Extensible Template store factory
- Reducer key collision protection
- Store factory tests
- Application-side reducer registry

Still transitional:

- `TemplateApp` still uses the existing active store.
- The new store factory has not yet replaced the current store
  integration.
- Application reducers are not yet passed through `createTemplateApp`.
- Final combined state typing is still being refined.

---

## 18. Agent.Workbench Transitional State

Some Agent.Workbench-specific modules are still physically located
inside the Template area.

Known candidates include:

```text
src/template/screens/AgentWorkbenchOptions/
src/template/state/agent-workbench/
```

Examples include:

- Program Start
- Data Analyzing
- Exec Settings
- Data Analysis state
- Menu ID 3023
- Agent.Workbench-specific tabs
- `SERVER_MASTER` feature visibility rules

These modules should eventually move together into the separate
Agent.Workbench application repository.

They must not be moved individually without reviewing their imports,
state dependencies, navigation dependencies, and API ownership.

---

## 19. Application Reducer Registry

The current Application layer contains a transitional reducer registry:

```text
src/application/state/applicationReducers.ts
```

This registry identifies state owned by the concrete application.

Some registered reducers are still physically located in the current
Template repository.

This is intentional during the migration.

The final goal is:

```text
Agent.Workbench Repository
        |
        +-- Agent.Workbench reducers
        |
        v
ApplicationReducers
        |
        v
Base Template store factory
```

The Base Template must not permanently import concrete Agent.Workbench
reducers.

---

## 20. API Structure

The existing API area remains separate while ownership decisions are
still being reviewed.

Important areas include:

```text
src/api/
+-- definition/
+-- implementation/
+-- ...
```

OpenAPI definitions are stored under:

```text
src/api/definition/
```

Generated clients include:

```text
src/api/implementation/AWB-RestAPI/
src/api/implementation/Dynamic-Content-Api/
```

Generation commands include:

```bash
npm run AWB-RestAPI
npm run Dynamic-Content-Api
npm run api
```

Generated API files should not be manually reformatted or moved during
general architecture cleanup.

The final ownership of concrete API clients between Template and
Application remains an architecture decision.

---

## 21. Update Infrastructure

Reusable update infrastructure belongs to the Template.

Update watchers currently live under:

```text
src/template/update/watchers/
+-- PostLoginUpdateWatcher.tsx
+-- UpdateNotificationWatcher.tsx
```

Update-related reusable state belongs under the Template state
structure.

Technical update utilities that do not depend on Template UI may belong
to Core.

Ownership must be determined by responsibility rather than historical
file location.

---

## 22. Authentication and Session Handling

Authentication is distributed according to responsibility.

Conceptually:

```text
Core
+-- technical authentication logic
+-- shared authentication types
+-- transport and reusable session mechanisms

Template
+-- authentication UI
+-- session guards
+-- reusable authentication state
+-- application shell integration

Application
+-- product-specific authentication configuration
```

Authentication should not be treated as one monolithic folder that
belongs entirely to a single architecture layer.

---

## 23. Public APIs and Aliases

The repository uses aliases to reduce fragile relative imports and make
architectural ownership clearer.

Important aliases include:

```text
@core
@template
@application
@design-system
@
```

The root alias:

```text
@/*
```

maps to:

```text
src/*
```

Long-term, separate application repositories should consume the Base
Template through a stable public package API rather than arbitrary deep
internal paths.

Target usage is approximately:

```ts
import {
  createTemplateApp,
  type ApplicationConfig,
  type ApplicationReducers,
} from "@enflex/web-template";
```

Only explicitly supported types, functions, components, and extension
interfaces should become part of the public Template API.

---

## 24. Start Commands

Application configuration is generated automatically through npm
lifecycle hooks.

The normal development entry points are:

```bash
npm start
npm run web
npm run android
npm run ios
```

Before Expo starts, the corresponding npm lifecycle hook runs:

```bash
npm run config:generate
```

The configuration can also be generated manually:

```bash
npm run config:generate
```

Directly running:

```bash
npx expo start
```

bypasses the npm lifecycle hooks.

Therefore, it should not be the standard project startup command when
application configuration may have changed.

For a cleared Expo cache while preserving the npm lifecycle hooks, use:

```bash
npm start -- --clear
```

---

## 25. Tests and Validation

Tests are stored under:

```text
test/
```

Important architecture validation commands include:

```bash
npm run config:generate
npx tsc --noEmit
git diff --check
```

Targeted Jest tests should be executed for affected modules.

For example:

```bash
npx jest --runTestsByPath test/createTemplateStore.test.ts
```

Before completing a larger architecture batch, the application should
also be started through the normal npm entry point:

```bash
npm start
```

---

## 26. Refactoring Workflow

Architecture changes should be performed in small, controlled batches.

Recommended sequence:

1. Search all usages before moving a file.
2. Inspect imports and responsibility boundaries.
3. Move only a small related group.
4. Update imports explicitly.
5. Search again for stale paths.
6. Run TypeScript validation.
7. Run targeted tests.
8. Run `git diff --check`.
9. Start the application when runtime behavior is affected.
10. Review `git status --short`.
11. Commit the completed architecture batch.

Avoid broad scripts that rewrite unrelated files.

Generated API code and unrelated source files must not be reformatted as
a side effect of architecture work.

---

## 27. Current Implementation Status

### Implemented

- Core, Template, and Application architecture direction
- Template application shell
- `ApplicationConfig`
- `createTemplateApp`
- `ApplicationConfigContext`
- `ApplicationConfigProvider`
- `useApplicationConfig`
- Property-based application identity
- Application configuration generator
- Generated typed application configuration
- Automatic config generation through npm lifecycle hooks
- Removal of direct application title environment access from Template
  UI
- Template reducer registry
- Application reducer extension contract
- Extensible Template store factory
- Reducer collision protection
- Store factory tests
- Application-side reducer registry
- Public aliases for major architectural areas
- Design-system public API

### Transitional

- Existing Redux store is still active in `TemplateApp`.
- Application reducer integration is not yet connected to
  `createTemplateApp`.
- Agent.Workbench-specific screens remain in the current repository.
- Agent.Workbench-specific reducers remain physically in the current
  repository.
- Concrete navigation definitions are not yet fully externalized.
- API-client ownership is not yet finalized.
- Some feature ownership decisions remain open.

### Planned

- `menu.properties`
- `menuFeatureFlags.properties`
- `tabs.properties`
- `tabFeatureFlags.properties`
- `cookies.properties`
- `layout.properties`
- Additional branding properties
- Additional legal and application metadata mapping
- Final Redux integration
- Stable public Template package API
- Agent.Workbench repository extraction
- HEMS repository integration
- Independent Base Template release workflow
- Independent application builds and deployments

---

## 28. Next Architecture Steps

The next architecture work should be prioritized as follows:

1. Keep architecture documentation synchronized with the code.
2. Review and update outdated documentation paths.
3. Complete the property-based configuration contracts incrementally.
4. Decide which navigation configuration must move into the application
   repository.
5. Connect the extensible Redux store without destabilizing the current
   application.
6. Finalize application-specific state typing.
7. Review ownership of Agent.Workbench-specific screens and features.
8. Review concrete API-client ownership.
9. Finalize the public Base Template API.
10. Prepare the physical Agent.Workbench repository extraction.
11. Validate the Base Template independently.
12. Prepare HEMS as another consumer of the same Template API.

---

## 29. General Ownership Rule

When deciding where code belongs, use responsibility rather than its
current physical location.

```text
Reusable technical capability --> Core
Reusable application mechanism --> Template
Concrete product definition    --> Application
```

A file should not be moved only to make the directory tree look clean.

Its dependencies and architectural responsibility must support the move.