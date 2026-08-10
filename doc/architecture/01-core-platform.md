# Core Platform

## Purpose

Core is the lowest reusable technical layer of the `web.template`
architecture.

The overall dependency direction is:

```text
Application --> Template --> Core
```

Core provides reusable technical capabilities that should remain independent
from concrete applications and, where reasonably possible, from React,
Redux and presentation concerns.

Core is not the complete Base Template.

The reusable application shell belongs to Template.

---

# 1. Architectural Position

The architecture contains three responsibility layers:

```text
Application
    |
    v
Template
    |
    v
Core
```

The layers have different purposes.

```text
Application
|
+-- concrete product functionality

Template
|
+-- reusable React application shell
+-- reusable orchestration
+-- reusable UI
+-- reusable state infrastructure

Core
|
+-- reusable technical capabilities
+-- technical types
+-- framework-independent helpers
```

Allowed dependencies point toward the lower reusable layers.

Core must not depend on Template or Application.

---

# 2. Core Responsibility

Core owns technical functionality that can be reused without knowing which
product is running.

Typical characteristics of Core code are:

- Application-independent
- UI-independent where possible
- Independent from concrete product configuration
- Reusable across different applications
- Focused on technical behavior
- Suitable for use by Template infrastructure

Core should not become a general folder for every shared function.

Reusability alone is not enough to justify Core ownership.

---

# 3. Current Core Areas

Current reusable Core functionality includes technical areas such as:

```text
src/core/authentication/
src/core/server/
src/core/update/
```

These areas represent technical capabilities rather than product UI or
application-shell orchestration.

The Core structure may continue to evolve as responsibilities are reviewed.

This document does not imply that every reusable project feature must move
into Core.

---

# 4. Authentication

Technical authentication capabilities may belong to Core.

Current examples include functionality under:

```text
src/core/authentication/
```

Known responsibilities include:

- HTTP authentication integration
- Authentication-related technical types
- Logout-flow protection
- Reusable authentication helpers

Examples of current files include:

```text
src/core/authentication/http/attachAuthInterceptors.tsx
src/core/authentication/logout/logoutFlowGuard.ts
src/core/authentication/types.ts
```

Core authentication must remain independent from concrete application UI.

---

# 5. Authentication Boundary

Authentication is intentionally split between Core and Template.

Conceptually:

```text
Core
|
+-- technical authentication capability
+-- request integration
+-- technical auth types
+-- framework-independent guards where possible

Template
|
+-- login UI
+-- session orchestration
+-- JWT renewal orchestration
+-- OIDC session handling
+-- Redux authentication state
+-- logout orchestration

Application
|
+-- product-specific authentication configuration where required
```

Therefore:

```text
Authentication != entirely Core
```

Only the technical part belongs in Core.

---

# 6. Server Infrastructure

Reusable technical server functionality belongs to Core.

Current implementation exists under:

```text
src/core/server/
```

Known responsibilities include:

- Server input normalization
- Server validation
- Technical connectivity checks
- Backend environment detection
- Parsing reusable server information
- Reusable server-related types

Current files include:

```text
src/core/server/detectServerEnvironment.ts
src/core/server/normalizeServerInputs.ts
src/core/server/serverCheck.ts
src/core/server/serverValidation.ts
src/core/server/types.ts
```

---

# 7. Server Boundary

Server functionality is split by responsibility.

Conceptually:

```text
Core
|
+-- normalize server address
+-- validate server input
+-- perform technical checks
+-- parse reusable backend information

Template
|
+-- server-selection state
+-- connectivity Redux state
+-- server-selection UI
+-- reconnect orchestration
+-- presentation

Application
|
+-- product-specific server configuration
```

The fact that server functionality is reusable does not mean all server-related
state and UI belong in Core.

---

# 8. Update Infrastructure

Core may contain pure technical update helpers.

Current reusable update functionality includes:

```text
src/core/update/
```

A known helper is:

```text
src/core/update/reloadUpdatedFrontendWebApp.ts
```

Its responsibility is technical reload behavior.

Update orchestration itself belongs to Template.

---

# 9. Update Boundary

The update system is intentionally split.

```text
Core
|
+-- pure technical update helpers

Template
|
+-- update Redux state
+-- update hooks
+-- update watchers
+-- update dialogs
+-- update notifications
+-- backend/frontend update orchestration

Application
|
+-- product-specific update behavior if required
```

Therefore these are not Core responsibilities merely because they are
reusable:

```text
Redux update slice
UpdateNotificationWatcher
PostLoginUpdateWatcher
Update UI
Update dialogs
```

They belong to Template.

---

# 10. Networking and API Concerns

Technical HTTP helpers may belong to Core when they are independent from
application state and product behavior.

However, not every API implementation belongs in Core.

For example:

```text
generic request helper              --> possible Core
authentication interceptor          --> Core
Redux API state                     --> Template
product-specific endpoint handling  --> Application
```

The ownership decision depends on responsibility.

---

# 11. Types

Technical types that are independent from product and Template presentation
may belong to Core.

Examples include types used by:

- Server validation
- Authentication helpers
- Technical networking
- Framework-independent utilities

Types should not be moved to Core simply because multiple files import them.

Their semantic owner matters.

---

# 12. Utilities

Reusable technical utility functions may belong to Core when they:

- Do not require React UI
- Do not depend on Redux application state
- Do not import Template
- Do not depend on concrete Application functionality
- Represent a stable technical capability

A generic helper is not automatically Core.

Feature-owned helpers should remain with their feature.

---

# 13. What Does Not Belong in Core

The following responsibilities generally do not belong in Core:

```text
React application bootstrap
TemplateApp
createTemplateApp
React providers
Redux store composition
Redux slices
navigation rendering
menu UI
tab UI
dialogs
buttons
cards
layout components
notifications UI
theme presentation
localization UI
screens
product branding
product menus
product tabs
product business logic
```

These belong to Template or Application depending on ownership.

---

# 14. Bootstrap

Application bootstrap belongs to Template and Application composition, not to
Core.

The current application entry point conceptually performs:

```text
Application configuration
        |
        v
createTemplateApp(...)
        |
        v
TemplateApp
        |
        v
registerRootComponent(...)
```

The relevant reusable bootstrap contract belongs under:

```text
src/template/application/
```

Core must not know which React application is being registered.

---

# 15. Redux

Redux is not a Core module.

Redux is an implementation technology used primarily by Template and
Application.

The ownership model is:

```text
Template
|
+-- reusable Redux infrastructure
+-- Template reducers
+-- store composition

Application
|
+-- product-specific reducers
+-- product-specific state
```

Core should not depend on the Redux application store.

Pure technical code should preferably receive required values explicitly
instead of reading global Redux state.

---

# 16. Navigation

Navigation infrastructure belongs to Template.

Examples include:

```text
routing
menu infrastructure
tab infrastructure
navigation rendering
visibility integration
```

Concrete menu and tab definitions belong to Application.

Conceptually:

```text
Application navigation configuration
              |
              v
Template navigation engine
```

Core does not need to know about menus, tabs or React Navigation.

---

# 17. Notifications

Notification presentation and reusable notification state belong to Template.

Core technical functionality may return errors or technical results, but it
should not directly create product UI notifications.

Conceptually:

```text
Core technical result
        |
        v
Template orchestration
        |
        v
Template notification state/UI
```

This keeps technical functionality independent from presentation.

---

# 18. User Profile

Reusable user-profile UI and Redux state belong to Template when they are part
of the shared application shell.

Technical identity/authentication information may originate from Core
capabilities.

Product-specific profile functionality belongs to Application.

User Profile is therefore not a single Core module.

---

# 19. Dynamic Content

Dynamic-content React infrastructure currently belongs to Template.

The current implementation lives under:

```text
src/template/components/dynamic-content/
```

It contains reusable rendering and editing UI.

React dynamic-content components must not be moved to Core simply because they
are reusable.

Their final Template/Application ownership may still be reviewed, but they are
not Core presentation infrastructure.

---

# 20. Shared Components

Reusable UI components belong to Template.

The shared design system lives under:

```text
src/template/components/design-system/
```

Examples include:

```text
buttons
cards
dialogs
inputs
tables
charts
theme-aware components
typography
icons
```

Core must not import those components.

---

# 21. Localization

Localization has technical and presentation aspects.

Reusable application localization currently belongs primarily to Template.

Examples include:

```text
i18next initialization
translation resources
language-selection UI
```

The language switcher is Template UI.

Core should only contain localization-related technical helpers if they are
truly independent from the Template runtime.

Localization is therefore not automatically a Core module.

---

# 22. Theme

The visual theme and reusable themed components belong to Template.

Current reusable design-system areas include:

```text
src/template/components/design-system/themed/
src/template/components/design-system/stylistic/
```

Theme presentation is part of the reusable application shell.

Core must remain independent from visual theme implementation.

---

# 23. Configuration

Configuration ownership is split between Application and Template tooling.

Concrete Application values belong to Application.

Current source configuration:

```text
src/application/config/application.properties
```

Template defines the configuration contract and generation/integration
mechanism.

Conceptually:

```text
Application properties
        |
        v
Template configuration tooling
        |
        v
ApplicationConfig
        |
        v
Template runtime
```

Core must not depend on concrete Application configuration.

---

# 24. ApplicationConfig Is Not Core Product Data

The Application contract enables dependency inversion.

Template receives configuration from Application instead of importing product
code.

Conceptually:

```text
Application
    |
    v
ApplicationConfig
    |
    v
Template
```

Technical Core functionality may receive individual technical values when
necessary, but Core should not become aware of the entire concrete
Application configuration.

---

# 25. Dependency Rules

The fundamental dependency rule is:

```text
Application --> Template --> Core
```

Allowed:

```text
Application imports Template
Application imports Core where appropriate
Template imports Core
Core imports Core
```

Not allowed:

```text
Core imports Template
Core imports Application
Template imports concrete Application implementation
```

The dependency direction must remain acyclic.

---

# 26. Dependency Example

Correct:

```text
Application screen
        |
        v
Template component
        |
        v
Core server validator
```

Incorrect:

```text
Core server validator
        |
        v
Template notification component
```

A Core function should return a technical result.

Template decides how that result is presented.

---

# 27. Framework Independence

Core should remain framework-independent where practical.

This does not require artificially removing every framework-related type from
Core immediately.

The important architectural direction is:

```text
technical capability
        |
        v
minimal framework coupling
```

New Core code should avoid introducing unnecessary dependencies on:

```text
React UI
Redux store
React Navigation
concrete Application modules
Template components
```

---

# 28. Core Public API

Long term, Core should expose stable technical contracts instead of requiring
consumers to depend on arbitrary internal files.

Conceptually:

```text
Core public API
|
+-- authentication
+-- server
+-- update helpers
+-- technical types
+-- utilities
```

The exact package/export structure can evolve as repository separation
continues.

Do not create a large public API prematurely.

---

# 29. Core and Base Template

Core is only one part of the Base Template.

The relationship is:

```text
Base Template Repository
|
+-- Template
|    |
|    +-- React application shell
|    +-- design system
|    +-- navigation
|    +-- Redux
|    +-- reusable UI/features
|    +-- orchestration
|
+-- Core
     |
     +-- technical capabilities
```

The Base Template repository provides both layers.

Concrete Applications consume the Base Template.

---

# 30. Core and Product Applications

Core must not contain product-specific code.

Examples of product-specific concerns include:

```text
Agent.Workbench data analysis
Agent.Workbench business settings
HEMS domain functionality
product-specific dashboards
product-specific APIs
product-specific workflows
product-specific branding
```

These belong to their concrete Application.

During migration, some product code may still physically exist in Template.

That transitional physical location does not make it Core.

---

# 31. Stability

Core should be stable, but it is not expected to stop evolving.

Reusable technical capabilities may still change when:

- Technical requirements change
- Security requirements change
- Backend contracts evolve
- Bugs are fixed
- Better reusable abstractions are identified

The goal is controlled evolution, not immobility.

---

# 32. Design Rules

Core changes must follow these rules:

1. Core must not depend on Template.
2. Core must not depend on Application.
3. Core must not contain concrete product business logic.
4. Core should avoid React presentation concerns.
5. Core should avoid Redux application-state ownership.
6. Core should expose technical behavior rather than UI behavior.
7. Core should remain reusable across applications.
8. Core functionality should have clear technical ownership.
9. Reusability alone does not justify moving code into Core.
10. Product-specific behavior belongs to Application.
11. Reusable application-shell behavior belongs to Template.
12. Dependency cycles across architecture layers are not allowed.

---

# 33. Migration Rules

Core extraction should happen incrementally.

Before moving code into Core:

```text
1. Identify the responsibility.
2. Check whether the code is product-independent.
3. Check whether it requires Template UI/state.
4. Remove unnecessary upward dependencies.
5. Define a clear technical contract.
6. Move only the coherent technical capability.
7. Update imports explicitly.
8. Run TypeScript validation.
9. Run affected tests.
10. Validate runtime behavior.
```

Do not move entire feature folders into Core solely because part of the
feature is reusable.

---

# 34. Current Status

## Implemented

Current Core architecture already includes reusable technical areas such as:

```text
authentication
server infrastructure
technical update helpers
```

The dependency direction toward Core is established conceptually and is being
enforced incrementally.

---

## Transitional

Some responsibilities are still being separated.

Examples include:

```text
API ownership
authentication boundaries
server orchestration boundaries
feature helper ownership
Application extraction
```

Some Agent.Workbench-specific functionality still physically resides under
Template until separate Application repositories are ready.

---

## Planned

Future work includes:

- Continue reviewing Core/Template boundaries.
- Keep Core free from product-specific imports.
- Keep Redux orchestration outside Core.
- Expose stable technical contracts where useful.
- Extract additional technical capabilities only when ownership is clear.
- Validate architectural dependencies automatically where practical.
- Support the future Base Template package/repository integration model.

---

# 35. Non-Goals

Core is not intended to become:

```text
the entire Base Template
a React component library
a Redux framework
a navigation framework
an Agent.Workbench framework
a repository for every reusable helper
a place for concrete product configuration
```

These distinctions are essential to keeping the architecture maintainable.

---

# 36. Long-Term Objective

The long-term objective is a focused technical Core that supports a reusable
Template without knowing which concrete product consumes it.

The architecture remains:

```text
Application
    |
    v
Template
    |
    v
Core
```

Core provides stable technical capabilities.

Template provides reusable application behavior.

Application provides concrete product functionality.

This separation allows Agent.Workbench, HEMS and future applications to reuse
the same Base Template while remaining independent from each other.