# Vision

## Purpose

`web.template` is evolving into the reusable foundation for multiple EnFlexIT
web applications.

The target architecture separates reusable technical capabilities, reusable
application-shell functionality, and concrete product functionality.

The fundamental dependency direction is:

```text
Application --> Template --> Core
```

The long-term repository model is:

```text
                    Base Template Repository
                    +------------------------+
                    | Template               |
                    |        |               |
                    |        v               |
                    | Core                   |
                    +-----------+------------+
                                ^
                                |
              +-----------------+-----------------+
              |                                   |
+---------------------------+       +---------------------------+
| Agent.Workbench           |       | HEMS                      |
| Application Repository    |       | Application Repository    |
+---------------------------+       +---------------------------+

              Future Application Repositories
```

Concrete applications consume the Base Template.

The Base Template must remain independent from every concrete application.

---

# Motivation

Different web applications require many of the same technical and
application-shell capabilities.

Examples include:

- Authentication
- OpenID Connect integration
- Session handling
- Server detection and switching
- Navigation infrastructure
- Redux infrastructure
- Notifications
- Update infrastructure
- Shared UI components
- Localization
- Theme support
- Common application layout
- Reusable settings functionality

Implementing these capabilities separately for every product would increase:

- Development effort
- Testing effort
- Maintenance effort
- Architectural drift
- Code duplication

The Base Template therefore provides a common reusable foundation.

Concrete applications should focus primarily on product-specific
configuration, screens, state and business functionality.

---

# Target Architecture

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

These layers represent ownership and dependency direction.

They are not simply folder names.

---

## Application

Application contains concrete product functionality.

Examples include:

- Application identity
- Application configuration
- Menus
- Tabs
- Feature flags
- Product-specific screens
- Product-specific Redux state
- Product-specific branding
- Product-specific business logic
- Product-specific backend integration
- Product-specific build configuration
- Product-specific deployment configuration

Examples of concrete applications are:

```text
Agent.Workbench
HEMS
future EnFlexIT applications
```

Application may depend on Template and reusable Core contracts.

Template and Core must never depend on a concrete Application.

---

## Template

Template contains reusable application-shell functionality.

It bridges reusable technical Core capabilities with React, Redux, navigation
and common application behavior.

Typical Template responsibilities include:

- Application bootstrap
- `TemplateApp`
- `createTemplateApp`
- Application configuration contract
- Application configuration context
- Navigation engine
- Redux infrastructure
- Authentication and session orchestration
- Server-selection UI
- Shared application layout
- Design system
- Notifications
- Update orchestration
- Common screens
- Reusable settings UI
- Localization UI
- Reusable React hooks
- Reusable feature components

Template may depend on Core.

Template must not import concrete Application functionality.

---

## Core

Core contains reusable technical capabilities that should remain independent
from concrete UI and product behavior.

Typical Core responsibilities include:

- Technical authentication helpers
- Server validation
- Server normalization
- Technical server detection
- Framework-independent utilities
- Reusable technical types
- Technical networking helpers
- Pure update helpers
- Storage-related technical capabilities where appropriate

Core must not depend on:

```text
Template
Application
```

Core should remain as framework-independent as reasonably possible.

React UI, Redux orchestration and product behavior do not belong in Core only
because they are reusable.

---

# Responsibility Principle

Reusability alone does not determine whether something belongs in Core.

The main question is:

```text
Who owns the responsibility?
```

For example:

```text
technical server normalization  --> Core
server-selection UI             --> Template
product server configuration    --> Application
```

Another example:

```text
technical authentication helper --> Core
session orchestration           --> Template
product-specific auth config    --> Application
```

This distinction prevents Core from becoming a collection of unrelated shared
code.

---

# Repository Vision

The target architecture uses a dedicated Base Template repository and separate
Application repositories.

Conceptually:

```text
Base Template Repository
|
+-- Core
+-- Template
+-- reusable contracts
+-- reusable tooling
+-- reusable UI
+-- reusable infrastructure

Agent.Workbench Repository
|
+-- application configuration
+-- menus
+-- tabs
+-- product screens
+-- product state
+-- branding
+-- product build/deployment

HEMS Repository
|
+-- application configuration
+-- menus
+-- tabs
+-- product screens
+-- product state
+-- branding
+-- product build/deployment
```

Future applications should follow the same model.

---

# Base Template

The Base Template is not a concrete Agent.Workbench application.

It provides the reusable runtime and application shell required by concrete
applications.

The Base Template may contain reusable features that are currently used by
Agent.Workbench, but product-specific behavior must eventually move to the
Agent.Workbench Application repository.

Physical location during migration does not automatically define final
architectural ownership.

---

# Application Contract

Applications integrate with Template through explicit contracts.

The current central contract is:

```text
ApplicationConfig
```

Template receives Application configuration instead of importing a concrete
Application.

Conceptually:

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
Reusable Template runtime
```

This inversion is essential for keeping Template independent.

---

# Application Configuration

Developer-facing Application configuration should remain simple.

The current direction uses:

```text
src/application/config/application.properties
```

instead of requiring product developers to edit Template internals.

Application configuration is transformed into the TypeScript configuration
required by the runtime.

Conceptually:

```text
application.properties
        |
        v
configuration generator
        |
        v
generated ApplicationConfig
        |
        v
createTemplateApp(...)
```

The Base Template defines the contract.

The concrete Application owns the values.

---

# Navigation

Navigation infrastructure belongs to Template.

Concrete navigation definitions belong to Application.

Conceptually:

```text
Application
|
+-- menu definitions
+-- tab definitions
+-- visibility configuration
        |
        v
Template
|
+-- navigation engine
+-- routing
+-- navigation presentation
```

Template must not hardcode concrete product menus or tabs.

---

# Redux

Redux is a technology, not an architecture layer.

State belongs to the layer that owns the responsibility.

Conceptually:

```text
Core
|
+-- normally no React/Redux application orchestration

Template
|
+-- reusable Template state
+-- store infrastructure
+-- reusable middleware/listeners

Application
|
+-- product-specific reducers
+-- product-specific state
```

The target Template store must support Application-owned reducers without
requiring Template to import them directly.

---

# Design System

Reusable React UI belongs primarily to Template.

The shared design system is part of the Base Template.

Conceptually:

```text
Application screen
        |
        v
Template design system
        |
        v
theme and reusable UI infrastructure
```

Product-specific UI remains in Application.

Core does not own React presentation components.

---

# Build and Deployment

Concrete applications ultimately own their product build and deployment
configuration.

This includes concerns such as:

- Product identity
- Application properties
- Product artifacts
- Deployment destinations
- Product-specific release workflows
- Helm configuration where applicable

The Base Template should provide reusable build capabilities and contracts
without permanently owning concrete product deployment configuration.

---

# Goals

The architecture should achieve the following goals:

- Provide one reusable Base Template for multiple applications.
- Keep Core technically focused and independent.
- Keep Template independent from concrete applications.
- Separate reusable application-shell functionality from business logic.
- Reduce duplicated implementation.
- Allow applications to evolve independently.
- Allow Template improvements to be reused by multiple applications.
- Simplify creation of future applications.
- Make architectural ownership visible in the repository structure.
- Provide stable contracts between Application and Template.
- Support independent Application build and deployment.
- Preserve runtime stability during migration.

---

# Design Principles

The architecture follows these principles:

1. Dependencies point inward:

   ```text
   Application --> Template --> Core
   ```

2. Core must not depend on Template or Application.

3. Template must not depend on a concrete Application.

4. Product-specific functionality belongs to Application.

5. Reusable React UI and application-shell behavior belong to Template.

6. Reusable technical capabilities belong to Core when they are sufficiently
   independent from UI and product behavior.

7. Redux ownership follows responsibility.

8. Application configuration should be explicit and simple.

9. Stable contracts should be preferred over deep cross-layer imports.

10. Separate Application repositories should consume the Base Template rather
    than modify it for product-specific behavior.

11. Repository migration should be incremental.

12. Existing runtime behavior should remain stable while architectural
    boundaries are introduced.

---

# Migration Strategy

The current repository is transitional.

Some product-specific Agent.Workbench functionality still physically exists
inside Template.

This is acceptable while the architecture is being separated.

The migration should proceed incrementally:

```text
1. Define ownership
2. Establish dependency boundaries
3. Create stable contracts
4. Move reusable infrastructure
5. Identify product-specific functionality
6. Prepare Application integration points
7. Create separate Application repositories
8. Extract product-specific code
9. Validate builds and runtime
```

Code must not be moved merely to make the directory tree look complete.

Ownership and runtime safety come first.

---

# Non-Goals

The architecture does not aim to:

- Put every reusable function into Core.
- Turn Core into a UI framework.
- Make Template aware of every Application.
- Add a runtime resolver that selects between multiple concrete applications.
- Keep multiple concrete applications inside the Base Template repository
  permanently.
- Force every application to use product-specific Agent.Workbench behavior.
- Perform the repository split in one large refactoring step.

---

# Long-Term Objective

The final architecture should make it possible to create a new EnFlexIT web
application primarily by providing:

```text
Application configuration
Product navigation
Product screens
Product state
Product branding
Product business functionality
Product build/deployment configuration
```

while consuming reusable capabilities from the Base Template.

The resulting dependency direction remains:

```text
Application
    |
    v
Template
    |
    v
Core
```

The Base Template can then evolve independently while concrete applications
remain focused on their own product requirements.

This provides a sustainable foundation for Agent.Workbench, HEMS and future
EnFlexIT web applications.