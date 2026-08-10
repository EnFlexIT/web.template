# Redux State Management

This document describes the current Redux architecture, ownership rules,
migration status, and extension model of `web.template`.

The project uses Redux Toolkit.

Redux is treated as a state-management technology and not as an
architectural layer.

The architecture follows this dependency direction:

```text
Application --> Template --> Core
```

State belongs to the architectural area that owns the corresponding
responsibility.

---

## 1. Architecture Rule

Redux must not define architectural ownership.

A reducer or slice belongs to the layer that owns its responsibility.

General ownership rules:

```text
Reusable technical capability --> Core
Reusable application mechanism --> Template
Concrete product state         --> Application
```

Typical examples:

- Reusable Template UI state belongs to `template`.
- Navigation state belongs to `template`.
- Notification state belongs to `template`.
- Reusable authentication UI state belongs to `template`.
- Product-specific business state belongs to `application`.
- Pure technical logic should be moved to `core` when it does not depend
  on Template or Application code.

The previous generic `src/redux` architecture is no longer the target
structure.

Redux state is organized by responsibility.

---

## 2. Current Redux Structure

The important Redux infrastructure is located under:

```text
src/template/state/
```

The store infrastructure is located under:

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

The concrete Application layer currently provides an application
reducer registry under:

```text
src/application/state/
+-- applicationReducers.ts
```

The repository is currently transitioning from the existing fixed store
composition to an extensible Base Template store.

---

## 3. Current Active Store

The existing application still uses the current Template store.

The active composition remains based on:

```text
src/template/state/store/store.ts
src/template/state/store/rootReducer.ts
```

`TemplateApp` still receives the existing store through the Redux
`Provider`.

Conceptually:

```text
TemplateApp
    |
    v
Provider
    |
    v
current store
    |
    v
current rootReducer
```

This remains the runtime configuration until the new extensible store
factory is connected safely.

The existing store must not be removed or replaced prematurely.

---

## 4. Extensible Store Architecture

A reusable store factory has been introduced in parallel with the
existing active store.

The factory is located at:

```text
src/template/state/store/createTemplateStore.ts
```

Its purpose is to combine:

```text
Template-owned reducers
        +
Application-owned reducers
        |
        v
Configured Redux store
```

Conceptually:

```ts
createTemplateStore({
  applicationReducers: {
    execSettings: execSettingsReducer,
    dataAnalysis: dataAnalysisReducer,
  },
});
```

The Base Template provides the store mechanism.

The concrete application provides its own reducers.

This prevents the Base Template from permanently depending on
Agent.Workbench, HEMS, or another concrete product.

---

## 5. Template Reducers

The reusable Base Template reducer registry is defined in:

```text
src/template/state/store/templateReducers.ts
```

`templateReducers` contains reducers whose responsibilities belong to
the reusable Base Template.

Current Template reducer areas include:

```text
language
theme
api
dataPermissions
menu
organizations
ready
baseMode
servers
connectivity
dbSettings
passwordChangePrompt
notifications
update
sessionTime
serverStatus
appSettingsFileUpload
appRelease
userProfile
liveConsole
developerConsole
```

The exact internal folder of each slice follows its owning
responsibility.

The important architectural rule is that Template reducers must not
include permanent product-specific business state.

---

## 6. Application Reducers

The application reducer extension contract is defined through:

```text
ApplicationReducers
```

The contract is located in:

```text
src/template/state/store/types.ts
```

A concrete application can provide its reducers through this contract.

The current application registry is:

```text
src/application/state/applicationReducers.ts
```

The current Agent.Workbench application registry includes
application-specific reducers such as:

```text
execSettings
dataAnalysis
```

Conceptually:

```text
Application
    |
    +-- execSettings
    +-- dataAnalysis
    |
    v
ApplicationReducers
    |
    v
createTemplateStore
```

This establishes the architectural ownership even though some of these
reducers are still physically located inside the current repository.

---

## 7. Transitional Agent.Workbench State

Some Agent.Workbench-specific reducers are still located under:

```text
src/template/state/agent-workbench/
```

Known examples include:

```text
execSettingsSlice.tsx
dataAnalysisSlice.ts
dataAnalyzingConstants.ts
```

These modules are application-specific and should eventually move into
the separate Agent.Workbench application repository.

Their current physical location is transitional.

The intended final direction is:

```text
Agent.Workbench Repository
    |
    +-- state/
        +-- execSettings
        +-- dataAnalysis
```

The Base Template must not permanently import these reducers.

The application should provide them through the public reducer extension
contract.

---

## 8. Reducer Collision Protection

Application reducers must not override reducers owned by the Base
Template.

`createTemplateStore` checks reducer keys before configuring the store.

For example, an application must not provide another reducer using a
Template-owned key such as:

```text
theme
language
api
notifications
```

If an application reducer conflicts with a Base Template reducer key,
store creation fails with an explicit error.

Conceptually:

```text
templateReducers
      +
applicationReducers
      |
      v
check duplicate keys
      |
      +-- conflict --> error
      |
      +-- valid ----> configureStore
```

This protects the public Template state contract from accidental
application overrides.

---

## 9. Store Factory Tests

The extensible store factory has dedicated Jest coverage.

The tests validate at least:

- Template reducers are available.
- Application reducers can be added.
- Application reducers can update their own state.
- Application reducers cannot override Template reducer keys.

The store factory tests isolate the factory from real Template reducer
dependencies where necessary.

This prevents unrelated React Native or runtime dependencies from
affecting the store factory unit tests.

---

## 10. Typed Redux Hooks

Typed Redux hooks now belong to the Template store infrastructure.

Current files:

```text
src/template/state/store/useAppDispatch.ts
src/template/state/store/useAppSelector.ts
```

These hooks are tied to the current Redux store types.

Their typing may need further refinement when the extensible application
store becomes the active runtime store.

The long-term type model must support both:

```text
Template state
+
Application-specific state
```

without forcing the Base Template to know concrete application reducers.

---

## 11. RootState Imports

Redux state types should be imported as type-only dependencies whenever
they are used only for TypeScript typing.

Preferred form:

```ts
import type {
  RootState,
} from "@/template/state/store/store";
```

Using type-only imports reduces unnecessary runtime dependency edges and
helps avoid import cycles.

A type dependency does not automatically determine architectural
ownership.

The underlying responsibility of the module remains the deciding factor.

---

## 12. Template State by Responsibility

Reusable state is grouped by responsibility under:

```text
src/template/state/
```

Important areas include:

```text
api/
authentication/
bootstrap/
connectivity/
developer-tools/
localization/
mode/
navigation/
notifications/
organizations/
privacy/
release/
server/
settings/
store/
theme/
update/
```

The exact folder names may evolve as responsibilities are refined.

The architecture must not return to one large generic `redux/slices`
folder.

---

## 13. API State

The API state currently lives under:

```text
src/template/state/api/apiSlice.tsx
```

It is still a complex module.

Its responsibilities include areas such as:

- API client handling
- Authentication-related state
- Active server handling
- Persistence
- Server switching

Some of these responsibilities may eventually be separated further.

The important current rule is that the module already belongs to the
Template state structure rather than a legacy root Redux folder.

Any future move toward Core must first remove dependencies on
Template-specific behavior.

Core must never depend upward on Template code.

---

## 14. Session State

Session-related Redux state has also been moved into the Template state
structure.

It participates in the current Template reducer composition.

Session handling should be separated according to responsibility:

```text
Core
+-- technical session mechanisms
+-- reusable transport logic

Template
+-- session state
+-- session UI integration
+-- application shell behavior
```

Technical logic may move to Core when it has no Template dependencies.

Redux state that supports reusable application-shell behavior remains
Template-owned.

---

## 15. Menu State

Menu state belongs to the reusable Template navigation mechanism.

The menu slice is located under the Template state structure.

Its responsibilities include state such as:

- Current menu tree
- Active menu
- Dynamic navigation state

Navigation configuration itself is not Redux state.

Configuration and state must remain separate.

Conceptually:

```text
Application navigation definition
        |
        v
Template navigation mechanism
        |
        v
Template menu state
```

---

## 16. Navigation Configuration

Static menu and tab definitions are configuration rather than reducers.

The Template owns the navigation mechanism.

The concrete Application should eventually own product-specific
navigation configuration.

The planned developer-facing application configuration includes:

```text
menu.properties
menuFeatureFlags.properties
tabs.properties
tabFeatureFlags.properties
```

These property formats are planned and have not yet replaced the current
navigation configuration.

The Redux migration must not be confused with the navigation
configuration migration.

They are related but separate architecture concerns.

---

## 17. Notifications

Notification state belongs to the reusable Base Template.

Notification state is located under:

```text
src/template/state/notifications/
```

Its responsibilities include:

- Local notifications
- Read and unread state
- Notification severity
- Server-related notification grouping
- Notification actions

Notification logic should remain reusable and must not depend on a
specific product application unless an explicit extension mechanism is
introduced.

---

## 18. Server and Connectivity State

Reusable server and connectivity state belongs to the Base Template.

Important areas include:

```text
src/template/state/server/
src/template/state/connectivity/
```

Responsibilities include:

- Saved server environments
- Active server selection
- Server status
- Connectivity state

Reusable technical server types and validation logic may belong to:

```text
src/core/
```

The responsibility boundary is:

```text
Technical server capability --> Core
Reusable server UI/state    --> Template
Product server definition   --> Application
```

---

## 19. Authentication State

Reusable authentication-related Redux state belongs to the Template
when it supports reusable application-shell behavior.

Examples include:

```text
password-change prompt state
user profile state
session-related state
```

Authentication must be separated according to responsibility rather
than moved as one large feature.

Conceptually:

```text
Core
+-- technical authentication capability
+-- reusable authentication types

Template
+-- authentication UI
+-- reusable authentication state
+-- session integration

Application
+-- product-specific authentication configuration
```

---

## 20. Settings State

Reusable settings state belongs to the Template when it represents
functionality offered by the Base Template.

Current examples include settings for areas such as:

```text
database configuration
application settings file upload
```

Some settings may later prove to be product-specific.

Their final ownership must be reviewed before physical repository
extraction.

Current physical location alone must not be used as proof of final
architectural ownership.

---

## 21. Developer Tool State

Reusable developer tooling currently has Template-owned Redux state.

Examples include:

```text
developerConsole
liveConsole
```

Their current location is under:

```text
src/template/state/developer-tools/
```

The final ownership of some developer tools is still under review.

Possible ownership includes:

```text
Base Template
or
Agent.Workbench Application
```

Until that decision is made, the state remains in the current Template
structure.

---

## 22. Update State and Watchers

Reusable update state belongs to the Template.

Update-related state is located under:

```text
src/template/state/update/
```

Runtime update watchers are located under:

```text
src/template/update/watchers/
```

Examples include:

```text
PostLoginUpdateWatcher.tsx
UpdateNotificationWatcher.tsx
```

The watchers are application-shell infrastructure rather than Redux
reducers.

They may dispatch Redux actions, but that does not make them part of the
Redux state layer.

---

## 23. Redux Initialization

The application initializes reusable state in an ordered startup flow.

Important initialization areas include:

```text
servers
language
theme
api
data permissions
organizations
menu
```

Server and API initialization must happen early enough for features that
depend on active-server information.

The exact startup orchestration belongs to the reusable Template
application shell.

Initialization order should not be changed casually because later
initializers may depend on earlier state.

---

## 24. API Client Configuration

The API state builds generated API clients according to the active
server and authentication state.

JWT-based communication uses an authorization header conceptually like:

```text
Authorization: Bearer <jwt>
```

OIDC browser sessions use credentials and cookies rather than requiring
the frontend to manage the same bearer-token flow.

Generated API clients remain under the API implementation area.

Redux should hold only state and orchestration that belong to the
corresponding responsibility.

Generated client source code must not be treated as Redux code.

---

## 25. ApplicationConfig and Redux

Application configuration and Redux are separate extension mechanisms.

`ApplicationConfig` provides configuration such as:

```text
application identity
navigation definitions
feature rules
```

`ApplicationReducers` provides application-specific Redux state.

Conceptually:

```text
Application
    |
    +-- ApplicationConfig
    |
    +-- ApplicationReducers
    |
    v
Base Template
```

The Base Template should accept both through supported public contracts.

The Template must not import a concrete application to obtain either
configuration or reducers.

---

## 26. Current Integration Gap

The Redux extension infrastructure exists, but the runtime integration
is not yet complete.

Current state:

```text
ApplicationReducers       implemented
templateReducers          implemented
createTemplateStore       implemented
collision protection      implemented
factory tests             implemented

TemplateApp integration   pending
createTemplateApp wiring  pending
final combined typing     pending
```

The new store factory must not replace the active store until the
remaining type and dependency issues are resolved.

This migration should continue in a controlled batch rather than through
a large store rewrite.

---

## 27. Target Runtime Composition

The intended future runtime composition is approximately:

```text
Application Repository
        |
        +-- applicationConfig
        |
        +-- applicationReducers
        |
        v
createTemplateApp(...)
        |
        v
createTemplateStore(...)
        |
        +-- templateReducers
        +-- applicationReducers
        |
        v
Redux Provider
        |
        v
TemplateApp
```

The final public API may differ slightly as implementation details are
refined.

The architectural rule remains stable:

> The Base Template provides the extension mechanism, while the
> application provides concrete product state.

---

## 28. Target State Typing

The final Redux typing must support both Base Template state and
application-specific state.

Conceptually:

```text
TemplateStoreState
        +
ApplicationReducers
        |
        v
Application RootState
```

The Template should be able to type its own reducers without importing
concrete Agent.Workbench state.

Application code should be able to access both:

- Template state
- Application-specific state

This type design must be completed before the extensible store becomes
the active store.

---

## 29. Import Policy

Prefer stable aliases for cross-area imports.

Examples:

```ts
import type {
  RootState,
} from "@/template/state/store/store";

import {
  selectTheme,
} from "@/template/state/theme/themeSlice";
```

Type-only imports should use:

```ts
import type {
  SomeType,
} from "...";
```

Do not perform broad automated path replacement across the entire
repository.

Before changing an import path:

1. Search the exact old path.
2. Verify architectural ownership.
3. Update only the affected files.
4. Search again for stale imports.
5. Run TypeScript validation.

Generated API files should not be modified as a side effect of Redux
refactoring.

---

## 30. Validation Workflow

After Redux architecture changes, run targeted validation.

TypeScript:

```bash
npx tsc --noEmit
```

Whitespace and patch validation:

```bash
git diff --check
```

Search for stale paths:

```bash
git grep -n "<old-path>" -- src test
```

Run the tests affected by the change.

For example:

```bash
npx jest --runTestsByPath test/createTemplateStore.test.ts
```

When runtime store composition changes, start the application through
the normal npm entry point:

```bash
npm start
```

Using the npm entry point also ensures that application configuration is
generated before Expo starts.

---

## 31. Migration Safety

Redux refactoring must be performed in small batches.

Do not:

- Replace the active store before the parallel factory is proven.
- Move all reducers at once.
- Run broad scripts that rewrite unrelated files.
- Mix generated API cleanup with Redux architecture work.
- Change reducer keys without checking all selectors and consumers.
- Move product-specific reducers individually without checking their
  related screens and navigation.

Preferred sequence:

```text
Define contract
    |
    v
Build parallel infrastructure
    |
    v
Add tests
    |
    v
Register application reducers
    |
    v
Resolve typing
    |
    v
Connect runtime store
    |
    v
Remove transitional composition
```

---

## 32. Current Status

### Implemented

- Redux Toolkit
- State organization by architectural responsibility
- Template-owned state under `src/template/state`
- Template store infrastructure under `src/template/state/store`
- Typed Template Redux hooks
- Type-only `RootState` imports where applicable
- `ApplicationReducers` extension contract
- `templateReducers`
- `createTemplateStore`
- Reducer key collision protection
- Store factory tests
- Application reducer registry
- Identification of Agent.Workbench-specific state

### Transitional

- `TemplateApp` still uses the existing store.
- `rootReducer.ts` still represents the active application composition.
- Agent.Workbench reducers are still physically located in the current
  repository.
- Application reducers are not yet connected through
  `createTemplateApp`.
- Combined Template/Application state typing is not finalized.
- Some Template feature ownership decisions remain open.

### Planned

- Connect `applicationReducers` to application creation.
- Make `createTemplateStore` the active runtime store factory.
- Finalize Template and Application state typing.
- Move Agent.Workbench reducers into the separate Agent.Workbench
  repository.
- Remove remaining concrete application state from the Base Template.
- Finalize the public Redux extension API.
- Maintain automated architecture boundary validation.

---

## 33. Success Criteria

The Redux migration is complete when:

1. The Base Template store is created through a reusable store factory.
2. Template reducers are owned and registered by the Base Template.
3. Application reducers are provided by the concrete application.
4. Application reducers cannot override Template reducer keys.
5. The Base Template does not import Agent.Workbench or HEMS reducers.
6. Template state typing does not depend on concrete application state.
7. Application code can access both Template and application-specific
   state safely.
8. Agent.Workbench-specific reducers live in the Agent.Workbench
   repository.
9. Redux state is organized by responsibility rather than by one generic
   Redux folder.
10. Store composition is covered by targeted automated tests.
11. Runtime behavior remains unchanged during the migration.