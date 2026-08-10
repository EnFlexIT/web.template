# Application Contract

## Purpose

This document defines the integration boundary between a concrete Application
and the reusable Base Template.

The architecture follows:

```text
Application --> Template --> Core
```

A concrete Application must be able to configure and compose the Template
without requiring Template to import concrete product implementation.

The Application contract is the central mechanism for achieving this
dependency inversion.

---

# 1. Architectural Role

The Base Template must remain independent from concrete products such as:

```text
Agent.Workbench
HEMS
future EnFlexIT applications
```

Instead of Template selecting or importing an Application, the concrete
Application provides configuration to Template.

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

This preserves the dependency direction:

```text
Application --> Template
```

and prevents:

```text
Template --> concrete Application
```

---

# 2. Current Contract Files

The currently verified Template-side contract files are:

```text
src/template/application/
|
+-- ApplicationConfig.ts
+-- ApplicationConfigContext.tsx
+-- createTemplateApp.tsx
+-- TemplateApp.tsx
```

The currently verified Application-side files are:

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

Not every file shown above belongs to the same active runtime contract.

The distinction is explained below.

---

# 3. ApplicationConfig

The current central Application contract is:

```ts
ApplicationConfig
```

It is defined in:

```text
src/template/application/ApplicationConfig.ts
```

The current type is conceptually:

```ts
export type ApplicationConfig<TState = unknown> = {
  id: string;
  displayName: string;
  navigation: {
    menu: {
      items: readonly StaticMenuItem[];
      isEnabled: MenuVisibilityResolver;
    };
    tabs: {
      items: readonly StaticTabItem[];
      isEnabled: TabVisibilityResolver<TState>;
    };
  };
};
```

The contract currently provides:

```text
Application identity
menu configuration
menu visibility resolution
tab configuration
tab visibility resolution
```

---

# 4. Application Identity

The current identity fields are:

```ts
id: string;
displayName: string;
```

Their responsibilities are:

```text
id
  stable technical Application identifier

displayName
  human-readable Application name
```

Template can consume these values without knowing which concrete product is
running.

---

# 5. Navigation Contract

Navigation is split by ownership.

Template owns reusable navigation infrastructure.

Application owns concrete navigation definitions.

Conceptually:

```text
Application
|
+-- menu items
+-- menu visibility
+-- tab items
+-- tab visibility
        |
        v
Template
|
+-- navigation engine
+-- routing
+-- menu rendering
+-- tab rendering
```

The current contract represents this through:

```ts
navigation.menu
navigation.tabs
```

---

# 6. Menu Contract

The current menu contract is:

```ts
menu: {
  items: readonly StaticMenuItem[];
  isEnabled: MenuVisibilityResolver;
};
```

Concrete Applications provide the menu definitions.

Template decides how those definitions are rendered and integrated into the
shared application shell.

Template must not hardcode concrete Agent.Workbench or HEMS menu structures.

---

# 7. Menu Visibility

Menu visibility is evaluated through:

```ts
MenuVisibilityResolver
```

The current visibility context includes:

```ts
authenticationMethod?: AuthMethod;
```

Conceptually:

```text
Application menu definition
        +
Template-provided runtime context
        |
        v
Application visibility resolver
        |
        v
enabled / disabled
```

This allows product-specific visibility decisions without requiring Template
to know product rules.

---

# 8. Tab Contract

The current tab contract is:

```ts
tabs: {
  items: readonly StaticTabItem[];
  isEnabled: TabVisibilityResolver<TState>;
};
```

Concrete Applications provide:

```text
tab definitions
tab visibility behavior
```

Template provides reusable tab infrastructure and presentation.

---

# 9. Generic State Context

Tab visibility supports a generic state type:

```ts
ApplicationConfig<TState = unknown>
```

and:

```ts
TabVisibilityContext<TState>
```

This allows Application-specific visibility logic to depend on an appropriate
state representation without hardcoding concrete Application state into the
Template contract.

The generic state mechanism must remain compatible with the ongoing Redux
separation.

---

# 10. Dependency Inversion

The contract exists primarily to invert the dependency between Template and
Application.

Incorrect architecture:

```text
Template
   |
   v
Agent.Workbench configuration
```

Correct architecture:

```text
Agent.Workbench
   |
   v
ApplicationConfig
   |
   v
Template
```

Template defines the contract.

Application implements or supplies the contract.

---

# 11. createTemplateApp

The current composition function is:

```text
src/template/application/createTemplateApp.tsx
```

Its conceptual signature is:

```ts
createTemplateApp<TState = unknown>(
  config: ApplicationConfig<TState>,
)
```

The concrete Application passes its configuration into this function.

Conceptually:

```text
Application
        |
        | applicationConfig
        v
createTemplateApp(...)
        |
        v
TemplateApp
```

---

# 12. Current Entry Point

The current root composition follows this model:

```ts
import { applicationConfig } from "./src/application";
import { createTemplateApp } from "./src/template/application/createTemplateApp";

const App = createTemplateApp(applicationConfig);
```

The resulting component is then registered as the application root.

This means the entry point selects the concrete Application.

Template itself does not contain a multi-application resolver.

---

# 13. No Runtime Application Resolver

The architecture intentionally does not use:

```text
Template
|
+-- detect Agent.Workbench
+-- detect HEMS
+-- select Application
```

Instead, each concrete Application repository will provide its own composition
entry point.

Conceptually:

```text
Agent.Workbench repository
|
+-- applicationConfig
+-- createTemplateApp(applicationConfig)

HEMS repository
|
+-- applicationConfig
+-- createTemplateApp(applicationConfig)
```

This keeps product selection outside the Base Template.

---

# 14. ApplicationConfigContext

Selected Application configuration is exposed to reusable Template UI through:

```text
src/template/application/ApplicationConfigContext.tsx
```

The current context exposes:

```ts
id
displayName
```

The current context value is conceptually:

```ts
Pick<ApplicationConfig<unknown>, "id" | "displayName">
```

This provides runtime access to Application identity without introducing an
upward Template dependency.

---

# 15. useApplicationConfig

Reusable Template components can access Application identity through:

```ts
useApplicationConfig()
```

Conceptually:

```text
ApplicationConfig
        |
        v
ApplicationConfigProvider
        |
        v
Template component
        |
        v
useApplicationConfig()
```

This is the preferred approach for values that are part of the formal
Application contract.

---

# 16. Application Identity Is No Longer a Direct Environment Dependency

Application identity should not be read directly inside Template from a
product-specific environment variable.

The previous direct title approach has been replaced by the Application
contract.

Conceptually:

```text
Application-owned configuration
        |
        v
ApplicationConfig
        |
        v
Template context
        |
        v
Template UI
```

This keeps product identity outside Template implementation.

---

# 17. Developer-Facing Configuration

Concrete Application developers should not be required to edit TypeScript
Template internals for basic product configuration.

The current developer-facing source is:

```text
src/application/config/application.properties
```

This file belongs to the Application side of the architecture.

---

# 18. Current Properties Configuration

The current properties configuration contains Application-owned values such
as:

```properties
ApplicationId=agent-workbench
ApplicationTitle=Agent.Workbench
```

Additional Application metadata may also exist in the properties file.

However, not every properties key is currently part of the runtime
`ApplicationConfig` contract.

Documentation must distinguish:

```text
properties available in source configuration
from
properties currently mapped into ApplicationConfig
```

---

# 19. Required Generated Identity

The current configuration generator requires the Application identity needed
to produce the runtime configuration.

The central current properties are:

```text
ApplicationId
ApplicationTitle
```

They are transformed conceptually into:

```text
ApplicationId
      |
      v
id

ApplicationTitle
      |
      v
displayName
```

---

# 20. Configuration Generator

The current generator is:

```text
src/template/config/build/generateApplicationConfig.mjs
```

It transforms developer-facing Application properties into TypeScript runtime
configuration.

Conceptually:

```text
application.properties
        |
        v
generateApplicationConfig.mjs
        |
        v
applicationConfig.generated.ts
```

---

# 21. Generated Runtime Configuration

The generated file is:

```text
src/application/generated/applicationConfig.generated.ts
```

This file provides the TypeScript configuration consumed by the runtime.

Generated code should not become the primary developer-facing configuration
surface.

The preferred flow is:

```text
developer edits properties
        |
        v
generator
        |
        v
generated TypeScript
```

---

# 22. Current Generator Limitation

The current generator does not yet represent every future Application
capability.

At the current migration stage it primarily establishes Application identity
and a valid `ApplicationConfig` structure.

The current generated navigation configuration can still be minimal while the
full navigation extraction is being completed.

This is transitional.

---

# 23. Properties vs ApplicationConfig

The two concepts are related but not identical.

```text
application.properties
```

is the developer-facing configuration source.

```text
ApplicationConfig
```

is the typed Template/Application runtime contract.

The generator bridges them.

Conceptually:

```text
Developer-facing format
        |
        v
Build-time transformation
        |
        v
Typed runtime contract
```

---

# 24. Why Properties Are Used

The Application configuration source is intentionally kept simple.

Concrete Application developers should be able to configure common values
without writing Template TypeScript.

The current direction therefore prefers:

```text
key=value
```

configuration.

Example:

```properties
ApplicationId=agent-workbench
ApplicationTitle=Agent.Workbench
```

This is simpler than requiring direct changes to:

```text
TemplateApp
Template internals
environment-specific UI code
```

---

# 25. Application index.ts

The current Application public entry point is:

```text
src/application/index.ts
```

It exports Application-owned integration values required by the current
repository composition.

Currently this includes the generated:

```text
applicationConfig
```

and the transitional:

```text
applicationReducers
```

These two exports have different runtime maturity.

---

# 26. Current Active Contract

The currently active Application-to-Template integration is:

```text
applicationConfig
        |
        v
createTemplateApp(...)
```

This is already part of the running application composition.

It is the current primary Application contract.

---

# 27. Prepared Redux Extension Contract

A second integration mechanism is being prepared for Redux state.

The current Application-side registry is:

```text
src/application/state/applicationReducers.ts
```

The reusable reducer contract is defined under:

```text
src/template/state/store/types.ts
```

and the prepared store factory is:

```text
src/template/state/store/createTemplateStore.ts
```

Conceptually:

```text
Application reducers
        |
        v
ApplicationReducers
        |
        v
createTemplateStore(...)
```

---

# 28. Redux Extension Is Not Active Yet

The prepared reducer-composition contract must not be confused with the active
ApplicationConfig integration.

At the current checkpoint:

```text
ApplicationConfig integration --> active

Application reducer composition --> prepared, not yet active
```

The existing Redux store remains the active runtime store.

---

# 29. Why Redux Activation Is Deferred

The new store composition still requires validation of:

```text
state typing
typed hooks
existing reducer consumers
runtime initialization
Agent.Workbench-specific state
Template state ownership
```

Therefore `createTemplateStore` must not be connected prematurely.

The Application contract should evolve without destabilizing the working
application.

---

# 30. Reducer Ownership

The target Redux ownership is:

```text
Template
|
+-- reusable Template reducers

Application
|
+-- product-specific reducers
```

The future store composition should combine both without requiring Template to
import product-specific reducer implementations.

Conceptually:

```text
Template reducers
        +
Application reducers
        |
        v
Template store factory
```

---

# 31. Collision Protection

The prepared store factory rejects reducer-key collisions between Template and
Application reducers.

This prevents an Application from silently replacing Template-owned state.

Conceptually:

```text
Template reducer key
        +
Application reducer key
        |
        v
collision check
        |
        +-- unique --> compose
        |
        +-- duplicate --> fail
```

This protects the integration boundary.

---

# 32. Screens

Concrete product screens belong to Application.

Reusable application-shell screens belong to Template.

The contract must eventually allow product navigation to reference
Application-owned screens without Template importing concrete product
implementations.

This extraction is not yet complete.

---

# 33. Branding

Concrete branding belongs to Application.

Examples include:

```text
Application logo
product identity
product-specific visual assets
```

Reusable theme and design-system infrastructure belong to Template.

The final branding contract is not yet fully defined.

Therefore this document must not claim that all branding configuration is
already available through `ApplicationConfig`.

---

# 34. Backend Integration

Backend ownership follows responsibility.

Generic technical communication may belong to Core or Template infrastructure.

Concrete product endpoints and product business APIs belong to Application.

The current `ApplicationConfig` does not attempt to model every backend
endpoint.

Product API ownership remains an ongoing extraction topic.

---

# 35. Build and Deployment

Concrete Application repositories ultimately own their own build and
deployment configuration.

Examples include:

```text
Application identity
Application properties
product release configuration
deployment targets
Helm configuration where applicable
```

The Base Template provides reusable capability and contracts.

It should not permanently own concrete product deployment configuration.

---

# 36. Future Repository Contract

The long-term model is:

```text
Base Template Repository
|
+-- Template
+-- Core
+-- reusable contracts
+-- reusable tooling

Agent.Workbench Repository
|
+-- Application configuration
+-- Application navigation
+-- Application screens
+-- Application state
+-- Application branding
+-- Application business logic
+-- build/deployment

HEMS Repository
|
+-- Application configuration
+-- Application navigation
+-- Application screens
+-- Application state
+-- Application branding
+-- Application business logic
+-- build/deployment
```

Each Application consumes the Base Template.

---

# 37. Template Must Not Know Concrete Applications

The following is prohibited:

```text
Template
|
+-- if Agent.Workbench ...
+-- if HEMS ...
+-- import AgentWorkbenchScreen
+-- import HemsConfig
```

Product-specific branching creates an upward dependency and destroys Template
reusability.

The Application contract exists specifically to avoid this.

---

# 38. Stable Contract Principle

Applications should integrate through stable contracts rather than deep
imports into Template internals.

Preferred:

```text
ApplicationConfig
Template public API
documented extension points
```

Avoid:

```text
deep imports into arbitrary Template implementation files
product-specific patches inside Template
Template imports from concrete Application folders
```

The exact public package API can evolve as repository extraction continues.

---

# 39. Contract Evolution

The Application contract is expected to evolve.

Possible future additions may include:

```text
branding
screen registration
feature registration
additional navigation configuration
product services
additional build metadata
```

These are not automatically considered implemented.

Every new contract field should be added only when there is a clear reusable
integration requirement.

---

# 40. Contract Design Rule

Do not add fields to `ApplicationConfig` simply because a concrete product has
a value.

Before extending the contract, determine:

```text
Does Template actually need this value?
```

If not, the value should remain Application-owned.

This keeps the contract small and stable.

---

# 41. Core Independence

The Application contract primarily connects Application to Template.

Core should not receive the entire concrete `ApplicationConfig`.

If a Core capability needs a technical value, it should receive the minimum
technical value required through an appropriate interface.

Conceptually:

```text
ApplicationConfig
        |
        v
Template orchestration
        |
        v
specific technical value
        |
        v
Core capability
```

This prevents Core from becoming product-aware.

---

# 42. Current Contract Status

## Implemented and active

```text
ApplicationConfig
Application identity
menu contract
tab contract
visibility resolver contracts
ApplicationConfigContext
useApplicationConfig
createTemplateApp
generated applicationConfig
properties-based identity configuration
Application entry-point composition
```

## Implemented but transitional

```text
properties generator tied to current repository paths
minimal generated navigation configuration
Application-side applicationReducers registry
ApplicationReducers type
createTemplateStore
reducer collision protection
```

## Not yet active

```text
Application reducer composition in TemplateApp
new extensible Redux runtime store
```

## Not yet finalized

```text
branding contract
screen registration contract
feature/API ownership contract
separate-repository generator interface
Base Template distribution mechanism
Application build/deployment contract
```

---

# 43. Current Integration Diagram

The currently active integration is:

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
src/application/index.ts
        |
        v
createTemplateApp(applicationConfig)
        |
        v
TemplateApp
        |
        v
Template runtime
        |
        v
Core technical capabilities
```

The Redux extension is currently parallel:

```text
applicationReducers
        |
        v
ApplicationReducers
        |
        v
createTemplateStore
        |
        v
prepared architecture

NOT YET ACTIVE IN TemplateApp
```

---

# 44. Design Rules

The Application contract follows these rules:

1. Application depends on Template, never the other way around.
2. Template must not import concrete product implementation.
3. Core must remain independent from Application.
4. Application identity must flow through the contract.
5. Concrete navigation definitions belong to Application.
6. Navigation infrastructure belongs to Template.
7. Product-specific Redux state belongs to Application.
8. Reusable Redux infrastructure belongs to Template.
9. Developer-facing configuration should remain simple.
10. Generated TypeScript is not the primary manual configuration surface.
11. Contract fields should exist only when Template requires them.
12. Product-specific build and deployment remain Application concerns.
13. Prepared extension points must not be documented as active prematurely.
14. The contract must support separate Application repositories.
15. Runtime stability has priority during migration.

---

# 45. Success Criteria

The Application contract is successful when:

1. A concrete Application can identify and configure itself without modifying
   Template internals.
2. Template can run without importing concrete Application code.
3. Core remains independent from Application.
4. Product navigation can be supplied through an explicit contract.
5. Product Redux state can eventually be registered without Template imports.
6. Application configuration remains simple for product developers.
7. Separate Application repositories can consume the same Base Template.
8. Agent.Workbench-specific behavior can be removed from Template without
   breaking reusable Template functionality.
9. HEMS can provide its own Application configuration without changes inside
   Template.
10. The contract remains small, explicit and maintainable.