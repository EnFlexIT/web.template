# Separation of the Base Template and Applications

## 1. Status

**Status:** In Progress

**Project:** web.template

The fundamental architecture decision is:

- The Base Template will have its own repository.
- Agent.Workbench will have its own application repository.
- HEMS will have its own application repository.
- Future applications will use the same reusable technical foundation.
- The Base Template must not directly import any concrete application.
- Core must remain independent of both Template and Application code.

---

## 2. Target Architecture

The allowed dependency direction is:

```text
Agent.Workbench ----\
                     +--> Base Template --> Core
HEMS ----------------/
```

In short:

```text
Application --> Template --> Core
```

The following dependency directions are not allowed:

```text
Template --> Application
Core --> Template
Core --> Application
```

The Base Template must be independently maintainable and releasable
without depending on Agent.Workbench, HEMS, or any other concrete
application.

---

## 3. Repository Separation

### 3.1 Base Template Repository

The Base Template contains the reusable technical foundation:

```text
Base Template
|
+-- TemplateApp
+-- createTemplateApp
+-- ApplicationConfig
+-- ApplicationConfigContext
+-- Configuration Infrastructure
+-- Navigation Engine
+-- Redux Infrastructure
+-- Authentication and Session Management
+-- Server and Connectivity Features
+-- Design System
+-- General Screens
+-- Notifications
+-- Update Infrastructure
+-- Header, Footer, and Layout
+-- Core
```

The Base Template provides mechanisms and reusable functionality.

It must not contain concrete Agent.Workbench or HEMS configuration.

### 3.2 Application Repository

Each concrete application has its own repository.

The application repository contains the product-specific composition:

```text
Application
|
+-- Configuration
+-- Menus
+-- Menu Feature Flags
+-- Tabs
+-- Tab Feature Flags
+-- Screens
+-- Application-specific Redux State
+-- Branding
+-- Application-specific Extensions
+-- Build Configuration
+-- Deployment Configuration
```

Agent.Workbench and HEMS should follow the same general repository
structure while providing their own application-specific content.

---

## 4. Application Configuration

Application configuration must be simple for application developers to
edit.

The developer-facing configuration format is based on key-value
property files.

It must not require developers to edit JSON, JavaScript, or TypeScript
configuration files.

### Current Application Structure

```text
src/
+-- application/
    +-- config/
    |   +-- application.properties
    |
    +-- generated/
    |   +-- applicationConfig.generated.ts
    |
    +-- state/
    +-- screens/
    +-- branding/
    +-- index.ts
```

### Target Configuration Structure

The configuration area is planned to grow incrementally:

```text
src/
+-- application/
    +-- config/
    |   +-- application.properties
    |   +-- menu.properties
    |   +-- menuFeatureFlags.properties
    |   +-- tabs.properties
    |   +-- tabFeatureFlags.properties
    |   +-- cookies.properties
    |   +-- layout.properties
    |
    +-- generated/
    |   +-- applicationConfig.generated.ts
    |
    +-- screens/
    +-- state/
    +-- branding/
    +-- index.ts
```

Currently, only `application.properties` is implemented.

The other property files are planned and must be introduced
incrementally when their contracts are defined.

---

## 5. Application Properties

The central application identity is currently configured in:

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

### ApplicationId

`ApplicationId` is the stable technical identifier of the application.

Possible future uses include:

- Build identification
- Docker image naming
- Helm release naming
- Logging
- Storage prefixes
- Technical metadata

The application ID is not used to select an application directory inside
the Base Template.

Each application has its own repository and therefore already has a
clear application identity.

### ApplicationTitle

`ApplicationTitle` is the user-visible application name.

It is currently used by template UI through `ApplicationConfig`.

Examples include:

- Navigation
- Login
- Password-related screens
- Navigation screen titles
- General application identity

The Base Template does not read the application title directly from
`EXPO_PUBLIC_APPLICATION_TITLE`.

The previous direct environment dependency has been removed.

### Additional Properties

Properties such as:

```text
ApplicationLogo
ApplicationContact
ApplicationOwner
LegalImprintCompanyHomepage
LegalImprintCompanyName
LegalImprintEmail
```

are already possible in the developer-facing properties file.

However, not all of these values are currently mapped into the typed
`ApplicationConfig`.

Their final contracts and consumers will be added incrementally.

---

## 6. Configuration Generation

The developer-facing properties are transformed into a typed
configuration that can be consumed by the Base Template.

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

The current generator is located at:

```text
src/template/config/build/generateApplicationConfig.mjs
```

The generated configuration is written to:

```text
src/application/generated/applicationConfig.generated.ts
```

The generated TypeScript file is technical build output.

Application developers should edit the `.properties` source instead of
manually editing the generated configuration.

### Current Generated Values

The current implementation generates at least:

```text
ApplicationId    --> ApplicationConfig.id
ApplicationTitle --> ApplicationConfig.displayName
```

Additional properties will be added to the typed contract as their
template consumers are implemented.

---

## 7. Starting the Application

Application configuration is generated automatically when the project is
started through the npm scripts.

Supported development entry points are:

```bash
npm start
npm run web
npm run android
npm run ios
```

The corresponding npm lifecycle hooks execute the configuration
generator before Expo starts.

Example:

```text
npm start
    |
    v
prestart
    |
    v
npm run config:generate
    |
    v
application.properties
    |
    v
applicationConfig.generated.ts
    |
    v
expo start
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

Therefore, it does not automatically regenerate the application
configuration and should not be used as the standard project startup
command.

---

## 8. Template Application Structure

The reusable template area currently follows this general structure:

```text
src/
+-- template/
|   +-- application/
|   |   +-- TemplateApp.tsx
|   |   +-- createTemplateApp.tsx
|   |   +-- ApplicationConfig.ts
|   |   +-- ApplicationConfigContext.tsx
|   |
|   +-- authentication/
|   +-- components/
|   +-- config/
|   +-- navigation/
|   +-- screens/
|   +-- state/
|   +-- styles/
|   +-- update/
|   +-- ...
|
+-- core/
```

### TemplateApp.tsx

`TemplateApp` contains the reusable technical application shell.

Its responsibilities include:

- Providers
- Navigation container
- Header and footer
- Session guard
- Global dialogs
- Notifications
- Update watchers
- General layout
- Current Redux integration

### createTemplateApp.tsx

`createTemplateApp` connects a concrete application configuration with
the reusable template shell.

Current usage:

```ts
const App = createTemplateApp(applicationConfig);
```

### ApplicationConfig.ts

`ApplicationConfig` defines the typed contract between an application
and the Base Template.

The Base Template defines the contract.

The application provides the concrete values.

### ApplicationConfigContext.tsx

`ApplicationConfigContext` makes application identity available inside
the reusable template without requiring template components to import
application files.

The current context provides application identity such as:

```text
id
displayName
```

Template components can access these values through
`useApplicationConfig`.

This prevents direct application-specific environment access inside
template UI components.

---

## 9. Responsibilities

### Base Template

The Base Template owns reusable mechanisms and infrastructure.

Examples include:

- Menu rendering
- Menu tree construction
- Routing
- Tab rendering
- Feature rule evaluation
- Redux infrastructure
- Authentication
- Session handling
- Connectivity
- Design system
- Notifications
- Update infrastructure
- General UI behavior

### Application

The application owns concrete product definitions.

Examples include:

- Application identity
- Application branding
- Concrete menus
- Concrete tabs
- Domain-specific screens
- Domain-specific feature rules
- Application-specific Redux state
- Application-specific composition
- Application build configuration
- Application deployment configuration

General rule:

```text
Mechanism and infrastructure --> Template
Concrete product definition  --> Application
```

---

## 10. Redux Extension

Redux is a state-management technology and not an architecture layer.

Redux state should belong to the architectural area that owns the
corresponding responsibility.

The Base Template provides the reusable Redux infrastructure.

This includes:

- Template reducers
- Store creation infrastructure
- Redux provider integration
- Typed Redux hooks
- General template-owned slices
- An application reducer extension contract

The extensible store factory has been introduced through
`createTemplateStore`.

The application reducer extension contract is represented by
`ApplicationReducers`.

Conceptually:

```ts
createTemplateStore({
  applicationReducers: {
    execSettings: execSettingsReducer,
    dataAnalysis: dataAnalysisReducer,
  },
});
```

The store factory also prevents application reducers from overriding
Base Template reducer keys.

### Current Redux Status

The Redux separation is not yet fully complete.

Implemented:

- `ApplicationReducers` extension contract
- `templateReducers`
- `createTemplateStore`
- Collision protection for reducer keys
- Tests for the extensible store factory

Still transitional:

- `TemplateApp` still uses the existing Redux store integration.
- The new application reducer extension is not yet fully connected to
  `createTemplateApp`.
- Some Agent.Workbench-specific reducers are still physically located
  inside the current template repository.
- Final application-specific state typing is still being refined.

Important rule:

> The Base Template must not permanently import concrete
> Agent.Workbench or HEMS reducers.

Concrete applications must provide their reducers through a public
extension interface.

---

## 11. Navigation

The Base Template owns the navigation mechanism.

This includes:

- Menu tree construction
- Navigation rendering
- Routing
- Path calculation
- Tab rendering
- Feature rule evaluation
- Dynamic and static navigation composition

The application owns the concrete navigation definition.

This includes:

- Menu items
- Tabs
- Screens
- Menu feature flags
- Tab feature flags

General rule:

```text
Navigation mechanism --> Template
Concrete navigation  --> Application
```

The final developer-facing menu and tab configuration is planned to use
property-based configuration.

The exact contracts for these files have not yet been finalized.

Planned files include:

```text
menu.properties
menuFeatureFlags.properties
tabs.properties
tabFeatureFlags.properties
```

---

## 12. Current Transitional State

The repository is currently in a migration phase.

Some Agent.Workbench-specific functionality is still physically located
inside the template area.

Known candidates include:

```text
src/template/screens/AgentWorkbenchOptions/
src/template/state/agent-workbench/
```

Related functionality includes:

- Program Start
- Data Analyzing
- Exec Settings
- Data Analysis State
- Menu ID 3023
- Tabs assigned to menu ID 3023
- The `SERVER_MASTER` visibility rule for Data Analyzing

These areas should eventually move together into the Agent.Workbench
application repository.

They remain in the current repository until the application extraction
is performed safely.

---

## 13. Open Ownership Decisions

Some feature ownership decisions still require clarification before the
final repository extraction.

| Area | Possible Ownership | Status |
|---|---|---|
| Live Console | Template or Agent.Workbench | Open |
| Developer Console | Template or Agent.Workbench | Open |
| Database Connections | Template or Application | Open |
| Server Settings | Template or Application | Open |
| Dynamic Content | Template or Application | Open |
| Backend Update | Template or Application | Open |
| Settings File Upload | Template or Application | Open |
| Concrete API Clients | Template or Application | Open |
| General Settings | Template or Application | Review required |
| User Profile | Template or Application | Review required |

These decisions should be made according to responsibility and
reusability rather than the current physical file location.

---

## 14. Public Template API

Application repositories should consume the Base Template through an
explicit public API.

They should not depend on arbitrary internal template paths.

Target usage:

```ts
import {
  createTemplateApp,
  type ApplicationConfig,
  type ApplicationReducers,
  type StaticMenuItem,
  type StaticTabItem,
} from "@enflex/web-template";
```

The public API should expose only explicitly supported:

- Types
- Functions
- Components
- Configuration contracts
- Extension interfaces

Internal template implementation details should remain private.

---

## 15. Current Implementation Status

### Implemented

The following architecture foundations are already implemented:

- `ApplicationConfig`
- `createTemplateApp`
- `ApplicationConfigContext`
- `ApplicationConfigProvider`
- `useApplicationConfig`
- `application.properties`
- Application configuration generator
- Generated typed application configuration
- Application ID loaded from properties
- Application display name loaded from properties
- Direct `EXPO_PUBLIC_APPLICATION_TITLE` usage removed from template code
- Automatic config generation through npm lifecycle scripts
- `ApplicationReducers`
- `templateReducers`
- `createTemplateStore`
- Reducer key collision protection
- Store factory tests

### Transitional

The following areas are intentionally still transitional:

- The existing Redux store is still connected to `TemplateApp`.
- The extensible Redux store factory is not yet the active application
  store.
- Agent.Workbench-specific screens are still located in the current
  repository.
- Agent.Workbench-specific state is still located in the current
  repository.
- The current configuration generator is part of the existing
  repository structure and may need to become more generic when the
  repositories are physically separated.

### Planned

The following work remains planned:

- Menu configuration through properties
- Menu feature flags through properties
- Tab configuration through properties
- Tab feature flags through properties
- Layout configuration
- Cookie configuration
- Additional branding configuration
- Mapping additional application metadata into `ApplicationConfig`
- Final Redux integration with `createTemplateApp`
- Public package API finalization
- Agent.Workbench repository extraction
- HEMS integration
- Independent Base Template build and release workflow

---

## 16. Migration Phases

### Phase 1 - Application Configuration

Status: largely implemented.

Completed or introduced:

- Define `ApplicationConfig`
- Provide `createTemplateApp`
- Introduce `ApplicationConfigContext`
- Introduce property-based application identity
- Generate typed configuration
- Remove direct application title environment access from template UI
- Add automatic npm configuration generation

Remaining work:

- Extend the configuration contract with additional metadata
- Generalize build-time configuration tooling where necessary

### Phase 2 - Configurable Navigation

Status: planned.

Tasks:

- Define `menu.properties`
- Define menu feature flag configuration
- Define `tabs.properties`
- Define tab feature flag configuration
- Connect application navigation configuration to the template
- Keep navigation mechanisms inside the Base Template

### Phase 3 - Extensible Redux Store

Status: partially implemented.

Completed or introduced:

- Define application reducer contract
- Define Base Template reducers
- Create extensible store factory
- Prevent application reducers from overriding template reducer keys
- Add store factory tests

Remaining work:

- Connect the extensible store to `TemplateApp`
- Connect application reducers to application creation
- Finalize application state typing
- Move application-specific reducers to the application repository

### Phase 4 - Public Template API

Status: in progress.

Tasks:

- Define stable exports
- Avoid internal template imports from application repositories
- Prepare the package interface
- Add or maintain dependency boundary checks
- Document supported extension points

### Phase 5 - Agent.Workbench Extraction

Status: planned.

Tasks:

- Move `AgentWorkbenchOptions`
- Move Agent.Workbench state
- Move Agent.Workbench menus and tabs
- Move Agent.Workbench feature rules
- Review concrete API ownership
- Prepare the independent application build
- Prepare deployment configuration

### Phase 6 - Base Template Cleanup

Status: planned.

Tasks:

- Remove remaining Agent.Workbench dependencies
- Test the Base Template independently
- Integrate HEMS as a separate application
- Validate repository boundaries
- Create a guide for building new applications

---

## 17. Success Criteria

The separation is considered complete when:

1. The Base Template does not import any concrete application.
2. Core imports neither Template nor Application code.
3. Agent.Workbench and HEMS consume the same supported Base Template API.
4. Application identity is configured outside the Base Template.
5. Applications can provide their own screens.
6. Applications can provide their own menus and tabs.
7. Applications can provide their own feature rules.
8. Applications can provide their own Redux reducers.
9. Applications have independent build configurations.
10. Applications have independent deployment configurations.
11. Base Template updates can be maintained and released centrally.
12. A new application can be created without modifying internal Base
    Template implementation files.
13. Application developers can configure common application properties
    without editing TypeScript or JavaScript configuration files.
14. Repository dependency boundaries remain enforceable and testable.