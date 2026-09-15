# Redux State Management

## Purpose

This document describes the Redux architecture, ownership rules and extension model of `web.template`.

The project uses Redux Toolkit.

Redux is a state-management technology and not an architectural layer.

The architecture follows:

```text
Application --> Template --> Core
```

State belongs to the architectural area that owns the corresponding responsibility.

---

# 1. Architecture Rule

Redux does not determine architectural ownership.

A reducer or slice belongs to the layer that owns the responsibility represented by that state.

The general ownership model is:

```text
Reusable technical capability
    -> Core

Reusable application-platform state
    -> Template

Standard Agent.Workbench state
    -> Template

Concrete product-specific state
    -> Application
```

Examples:

```text
navigation state
    -> Template

notification state
    -> Template

authentication/session UI state
    -> Template

Agent.Workbench Program Start state
    -> Template

Agent.Workbench Data Analyzing state
    -> Template

HEMS-specific business state
    -> HEMS Application
```

The previous generic `src/redux` organization is not the architectural model.

Redux state is organized according to responsibility.

---

# 2. Redux Structure

Reusable Redux infrastructure exists under:

```text
src/template/state/
```

Store infrastructure exists under:

```text
src/template/state/store/
```

Known store files include:

```text
createTemplateStore.ts
rootReducer.ts
store.ts
templateReducers.ts
types.ts
useAppDispatch.ts
useAppSelector.ts
```

Application-specific Redux state can be provided through:

```text
src/application/state/applicationReducers.ts
```

The current Agent.Workbench Application composition does not require meaningful Application-specific Redux state.

Therefore `applicationReducers.ts` is currently essentially an empty extension point.

---

# 3. Ownership Model

The architectural ownership rule is:

```text
Template
|
+-- reusable application state
+-- standard Agent.Workbench state
+-- reusable Redux infrastructure

Application
|
+-- optional concrete product-specific state

Core
|
+-- reusable technical capabilities
```

Core is not a Redux state layer.

Technical logic may belong to Core when it is independent from React, Template orchestration and concrete Application behavior.

Redux state that supports the reusable application platform remains Template-owned.

---

# 4. Template State

Template owns reusable state required by the Base Template.

Examples include state related to:

```text
API integration
authentication/session behavior
bootstrap
connectivity
developer tools
localization
navigation
notifications
organizations
release information
server handling
settings
theme
updates
user/session information
Agent.Workbench
```

The exact internal directory organization may evolve.

The ownership rule is more important than individual folder names.

---

# 5. Agent.Workbench State

Agent.Workbench state is intentionally Template-owned.

A dedicated area exists under:

```text
src/template/state/agent-workbench/
```

Known Agent.Workbench-related state includes functionality associated with:

```text
execSettings
dataAnalysis
Data Analyzing
Program Start
```

This state is not transitional Application state.

It is not waiting to be moved into a separate Agent.Workbench Application repository.

The ownership rule is:

```text
standard Agent.Workbench state
    -> Template
```

This matches the architectural decision that standard Agent.Workbench functionality is part of the Base Template.

---

# 6. No Agent.Workbench Redux Extraction

The current architecture does not include a later extraction of standard Agent.Workbench reducers into a concrete Application.

The following previous direction is no longer valid:

```text
Agent.Workbench state
    -> separate Agent.Workbench Application
```

The correct direction is:

```text
Agent.Workbench state
    -> Base Template
```

Therefore modules under:

```text
src/template/state/agent-workbench/
```

must not be described as misplaced or transitional merely because they contain Agent.Workbench functionality.

Their Template ownership is intentional.

---

# 7. Application-Specific State

Concrete Applications may provide their own Redux state when required.

The Application-side extension point is:

```text
src/application/state/applicationReducers.ts
```

Application reducers should only contain state that is genuinely specific to the concrete product.

Examples could include:

```text
HEMS-specific domain state
consumer-specific workflow state
product-only business data
```

The current Agent.Workbench Application composition does not require such state.

An essentially empty `applicationReducers.ts` is therefore valid.

---

# 8. Redux Extension Contract

Template provides the reusable Redux integration mechanism.

Application may optionally provide concrete reducers.

Conceptually:

```text
Template reducers
        +
optional Application reducers
        |
        v
Redux store
```

Template must not import concrete Application reducer implementations directly.

The Application supplies product-specific reducers through the supported integration boundary.

---

# 9. ApplicationReducers

The reusable Application reducer contract is defined under the Template store infrastructure.

A known contract location is:

```text
src/template/state/store/types.ts
```

Conceptually:

```text
ApplicationReducers
|
+-- reducer key
+-- reducer implementation
```

This allows concrete Applications to extend Redux state without reversing the dependency direction.

---

# 10. createTemplateStore

Reusable store composition is represented by:

```text
src/template/state/store/createTemplateStore.ts
```

Its architectural responsibility is to allow Template-owned reducers and optional Application-owned reducers to participate in one store composition.

Conceptually:

```text
Template-owned reducers
        +
Application-owned reducers
        |
        v
createTemplateStore(...)
        |
        v
Redux store
```

The store infrastructure belongs to Template.

Concrete product reducers remain Application-owned.

---

# 11. Template Reducer Registry

Reusable Template reducer registration is represented by:

```text
src/template/state/store/templateReducers.ts
```

Template reducers must contain state whose responsibility belongs to the reusable Base Template.

This includes standard Agent.Workbench state where that functionality belongs to the Base Template.

The Template reducer registry must not depend on concrete consumer Applications such as HEMS.

---

# 12. Root Reducer and Store

The Template store infrastructure also includes:

```text
src/template/state/store/rootReducer.ts
src/template/state/store/store.ts
```

These files are part of the reusable Redux implementation.

Runtime composition must preserve the architecture boundary:

```text
Template
    owns reusable store infrastructure

Application
    may provide optional product reducers

Template
    must not import concrete Application implementation
```

This document intentionally does not classify Agent.Workbench state inside the Template store as transitional.

---

# 13. Reducer Collision Protection

Application reducers must not silently replace Template-owned reducer keys.

The store integration must preserve reducer ownership.

Conceptually:

```text
Template reducer keys
        +
Application reducer keys
        |
        v
collision validation
        |
        +-- duplicate -> error
        |
        +-- unique ----> compose
```

A concrete Application must not override Base Template state such as:

```text
theme
language
notifications
navigation
```

or any other key already owned by Template.

This protects the Template/Application contract.

---

# 14. Typed Redux Hooks

Typed Redux hooks belong to the Template store infrastructure.

Known files include:

```text
src/template/state/store/useAppDispatch.ts
src/template/state/store/useAppSelector.ts
```

These hooks provide reusable typed access to the Redux store.

Their implementation must remain compatible with the Template/Application extension model.

Template typing must not require imports from a concrete Application.

---

# 15. RootState Imports

When Redux state types are used only for TypeScript typing, type-only imports should be preferred.

Example:

```ts
import type {
  RootState,
} from "@/template/state/store/store";
```

Type-only imports reduce unnecessary runtime dependency edges.

A type import does not determine architectural ownership.

Responsibility remains the deciding factor.

---

# 16. Template State Organization

Reusable state is grouped by responsibility under:

```text
src/template/state/
```

Known responsibility areas include:

```text
agent-workbench/
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

Folder names may evolve as implementation changes.

The repository should not return to one large generic `redux/slices` directory.

---

# 17. API State

Reusable API-related application state belongs to Template when it supports Base Template behavior.

A known area is:

```text
src/template/state/api/
```

API state may coordinate responsibilities such as:

```text
API client handling
authentication-related state
active server handling
persistence
server switching
```

Technical logic that becomes independent from Template orchestration may belong to Core.

Core must not depend upward on Template state.

---

# 18. Session State

Reusable session-related state belongs to Template when it supports application-shell behavior.

The responsibility split is:

```text
Core
+-- technical session capabilities
+-- reusable transport logic

Template
+-- session state
+-- session UI integration
+-- application-shell behavior

Application
+-- product-specific behavior only when required
```

Redux session state that supports the reusable platform remains Template-owned.

---

# 19. Navigation State

Navigation state belongs to Template because navigation infrastructure belongs to Template.

Navigation state may include concepts such as:

```text
current menu tree
active menu
dynamic navigation state
```

Configuration and runtime state are separate concepts.

The composition is:

```text
Template navigation definitions
        +
Application navigation extensions
        |
        v
Template navigation mechanism
        |
        v
Template navigation state
```

---

# 20. Navigation Configuration Is Not Redux State

Static feature and navigation configuration is not Redux state.

Developer-facing Application configuration uses:

```text
src/application/config/application.properties
src/application/config/features.properties
src/application/config/navigation.properties
```

The old planned configuration names:

```text
menu.properties
tabs.properties
featureFlags.properties
menuFeatureFlags.properties
tabFeatureFlags.properties
```

are not part of the current architecture.

Redux architecture and configuration architecture are related but separate concerns.

---

# 21. Notifications

Notification state belongs to the reusable Base Template.

A known state area is:

```text
src/template/state/notifications/
```

Reusable notification responsibilities may include:

```text
local notifications
read/unread state
severity
server-related grouping
notification actions
```

Notification functionality remains Template-owned unless a specific product extension is explicitly required.

---

# 22. Server and Connectivity State

Reusable server and connectivity state belongs to Template.

Known areas include:

```text
src/template/state/server/
src/template/state/connectivity/
```

Responsibilities may include:

```text
saved server environments
active server selection
server status
connectivity state
```

Technical server capabilities belong to Core where appropriate.

The responsibility split is:

```text
Technical server capability
    -> Core

Reusable server state and UI
    -> Template

Concrete product-specific server configuration
    -> Application
```

---

# 23. Authentication State

Reusable authentication-related Redux state belongs to Template when it supports the reusable application platform.

Examples may include:

```text
password-change prompt state
user profile state
session-related state
```

Authentication ownership is split by responsibility:

```text
Core
+-- technical authentication capabilities
+-- reusable technical types

Template
+-- authentication UI
+-- reusable authentication state
+-- session integration

Application
+-- concrete product-specific behavior where required
```

---

# 24. Settings State

Settings state belongs to Template when it represents reusable functionality offered by the Base Template.

Examples may include:

```text
database configuration
application settings file upload
general reusable settings
```

Standard Agent.Workbench settings that are part of the Base Template remain Template-owned.

A setting should only move into Application when it is genuinely specific to that concrete product.

---

# 25. Developer Tool State

Reusable developer tooling belongs to Template.

Known state includes functionality such as:

```text
developerConsole
liveConsole
```

Known areas exist under:

```text
src/template/state/developer-tools/
```

These tools are part of the reusable Base Template under the current architecture.

They must not be documented as waiting for extraction into a separate Agent.Workbench Application.

---

# 26. Update State and Watchers

Reusable update state belongs to Template.

Known state is located under:

```text
src/template/state/update/
```

Reusable update watchers exist under:

```text
src/template/update/watchers/
```

Examples include:

```text
PostLoginUpdateWatcher.tsx
UpdateNotificationWatcher.tsx
```

Watchers may dispatch Redux actions, but they are application-shell orchestration rather than Redux reducers themselves.

Technical update capabilities may exist in Core.

---

# 27. Redux Initialization

Reusable state initialization belongs to the Template application shell.

Initialization may include areas such as:

```text
servers
language
theme
API
data permissions
organizations
navigation
```

Initialization order must preserve runtime dependencies.

For example, features that depend on active-server information must not run before the required server state is available.

Initialization should not be reordered casually.

---

# 28. API Client Configuration

Generated API clients are not Redux code.

Redux may hold state and orchestration required to configure generated clients according to runtime context.

Generated client implementation remains in the API implementation area.

Authentication behavior may include different transport mechanisms depending on the authentication method.

Redux ownership should follow the state responsibility rather than the location of generated clients.

---

# 29. Application Configuration and Redux

Application configuration and Redux are separate extension mechanisms.

Application configuration is provided through:

```text
application.properties
features.properties
navigation.properties
```

Redux extension is provided through optional Application reducers.

Conceptually:

```text
Application
|
+-- metadata/configuration
|
+-- feature selection
|
+-- navigation extensions
|
+-- optional Application reducers
|
v
Base Template
```

Template must not import a concrete Application to obtain either configuration or reducers.

---

# 30. Agent.Workbench and ApplicationReducers

Agent.Workbench standard reducers must not be registered as if they were concrete Application reducers.

Incorrect model:

```text
applicationReducers
|
+-- execSettings
+-- dataAnalysis
```

when those reducers represent standard Agent.Workbench Base Template functionality.

Correct model:

```text
Template state
|
+-- Agent.Workbench state

Application reducers
|
+-- only concrete product-specific state
```

The current Agent.Workbench Application composition therefore does not need Agent.Workbench reducers in `applicationReducers.ts`.

---

# 31. Application State Typing

The Redux model must support optional Application-specific state without making Template depend on a concrete Application.

Conceptually:

```text
Template state
        +
optional Application state
        |
        v
runtime store state
```

Template code must be able to type its own state independently.

Concrete Application code may consume supported Template state and its own product-specific state through the established store interfaces.

---

# 32. Import Policy

Prefer stable aliases for cross-area imports.

Example:

```ts
import type {
  RootState,
} from "@/template/state/store/store";
```

Before changing Redux imports:

1. Search the current usage.
2. Verify architectural ownership.
3. Update only the required files.
4. Search again for stale imports.
5. Run TypeScript validation.

Broad automated import rewrites should be avoided.

Generated API files should not be modified as a side effect of Redux refactoring.

---

# 33. Architecture Dependency Rules

Redux code must preserve:

```text
Application --> Template --> Core
```

The following dependencies are invalid:

```text
Core --> Template
Core --> Application
Template --> concrete Application
```

A useful dependency check is:

```bash
git grep -n "@/application/" -- src/template
```

Template should not import concrete Application implementation.

Application-side imports can be reviewed with:

```bash
git grep -n "@/template/" -- src/application
```

Unexpected direct Template-internal imports should be reviewed against the intended public APIs.

---

# 34. Validation Workflow

After Redux-related architecture changes, run:

```bash
npm run config:generate
npx tsc --noEmit
npm test -- --runInBand
git diff --check
git status --short
```

For targeted store changes, affected tests can also be run directly.

Example:

```bash
npx jest --runTestsByPath test/createTemplateStore.test.ts
```

When runtime store behavior changes, the application should also be started through the normal npm entry point.

---

# 35. Refactoring Safety

Redux changes should be performed in small, controlled batches.

Do not:

```text
move many reducers without verifying ownership
rewrite unrelated imports automatically
change reducer keys without checking selectors and consumers
mix generated API cleanup with Redux architecture work
treat Agent.Workbench state as Application state
move code only to make directories appear more separated
```

Preferred workflow:

```text
verify ownership
    |
    v
verify dependencies
    |
    v
make smallest coherent change
    |
    v
run TypeScript
    |
    v
run tests
    |
    v
run dependency checks
    |
    v
review diff
```

---

# 36. Current Architecture Status

## Established

The Redux architecture currently follows these established rules:

```text
Redux state is organized by responsibility

Template owns reusable Redux infrastructure

Template owns standard Agent.Workbench state

Application-specific Redux state is optional

applicationReducers.ts is the Application extension point

Template must not import concrete Application reducers

Application reducers must not override Template-owned reducer keys

Core remains independent from Template/Application state
```

Known reusable store infrastructure includes:

```text
createTemplateStore
rootReducer
store
templateReducers
ApplicationReducers
typed Redux hooks
```

The current Agent.Workbench Application composition does not require meaningful product-specific reducers.

---

# 37. Future Consumer State

A future HEMS Application may provide its own state when necessary.

Example conceptual structure:

```text
HEMS Application
|
+-- state/
|   +-- HEMS-specific reducer A
|   +-- HEMS-specific reducer B
|
+-- applicationReducers
        |
        v
Base Template Redux integration
```

The Base Template must not need to import those HEMS reducer implementations.

HEMS state remains HEMS-owned.

Standard Agent.Workbench state remains Template-owned.

---

# 38. Incorrect Legacy Statements

The following statements are no longer correct:

```text
"Agent.Workbench reducers are Application reducers."

"Agent.Workbench state inside Template is transitional."

"execSettings must move into a separate Agent.Workbench repository."

"dataAnalysis must move into a separate Agent.Workbench repository."

"The Base Template must not contain Agent.Workbench state."

"applicationReducers should register Agent.Workbench reducers."

"Agent.Workbench reducers must eventually be removed from Template."

"menu.properties is the future navigation configuration."

"tabs.properties is the future tab configuration."

"featureFlags.properties is the future feature configuration."

"menuFeatureFlags.properties and tabFeatureFlags.properties are planned."

"Redux separation is incomplete because Agent.Workbench state still exists in Template."
```

The correct ownership is:

```text
Agent.Workbench standard state
    -> Template

Concrete HEMS/product state
    -> Application
```

---

# 39. Success Criteria

The Redux architecture is correct when:

1. Redux state is organized by architectural responsibility.
2. Template owns reusable Redux infrastructure.
3. Template owns standard Agent.Workbench state.
4. Core does not depend on Template or Application Redux state.
5. Concrete Application reducers remain optional.
6. The current Agent.Workbench Application composition can operate without meaningful Application-specific Redux state.
7. Template does not import concrete Application reducers.
8. Application reducers cannot silently override Template reducer keys.
9. Template state typing does not require a concrete consumer Application.
10. Concrete Applications can add product-specific state through the supported extension mechanism.
11. Agent.Workbench reducers remain inside Template when they support standard Base Template functionality.
12. HEMS-specific state remains HEMS-owned.
13. Navigation configuration remains separate from Redux state.
14. Developer-facing configuration continues to use `application.properties`, `features.properties` and `navigation.properties`.
15. Architecture dependency boundaries remain testable.

---

# 40. Current Redux Summary

The Redux architecture follows:

```text
Application --> Template --> Core
```

Redux itself is not an architectural layer.

Template owns:

```text
reusable Redux infrastructure
reusable Base Template state
standard Agent.Workbench state
typed store integration
```

Application owns:

```text
optional concrete product-specific Redux state
```

Core owns:

```text
reusable technical capabilities
```

The current Agent.Workbench Application composition does not require meaningful Application-specific Redux state.

Agent.Workbench state under:

```text
src/template/state/agent-workbench/
```

is intentionally Template-owned.

It must not be described as transitional or as waiting for extraction into a separate Agent.Workbench repository.

Future consumer Applications such as HEMS may extend the Redux store with their own product-specific state without reversing the dependency direction.
